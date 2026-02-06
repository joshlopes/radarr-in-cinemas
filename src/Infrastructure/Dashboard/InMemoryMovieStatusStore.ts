import { type DashboardStats, type MovieStatus } from '../../Domain/Dashboard/MovieStatus'
import { type MovieStatusStore } from '../../Domain/Dashboard/MovieStatusStore'

export class InMemoryMovieStatusStore implements MovieStatusStore {
  private movies: Map<string, MovieStatus> = new Map()
  private runStartTime?: Date
  private lastRunAt?: Date
  private lastRunDuration?: number
  private isRunning: boolean = false

  updateMovieStatus (movie: Omit<MovieStatus, 'id' | 'lastUpdated'>): void {
    const id = `${movie.source}-${movie.title}-${movie.releaseDate}`
    const existing = this.movies.get(id)

    this.movies.set(id, {
      ...movie,
      id,
      lastUpdated: new Date(),
      tmdbId: movie.tmdbId ?? existing?.tmdbId,
      imdbId: movie.imdbId ?? existing?.imdbId,
      poster: movie.poster ?? existing?.poster,
      radarrStatus: movie.radarrStatus ?? existing?.radarrStatus,
      radarrId: movie.radarrId ?? existing?.radarrId
    })
  }

  getMovies (): MovieStatus[] {
    return Array.from(this.movies.values()).sort((a, b) =>
      b.lastUpdated.getTime() - a.lastUpdated.getTime()
    )
  }

  getStats (): DashboardStats {
    const movies = Array.from(this.movies.values())
    return {
      totalMoviesProcessed: movies.length,
      successfulMovies: movies.filter(m => m.status === 'success').length,
      failedMovies: movies.filter(m => m.status === 'error').length,
      notFoundMovies: movies.filter(m => m.status === 'not_found').length,
      lastRunAt: this.lastRunAt,
      lastRunDuration: this.lastRunDuration,
      isRunning: this.isRunning
    }
  }

  startRun (): void {
    this.isRunning = true
    this.runStartTime = new Date()
    // Clear previous movies on new run
    this.movies.clear()
  }

  endRun (): void {
    this.isRunning = false
    this.lastRunAt = new Date()
    if (this.runStartTime !== undefined) {
      this.lastRunDuration = this.lastRunAt.getTime() - this.runStartTime.getTime()
    }
  }

  clear (): void {
    this.movies.clear()
    this.lastRunAt = undefined
    this.lastRunDuration = undefined
    this.isRunning = false
  }
}

