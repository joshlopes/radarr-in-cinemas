export type ProcessingStatus = 'pending' | 'processing' | 'success' | 'error' | 'not_found'

export type RadarrStatus = 'unknown' | 'not_added' | 'monitored' | 'downloaded'

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
  radarrStatus?: RadarrStatus
  radarrId?: number
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

