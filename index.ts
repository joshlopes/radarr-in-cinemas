import {Response} from 'express';
import express from 'express';
import {NosMovies} from "./src/Infrastructure/Cinema/Nos/NosMovies";
import {TmdbIndexer} from "./src/Infrastructure/Indexer/Tmdb/TmdbIndexer";
import {GetMoviesCommand} from "./src/Application/UseCase/GetMovies/GetMoviesCommand";
import RSS from 'rss';

// Create a new Express application instance
const app = express();


// Init services
const indexer = new TmdbIndexer(process.env.TMDB_API_KEY || '');
const nosMovies = new NosMovies(indexer);

// Define the route
app.get('/api/movies', async (req: any, res: Response) => {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", '0');
    res.header('Content-Type', 'application/json')

    try {
        const movies = await new GetMoviesCommand(nosMovies).execute();
        if (movies) {
            res.status(200).json(movies);
        } else {
            res.status(304).set('Content-Type', 'application/json').send({ message: 'Not Modified' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.get('/api/movies.rss', async (req: any, res: Response) => {
    let feed = new RSS({
        title: 'My Feed',
        description: 'This is my sample RSS feed',
        feed_url: 'https://radarr-cinema-list.honeypot1.tedcrypto.io/api/movies.rss',
        site_url: 'https://radarr-cinema-list.honeypot1.tedcrypto.io',
    });

    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", '0');
    res.header('Content-Type', 'application/rss+xml')

    const movies = await new GetMoviesCommand(nosMovies).execute();
    if (movies) {
        for (const movie of movies) {
            feed.item({
                title: movie.title,
                description: movie.description,
                url: `https://www.imdb.com/title/${movie.imdb_id}`,
                date: movie.release_date
            });
        }
        res.send(feed.xml());
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
