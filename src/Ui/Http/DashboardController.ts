import { type Request, type Response } from 'express'
import { type LogStore } from '../../Domain/Logging/LogStore'
import { type MovieStatusStore } from '../../Domain/Dashboard/MovieStatusStore'
import { type RadarrClient } from '../../Domain/Radarr/RadarrClient'
import { type TmdbIndexer } from '../../Infrastructure/Indexer/Tmdb/TmdbIndexer'

export class DashboardController {
  constructor (
    private readonly logStore: LogStore,
    private readonly movieStatusStore: MovieStatusStore,
    private readonly radarrClient?: RadarrClient,
    private readonly tmdbIndexer?: TmdbIndexer
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

  async getRadarrConfig (_req: Request, res: Response): Promise<void> {
    if (this.radarrClient == null) {
      res.json({ enabled: false })
      return
    }

    try {
      const [rootFolders, qualityProfiles] = await Promise.all([
        this.radarrClient.getRootFolders(),
        this.radarrClient.getQualityProfiles()
      ])

      res.json({
        enabled: true,
        rootFolders,
        qualityProfiles
      })
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch Radarr configuration' })
    }
  }

  async addToRadarr (req: Request, res: Response): Promise<void> {
    if (this.radarrClient == null) {
      res.status(400).json({ error: 'Radarr integration not configured' })
      return
    }

    const { tmdbId, title, year, rootFolderPath, qualityProfileId } = req.body

    if (tmdbId == null || title == null || rootFolderPath == null || qualityProfileId == null) {
      res.status(400).json({ error: 'Missing required fields: tmdbId, title, rootFolderPath, qualityProfileId' })
      return
    }

    try {
      const movie = await this.radarrClient.addMovie({
        tmdbId: Number(tmdbId),
        title: String(title),
        year: Number(year) || new Date().getFullYear(),
        rootFolderPath: String(rootFolderPath),
        qualityProfileId: Number(qualityProfileId),
        monitored: true,
        searchForMovie: true
      })

      res.json({ success: true, movie })
    } catch (error: any) {
      res.status(400).json({ error: error.message ?? 'Failed to add movie to Radarr' })
    }
  }

  async getMovieDetails (req: Request, res: Response): Promise<void> {
    const tmdbId = parseInt(req.params.tmdbId)

    if (isNaN(tmdbId)) {
      res.status(400).json({ error: 'Invalid TMDB ID' })
      return
    }

    if (this.tmdbIndexer == null) {
      res.status(500).json({ error: 'TMDB integration not configured' })
      return
    }

    try {
      const details = await this.tmdbIndexer.fetchMovieDetails(tmdbId)

      if (details == null) {
        res.status(404).json({ error: 'Movie not found' })
        return
      }

      // Get Radarr status for this movie
      let radarrStatus = 'unknown'
      let radarrId: number | null = null

      if (this.radarrClient != null) {
        const radarrMovies = await this.radarrClient.getMovies()
        const radarrMovie = radarrMovies.find(m => m.tmdbId === tmdbId)
        if (radarrMovie != null) {
          radarrStatus = radarrMovie.hasFile ? 'downloaded' : 'monitored'
          radarrId = radarrMovie.id
        } else {
          radarrStatus = 'not_added'
        }
      }

      // Parse release dates by type
      const releaseDates: Record<string, Array<{ country: string, date: string, note?: string }>> = {
        premiere: [],
        theatrical: [],
        digital: [],
        physical: [],
        tv: []
      }

      if (details.release_dates?.results != null) {
        for (const countryData of details.release_dates.results) {
          for (const rd of countryData.release_dates) {
            const entry = {
              country: countryData.iso_3166_1,
              date: rd.release_date.split('T')[0],
              note: rd.note
            }
            switch (rd.type) {
              case 1: releaseDates.premiere.push(entry); break
              case 2:
              case 3: releaseDates.theatrical.push(entry); break
              case 4: releaseDates.digital.push(entry); break
              case 5: releaseDates.physical.push(entry); break
              case 6: releaseDates.tv.push(entry); break
            }
          }
        }
      }

      res.json({
        id: details.id,
        title: details.title,
        originalTitle: details.original_title,
        overview: details.overview,
        posterPath: details.poster_path != null ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
        backdropPath: details.backdrop_path != null ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : null,
        releaseDate: details.release_date,
        runtime: details.runtime,
        genres: details.genres?.map(g => g.name) ?? [],
        countries: details.production_countries?.map(c => c.name) ?? [],
        voteAverage: details.vote_average,
        voteCount: details.vote_count,
        tagline: details.tagline,
        status: details.status,
        releaseDates,
        radarrStatus,
        radarrId
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message ?? 'Failed to fetch movie details' })
    }
  }
}

