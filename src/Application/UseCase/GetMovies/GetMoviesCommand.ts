import {Query} from "../../../Model/Query";
import {CinemaApiClient} from "../../Port/CinemaApiClient";
import {Movie} from "../../../Model/Movie";

export class GetMoviesCommand implements Query {
    constructor(private cinemaApiClient: CinemaApiClient) {
    }

    async execute(): Promise<Movie[]> {
        return await this.cinemaApiClient.getMovies();
    }
}