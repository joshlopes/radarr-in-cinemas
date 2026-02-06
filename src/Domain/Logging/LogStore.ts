import { type LogEntry, type LogLevel } from './LogEntry'

export interface LogStore {
  log: (level: LogLevel, message: string, source: string, context?: Record<string, unknown>) => void
  getLogs: (limit?: number) => LogEntry[]
  clear: () => void
}

