import axios from "axios";
import dayjs from 'dayjs'
dayjs().format()

export type TmdbMovie = {
    title: string;
    original_title: string;
    id: number;
    overview: string;
    poster_path: string;
    release_date: string;
}

export class TmdbIndexer {
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.themoviedb.org/3';
    }

    async discoverMovie(movieName: string, releaseDate: string): Promise<TmdbMovie[]> {
        const releaseYear = dayjs(releaseDate).format('YYYY');
        const url = `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${movieName}&year=${releaseYear}`;
        console.log(`Fetching TMDB data ${url})`);
        const response = await axios.get(url);

        if (response.data && response.data.results) {
            return response.data.results;
        } else {
            return [];
        }
    }

    async fetchImdbId(tmdbId: number): Promise<string> {
        const url = `${this.baseUrl}/movie/${tmdbId}/external_ids?api_key=${this.apiKey}`;
        console.log(`Fetching TMDB data ${url})`);
        const response = await axios.get(url);

        if (response.data && response.data.imdb_id) {
            return response.data.imdb_id;
        } else {
            return '';
        }
    }
}