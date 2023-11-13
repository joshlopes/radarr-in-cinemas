import {Query} from "../../../Model/Query.ts";
import {CinemaApiClient} from "../../Port/CinemaApiClient.ts";
import {Movie} from "../../../Model/Movie.ts";

export class GetMoviesCommand implements Query {
    constructor(private cinemaApiClient: CinemaApiClient) {
    }

    async execute(): Promise<Movie[]> {
        return await this.cinemaApiClient.getMovies();
    }
}