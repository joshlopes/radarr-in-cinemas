import axios from 'axios'
import dayjs from 'dayjs'
import { type LogStore } from '../../../Domain/Logging/LogStore'
dayjs().format()

export interface TmdbMovie {
  title: string
  original_title: string
  id: number
  overview: string
  poster_path: string
  release_date: string
}

export class TmdbIndexer {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor (
    apiKey: string,
    private readonly logStore?: LogStore
  ) {
    this.apiKey = apiKey
    this.baseUrl = 'https://api.themoviedb.org/3'
  }

  private log (level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>): void {
    if (this.logStore !== undefined) {
      this.logStore.log(level, message, 'TmdbIndexer', context)
    } else {
      console.log(`[TmdbIndexer] ${message}`)
    }
  }

  async discoverMovie (movieName: string, releaseDate: string): Promise<TmdbMovie[]> {
    const releaseYear = dayjs(releaseDate).format('YYYY')
    const url = `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(movieName)}&year=${releaseYear}`
    this.log('debug', `Searching TMDB for movie`, { movieName, releaseYear })

    try {
      const response = await axios.get(url)
      const data = response.data
      if (data === undefined || data.results === undefined) {
        this.log('warn', `No data found in TMDB`, { movieName, releaseYear })
        return []
      }

      this.log('info', `Found ${data.results.length} results in TMDB`, { movieName, resultsCount: data.results.length })
      return response.data.results
    } catch (error) {
      this.log('error', `Failed to fetch from TMDB`, { movieName, error: String(error) })
      return []
    }
  }

  async fetchImdbId (tmdbId: number): Promise<string> {
    const url = `${this.baseUrl}/movie/${tmdbId}/external_ids?api_key=${this.apiKey}`
    this.log('debug', `Fetching IMDB ID for TMDB movie`, { tmdbId })

    try {
      const response = await axios.get(url)
      const imdbId = response.data?.imdb_id ?? ''
      if (imdbId !== '') {
        this.log('info', `Found IMDB ID`, { tmdbId, imdbId })
      } else {
        this.log('warn', `No IMDB ID found`, { tmdbId })
      }
      return imdbId
    } catch (error) {
      this.log('error', `Failed to fetch IMDB ID`, { tmdbId, error: String(error) })
      return ''
    }
  }
}
