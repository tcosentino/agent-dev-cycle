import Database from 'better-sqlite3'
import type { ResourceStore } from './types'
import type { ResourceDefinition } from '../define'
import type { ZodObject, ZodRawShape } from 'zod'

export interface SqliteStoreOptions {
  db: Database.Database
  tableName: string
}

// Map Zod types to SQLite column types
function zodTypeToSqlite(zodType: unknown): string {
  const typeName = (zodType as { _def?: { typeName?: string } })?._def?.typeName
  switch (typeName) {
    case 'ZodNumber':
      return 'INTEGER'
    case 'ZodBoolean':
      return 'INTEGER' // SQLite uses 1/0 for bools
    case 'ZodDate':
      return 'TEXT' // Store as ISO string
    default:
      return 'TEXT'
  }
}

// Create table from resource schema
export function createTableFromResource<T extends ZodObject<ZodRawShape>>(
  db: Database.Database,
  resource: ResourceDefinition<T>,
  tableName?: string
): void {
  const name = tableName ?? `${resource.name}s`
  const shape = resource.schema.shape

  const columns: string[] = ['id TEXT PRIMARY KEY']

  for (const [key, zodType] of Object.entries(shape)) {
    if (key === 'id') continue // Already added

    const sqlType = zodTypeToSqlite(zodType)
    const isOptional = (zodType as { _def?: { typeName?: string } })?._def?.typeName === 'ZodOptional'
      || (zodType as { isOptional?: () => boolean })?.isOptional?.()

    columns.push(`${toSnakeCase(key)} ${sqlType}${isOptional ? '' : ' NOT NULL'}`)
  }

  const sql = `CREATE TABLE IF NOT EXISTS ${name} (${columns.join(', ')})`
  db.exec(sql)
}

// Convert camelCase to snake_case
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

// Convert snake_case to camelCase
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// Convert object keys from camelCase to snake_case
function toDbRecord(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    let dbValue: unknown = value
    // Convert Date to ISO string
    if (value instanceof Date) {
      dbValue = value.toISOString()
    }
    // Convert arrays and objects to JSON strings
    else if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
      dbValue = JSON.stringify(value)
    }
    result[toSnakeCase(key)] = dbValue
  }
  return result
}

// Convert object keys from snake_case to camelCase
function fromDbRecord<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    let jsValue: unknown = value
    // Try to parse JSON strings back to arrays/objects
    if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
      try {
        jsValue = JSON.parse(value)
      } catch {
        // Not valid JSON, keep as string
      }
    }
    result[toCamelCase(key)] = jsValue
  }
  return result as T
}

export function createSqliteStore<T extends Record<string, unknown>>(
  options: SqliteStoreOptions
): ResourceStore<T> {
  const { db, tableName } = options

  return {
    async findAll(opts) {
      const conditions: string[] = []
      const params: unknown[] = []

      // Filter by where clause
      if (opts?.where) {
        for (const [key, value] of Object.entries(opts.where)) {
          conditions.push(`${toSnakeCase(key)} = ?`)
          params.push(value)
        }
      }

      // Search across searchable fields
      if (opts?.search && opts?.searchFields?.length) {
        const searchConditions = opts.searchFields.map(field =>
          `${toSnakeCase(field)} LIKE ?`
        )
        conditions.push(`(${searchConditions.join(' OR ')})`)
        const searchParam = `%${opts.search}%`
        opts.searchFields.forEach(() => params.push(searchParam))
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const sql = `SELECT * FROM ${tableName} ${whereClause}`

      const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
      return rows.map(row => fromDbRecord<T>(row))
    },

    async findById(id) {
      const sql = `SELECT * FROM ${tableName} WHERE id = ?`
      const row = db.prepare(sql).get(id) as Record<string, unknown> | undefined
      return row ? fromDbRecord<T>(row) : null
    },

    async findOne(where) {
      const conditions: string[] = []
      const params: unknown[] = []

      for (const [key, value] of Object.entries(where)) {
        conditions.push(`${toSnakeCase(key)} = ?`)
        params.push(value)
      }

      const sql = `SELECT * FROM ${tableName} WHERE ${conditions.join(' AND ')} LIMIT 1`
      const row = db.prepare(sql).get(...params) as Record<string, unknown> | undefined
      return row ? fromDbRecord<T>(row) : null
    },

    async create(data) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const record = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      }

      const dbRecord = toDbRecord(record as Record<string, unknown>)
      const columns = Object.keys(dbRecord)
      const placeholders = columns.map(() => '?')

      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`
      db.prepare(sql).run(...Object.values(dbRecord))

      return fromDbRecord<T>(dbRecord)
    },

    async update(id, updates) {
      // First check if record exists
      const existing = await this.findById(id)
      if (!existing) return null

      const dbUpdates = toDbRecord({
        ...updates,
        updatedAt: new Date().toISOString(),
      })

      const setClause = Object.keys(dbUpdates).map(key => `${key} = ?`).join(', ')
      const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`

      db.prepare(sql).run(...Object.values(dbUpdates), id)

      return this.findById(id)
    },

    async delete(id) {
      const sql = `DELETE FROM ${tableName} WHERE id = ?`
      const result = db.prepare(sql).run(id)
      return result.changes > 0
    },
  }
}
