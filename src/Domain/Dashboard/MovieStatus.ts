export type ProcessingStatus = 'pending' | 'processing' | 'success' | 'error' | 'not_found'

export interface MovieStatus {
  id: string
  title: string
  originalTitle: string
  releaseDate: string
  poster?: string
  tmdbId?: number
  imdbId?: string
  status: ProcessingStatus
  error?: string
  lastUpdated: Date
  source: string
}

export interface DashboardStats {
  totalMoviesProcessed: number
  successfulMovies: number
  failedMovies: number
  notFoundMovies: number
  lastRunAt?: Date
  lastRunDuration?: number
  isRunning: boolean
}

