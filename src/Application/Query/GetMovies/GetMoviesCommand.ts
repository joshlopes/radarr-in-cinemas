import { type Query } from '../../../Domain/Query'
import { type CinemaApiClient } from '../../../Domain/CinemaApiClient'
import { type Movie } from '../../../Domain/Movie'

export class GetMoviesCommand implements Query {
  constructor (private readonly cinemaApiClient: CinemaApiClient) {
  }

  async execute (): Promise<Movie[]> {
    return await this.cinemaApiClient.getMovies()
  }
}
