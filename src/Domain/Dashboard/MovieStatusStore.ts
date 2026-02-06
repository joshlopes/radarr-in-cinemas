import { type DashboardStats, type MovieStatus, type ProcessingStatus } from './MovieStatus'

export interface MovieStatusStore {
  updateMovieStatus: (movie: Omit<MovieStatus, 'id' | 'lastUpdated'>) => void
  getMovies: () => MovieStatus[]
  getStats: () => DashboardStats
  startRun: () => void
  endRun: () => void
  clear: () => void
}

