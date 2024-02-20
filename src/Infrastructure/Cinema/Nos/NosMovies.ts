import axios from "axios";
import dayjs from "dayjs";
import {TmdbIndexer} from "../../Indexer/Tmdb/TmdbIndexer";
import {CinemaApiClient} from "../../../Application/Port/CinemaApiClient";
import {Movie} from "../../../Model/Movie";
dayjs().format()

type NosMovie = {
    uuid: string,
    title: string,
    originaltitle: string,
    trailer: string,
    portraitimages: {
        size: string,
        path: string,
    }
    cast: string,
    duration: string,
    moviestate: string,
    releasedate: string,
    intheaters: boolean,
    format: string,
    version: string
}

export class NosMovies implements CinemaApiClient
{
    constructor(private indexer: TmdbIndexer) {
    }

    async getMovies(): Promise<Movie[]> {
        const url = 'https://www.cinemas.nos.pt/graphql/execute.json/cinemas/getMoviesInTheatersBigBanner';
        console.log(`Fetching movies from NOS ${url}`);
        const response = await axios.get(url);
        if (!response.data.data || !response.data.data.movieList.items) {
            console.log('No movies found in NOS');

            return [];
        }

        const movies: NosMovie[] = response.data.data.movieList.items;
        console.log(`Found ${movies.length} movies in NOS`)

        let returnMovies: Movie[] = [];
        for (const movie of movies) {
            const releaseDate = dayjs(movie.releasedate).format('YYYY-MM-DD');
            const tmdbMovies = await this.indexer.discoverMovie(movie.originaltitle, movie.releasedate);
            if (tmdbMovies.length === 0) {
                console.error('No movie found in TMDB for', movie.originaltitle, movie.releasedate);
                continue;
            }

            returnMovies.push({
                title: movie.originaltitle,
                tmdbId: tmdbMovies[0].id,
                tmdb_id: tmdbMovies[0].id,
                poster: movie.portraitimages.path,
                images: [
                    {
                        coverType: 'poster',
                        url: movie.portraitimages.path,
                    }
                ],
                description: tmdbMovies[0].overview,
                year: dayjs(releaseDate).year(),
                release_date: releaseDate,
            })
        }

        return returnMovies;
    }

}