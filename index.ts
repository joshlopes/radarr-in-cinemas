import express from 'express';
import {NosMovies} from "./src/Infrastructure/Cinema/Nos/NosMovies.ts";
import {TmdbIndexer} from "./src/Infrastructure/Indexer/Tmdb/TmdbIndexer.ts";
import {GetMoviesCommand} from "./src/Application/UseCase/GetMovies/GetMoviesCommand.ts";

// Create a new Express application instance
const app = express();

// Init services
const indexer = new TmdbIndexer(process.env.TMDB_API_KEY || '');
const nosMovies = new NosMovies(indexer);

// Define the route
app.get('/api/movies', async (req: any, res: any) => {
    try {
        res.json(await new GetMoviesCommand(nosMovies).execute());
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});