import {Query} from "../../../Domain/Query";
import {CinemaApiClient} from "../../../Domain/CinemaApiClient";
import {Movie} from "../../../Domain/Movie";

export class GetMoviesCommand implements Query {
    constructor(private cinemaApiClient: CinemaApiClient) {
    }

    async execute(): Promise<Movie[]> {
        return await this.cinemaApiClient.getMovies();
    }
}