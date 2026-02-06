export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

export interface LoggerOptions {
  level?: LogLevel
  prefix?: string
  timestamps?: boolean
}

export interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  child: (prefix: string) => Logger
}

function getTimestamp(): string {
  return new Date().toISOString()
}

function formatPrefix(prefix: string | undefined, timestamps: boolean): string {
  const parts: string[] = []
  if (timestamps) {
    parts.push(`[${getTimestamp()}]`)
  }
  if (prefix) {
    parts.push(`[${prefix}]`)
  }
  return parts.length > 0 ? parts.join(' ') + ' ' : ''
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const level = options.level ?? (process.env.LOG_LEVEL as LogLevel) ?? 'info'
  const prefix = options.prefix
  const timestamps = options.timestamps ?? false
  const currentLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info

  const shouldLog = (targetLevel: LogLevel): boolean => {
    return LOG_LEVELS[targetLevel] >= currentLevel
  }

  const log = (targetLevel: LogLevel, method: 'log' | 'warn' | 'error', ...args: unknown[]) => {
    if (!shouldLog(targetLevel)) return
    const formattedPrefix = formatPrefix(prefix, timestamps)
    if (formattedPrefix) {
      console[method](formattedPrefix, ...args)
    } else {
      console[method](...args)
    }
  }

  return {
    debug: (...args: unknown[]) => log('debug', 'log', ...args),
    info: (...args: unknown[]) => log('info', 'log', ...args),
    warn: (...args: unknown[]) => log('warn', 'warn', ...args),
    error: (...args: unknown[]) => log('error', 'error', ...args),
    child: (childPrefix: string) => createLogger({
      level,
      prefix: prefix ? `${prefix}:${childPrefix}` : childPrefix,
      timestamps,
    }),
  }
}

export const logger = createLogger()
