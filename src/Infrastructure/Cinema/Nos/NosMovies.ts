import axios from 'axios'
import dayjs from 'dayjs'
import { type TmdbIndexer } from '../../Indexer/Tmdb/TmdbIndexer'
import { type CinemaApiClient } from '../../../Domain/CinemaApiClient'
import { type Movie } from '../../../Domain/Movie'
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
  constructor (private readonly indexer: TmdbIndexer) {
  }

  async getMovies (): Promise<Movie[]> {
    const url = 'https://www.cinemas.nos.pt/graphql/execute.json/cinemas/getMoviesInTheatersBigBanner'
    console.log(`Fetching movies from NOS ${url}`)
    const response = await axios.get(url)
    const data = response.data.data

    if (data === undefined) {
      console.error('No data found in NOS')

      return []
    }
    if (data.movieList?.items === undefined || data.movieList.items.length === 0) {
      console.log('No movies found in NOS')

      return []
    }

    const movies: NosMovie[] = response.data.data.movieList.items
    console.log(`Found ${movies.length} movies in NOS`)

    const returnMovies: Movie[] = []
    for (const movie of movies) {
      const releaseDate = dayjs(movie.releasedate).format('YYYY-MM-DD')
      const tmdbMovies = await this.indexer.discoverMovie(movie.originaltitle, movie.releasedate)
      if (tmdbMovies.length === 0) {
        console.error('No movie found in TMDB for', movie.originaltitle, movie.releasedate)
        continue
      }
      const imdbId = await this.indexer.fetchImdbId(tmdbMovies[0].id)

      returnMovies.push({
        title: movie.originaltitle,
        tmdbId: tmdbMovies[0].id,
        tmdb_id: tmdbMovies[0].id,
        imdbId,
        imdb_id: imdbId,
        poster: movie.portraitimages.path,
        images: [
          {
            coverType: 'poster',
            url: movie.portraitimages.path
          }
        ],
        description: tmdbMovies[0].overview,
        year: dayjs(releaseDate).year(),
        release_date: releaseDate
      })
    }

    return returnMovies
  }
}
