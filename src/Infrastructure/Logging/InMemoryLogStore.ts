import { type LogEntry, type LogLevel } from '../../Domain/Logging/LogEntry'
import { type LogStore } from '../../Domain/Logging/LogStore'

export class InMemoryLogStore implements LogStore {
  private logs: LogEntry[] = []
  private readonly maxLogs: number

  constructor (maxLogs: number = 1000) {
    this.maxLogs = maxLogs
  }

  log (level: LogLevel, message: string, source: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      message,
      source,
      context
    }

    this.logs.push(entry)

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Also log to console for debugging
    const contextStr = context !== undefined ? ` ${JSON.stringify(context)}` : ''
    console.log(`[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] [${source}] ${message}${contextStr}`)
  }

  getLogs (limit?: number): LogEntry[] {
    if (limit !== undefined) {
      return this.logs.slice(-limit)
    }
    return [...this.logs]
  }

  clear (): void {
    this.logs = []
  }
}

