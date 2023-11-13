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
        releaseDate = dayjs(releaseDate).format('YYYY');
        const url = `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${movieName}&year=${releaseDate}`;
        console.log(`Fetching TMDB data ${url})`);
        const response = await axios.get(url);

        if (response.data && response.data.results) {
            return response.data.results;
        } else {
            return [];
        }
    }
}