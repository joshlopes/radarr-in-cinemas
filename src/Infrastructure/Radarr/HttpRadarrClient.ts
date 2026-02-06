import axios from 'axios'
import { type RadarrClient, type RadarrMovie, type RadarrRootFolder, type RadarrQualityProfile, type AddMovieRequest } from '../../Domain/Radarr/RadarrClient'
import { type LogStore } from '../../Domain/Logging/LogStore'

export class HttpRadarrClient implements RadarrClient {
  private readonly baseUrl: string
  private readonly apiKey: string
  private cachedMovies: RadarrMovie[] | null = null
  private cacheExpiry: number = 0
  private readonly cacheDuration = 60000 // 1 minute cache

  constructor (
    baseUrl: string,
    apiKey: string,
    private readonly logStore?: LogStore
  ) {
    // Remove trailing slash if present
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  private log (level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>): void {
    if (this.logStore != null) {
      this.logStore.log(level, message, 'RadarrClient', context)
    }
  }

  async getMovies (): Promise<RadarrMovie[]> {
    // Return cached movies if still valid
    if (this.cachedMovies != null && Date.now() < this.cacheExpiry) {
      return this.cachedMovies
    }

    try {
      this.log('debug', 'Fetching movies from Radarr')
      const response = await axios.get(`${this.baseUrl}/api/v3/movie`, {
        headers: {
          'X-Api-Key': this.apiKey
        },
        timeout: 10000
      })

      const movies: RadarrMovie[] = response.data.map((m: any) => ({
        id: m.id,
        title: m.title,
        tmdbId: m.tmdbId,
        imdbId: m.imdbId,
        hasFile: m.hasFile ?? false,
        monitored: m.monitored ?? false
      }))

      this.cachedMovies = movies
      this.cacheExpiry = Date.now() + this.cacheDuration
      this.log('info', `Fetched ${movies.length} movies from Radarr`, { count: movies.length })

      return movies
    } catch (error) {
      this.log('error', 'Failed to fetch movies from Radarr', { error: String(error) })
      return []
    }
  }

  async isMovieInLibrary (tmdbId: number): Promise<boolean> {
    const movies = await this.getMovies()
    return movies.some(m => m.tmdbId === tmdbId)
  }

  async getMovieByTmdbId (tmdbId: number): Promise<RadarrMovie | null> {
    const movies = await this.getMovies()
    return movies.find(m => m.tmdbId === tmdbId) ?? null
  }

  async getRootFolders (): Promise<RadarrRootFolder[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/rootfolder`, {
        headers: { 'X-Api-Key': this.apiKey },
        timeout: 10000
      })
      return response.data.map((f: any) => ({
        id: f.id,
        path: f.path,
        freeSpace: f.freeSpace ?? 0
      }))
    } catch (error) {
      this.log('error', 'Failed to fetch root folders from Radarr', { error: String(error) })
      return []
    }
  }

  async getQualityProfiles (): Promise<RadarrQualityProfile[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/qualityprofile`, {
        headers: { 'X-Api-Key': this.apiKey },
        timeout: 10000
      })
      return response.data.map((p: any) => ({
        id: p.id,
        name: p.name
      }))
    } catch (error) {
      this.log('error', 'Failed to fetch quality profiles from Radarr', { error: String(error) })
      return []
    }
  }

  async addMovie (request: AddMovieRequest): Promise<RadarrMovie | null> {
    try {
      // First lookup the movie in TMDB via Radarr to get full details
      const lookupResponse = await axios.get(`${this.baseUrl}/api/v3/movie/lookup/tmdb`, {
        headers: { 'X-Api-Key': this.apiKey },
        params: { tmdbId: request.tmdbId },
        timeout: 10000
      })

      const movieData = lookupResponse.data

      // Add the movie with required fields
      const response = await axios.post(`${this.baseUrl}/api/v3/movie`, {
        ...movieData,
        rootFolderPath: request.rootFolderPath,
        qualityProfileId: request.qualityProfileId,
        monitored: request.monitored ?? true,
        addOptions: {
          searchForMovie: request.searchForMovie ?? true
        }
      }, {
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      })

      // Invalidate cache so next getMovies() fetches fresh data
      this.cachedMovies = null
      this.cacheExpiry = 0

      this.log('info', `Added movie to Radarr: ${request.title}`, { tmdbId: request.tmdbId, radarrId: response.data.id })

      return {
        id: response.data.id,
        title: response.data.title,
        tmdbId: response.data.tmdbId,
        imdbId: response.data.imdbId,
        hasFile: response.data.hasFile ?? false,
        monitored: response.data.monitored ?? true
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ?? error.response?.data?.[0]?.errorMessage ?? String(error)
      this.log('error', `Failed to add movie to Radarr: ${request.title}`, { error: errorMessage, tmdbId: request.tmdbId })
      throw new Error(errorMessage)
    }
  }
}

