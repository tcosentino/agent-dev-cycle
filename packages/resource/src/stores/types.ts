// Store interface - abstracts the data layer
// Can be implemented with in-memory, SQLite, Postgres, etc.

export interface ResourceStore<T extends Record<string, unknown> = Record<string, unknown>> {
  findAll(options?: { where?: Partial<T>; search?: string; searchFields?: string[] }): Promise<T[]>
  findById(id: string): Promise<T | null>
  findOne(where: Partial<T>): Promise<T | null>
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T | null>
  delete(id: string): Promise<boolean>
}
