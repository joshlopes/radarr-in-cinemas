import { type Request, type Response } from 'express'
import { type LogStore } from '../../Domain/Logging/LogStore'
import { type MovieStatusStore } from '../../Domain/Dashboard/MovieStatusStore'

export class DashboardController {
  constructor (
    private readonly logStore: LogStore,
    private readonly movieStatusStore: MovieStatusStore
  ) {}

  getLogs (req: Request, res: Response): void {
    const limit = parseInt(req.query.limit as string) || 100
    const logs = this.logStore.getLogs(limit)
    res.json(logs)
  }

  getMovies (_req: Request, res: Response): void {
    const movies = this.movieStatusStore.getMovies()
    res.json(movies)
  }

  getStats (_req: Request, res: Response): void {
    const stats = this.movieStatusStore.getStats()
    res.json(stats)
  }

  getDashboardData (req: Request, res: Response): void {
    const logLimit = parseInt(req.query.logLimit as string) || 50
    res.json({
      logs: this.logStore.getLogs(logLimit),
      movies: this.movieStatusStore.getMovies(),
      stats: this.movieStatusStore.getStats()
    })
  }
}

