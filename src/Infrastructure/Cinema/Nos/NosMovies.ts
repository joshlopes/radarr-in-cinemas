import axios from 'axios'
import dayjs from 'dayjs'
import { type TmdbIndexer } from '../../Indexer/Tmdb/TmdbIndexer'
import { type CinemaApiClient } from '../../../Domain/CinemaApiClient'
import { type Movie } from '../../../Domain/Movie'
import { type LogStore } from '../../../Domain/Logging/LogStore'
import { type MovieStatusStore } from '../../../Domain/Dashboard/MovieStatusStore'
import { type RadarrClient } from '../../../Domain/Radarr/RadarrClient'
import { type RadarrStatus } from '../../../Domain/Dashboard/MovieStatus'
dayjs().format()

interface NosMovie {
  uuid: string
  title: string
  originaltitle: string
  trailer: string
  portraitimages: {
    size: string
    path: string
  }
  cast: string
  duration: string
  moviestate: string
  releasedate: string
  intheaters: boolean
  format: string
  version: string
}

export class NosMovies implements CinemaApiClient {
  constructor (
    private readonly indexer: TmdbIndexer,
    private readonly logStore?: LogStore,
    private readonly movieStatusStore?: MovieStatusStore,
    private readonly radarrClient?: RadarrClient
  ) {
  }

  private log (level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>): void {
    if (this.logStore !== undefined) {
      this.logStore.log(level, message, 'NosMovies', context)
    } else {
      console.log(`[NosMovies] ${message}`)
    }
  }

  private normalizePosterUrl (path?: string): string {
    if (path == null || path === '') return ''
    // NOS returns protocol-relative URLs like //cdn.nos.pt/...
    if (path.startsWith('//')) {
      return `https:${path}`
    }
    return path
  }

  async getMovies (): Promise<Movie[]> {
    const url = 'https://www.cinemas.nos.pt/graphql/execute.json/cinemas/getMoviesInTheatersBigBanner'
    this.log('info', 'Starting to fetch movies from NOS', { url })
    this.movieStatusStore?.startRun()

    try {
      const response = await axios.get(url)
      const data = response.data.data

      if (data === undefined) {
        this.log('error', 'No data found in NOS response')
        this.movieStatusStore?.endRun()
        return []
      }

      if (data.movieList?.items === undefined || data.movieList.items.length === 0) {
        this.log('warn', 'No movies found in NOS')
        this.movieStatusStore?.endRun()
        return []
      }

      const movies: NosMovie[] = response.data.data.movieList.items
      this.log('info', `Found ${movies.length} movies in NOS`, { count: movies.length })

      const returnMovies: Movie[] = []
      for (const movie of movies) {
        const releaseDate = dayjs(movie.releasedate).format('YYYY-MM-DD')
        const posterUrl = this.normalizePosterUrl(movie.portraitimages?.path)

        // Update status to processing
        this.movieStatusStore?.updateMovieStatus({
          title: movie.title,
          originalTitle: movie.originaltitle,
          releaseDate,
          poster: posterUrl,
          status: 'processing',
          source: 'NOS'
        })

        const tmdbMovies = await this.indexer.discoverMovie(movie.originaltitle, movie.releasedate)
        if (tmdbMovies.length === 0) {
          this.log('warn', 'No movie found in TMDB', { title: movie.originaltitle, releaseDate })
          this.movieStatusStore?.updateMovieStatus({
            title: movie.title,
            originalTitle: movie.originaltitle,
            releaseDate,
            poster: posterUrl,
            status: 'not_found',
            error: 'Movie not found in TMDB',
            source: 'NOS'
          })
          continue
        }

        const imdbId = await this.indexer.fetchImdbId(tmdbMovies[0].id)

        // Check if movie is in Radarr
        let radarrStatus: RadarrStatus = 'unknown'
        let radarrId: number | undefined
        if (this.radarrClient != null) {
          const radarrMovie = await this.radarrClient.getMovieByTmdbId(tmdbMovies[0].id)
          if (radarrMovie != null) {
            radarrId = radarrMovie.id
            radarrStatus = radarrMovie.hasFile ? 'downloaded' : 'monitored'
            this.log('info', `Movie found in Radarr: ${radarrStatus}`, {
              title: movie.originaltitle,
              radarrId,
              hasFile: radarrMovie.hasFile
            })
          } else {
            radarrStatus = 'not_added'
          }
        }

        // Update status to success
        this.movieStatusStore?.updateMovieStatus({
          title: movie.title,
          originalTitle: movie.originaltitle,
          releaseDate,
          poster: posterUrl,
          tmdbId: tmdbMovies[0].id,
          imdbId,
          status: 'success',
          source: 'NOS',
          radarrStatus,
          radarrId
        })

        this.log('info', 'Successfully processed movie', {
          title: movie.originaltitle,
          tmdbId: tmdbMovies[0].id,
          imdbId,
          radarrStatus
        })

        returnMovies.push({
          title: movie.originaltitle,
          tmdbId: tmdbMovies[0].id,
          tmdb_id: tmdbMovies[0].id,
          imdbId,
          imdb_id: imdbId,
          poster: posterUrl,
          images: [
            {
              coverType: 'poster',
              url: posterUrl
            }
          ],
          description: tmdbMovies[0].overview,
          year: dayjs(releaseDate).year(),
          release_date: releaseDate
        })
      }

      this.log('info', `Finished processing. Returning ${returnMovies.length} movies`, {
        total: movies.length,
        successful: returnMovies.length
      })
      this.movieStatusStore?.endRun()

      return returnMovies
    } catch (error) {
      this.log('error', 'Failed to fetch movies from NOS', { error: String(error) })
      this.movieStatusStore?.endRun()
      return []
    }
  }
}
