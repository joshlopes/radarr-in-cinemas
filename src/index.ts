import express, { type Response } from 'express'
import { NosMovies } from './Infrastructure/Cinema/Nos/NosMovies'
import { TmdbIndexer } from './Infrastructure/Indexer/Tmdb/TmdbIndexer'
import { GetMoviesCommand } from './Application/Query/GetMovies/GetMoviesCommand'
import RSS from 'rss'

// Create a new Express application instance
const app = express()

// Init services
const indexer = new TmdbIndexer(process.env.TMDB_API_KEY ?? '')
const nosMovies = new NosMovies(indexer)

// Define the route
app.get('/api/movies', (req: any, res: Response) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.header('Pragma', 'no-cache')
  res.header('Expires', '0')
  res.header('Content-Type', 'application/json')

  new GetMoviesCommand(nosMovies).execute()
    .then(movies => {
      if (movies.length > 0) {
        res.status(200).json(movies)
      } else {
        res.status(304).set('Content-Type', 'application/json').send({ message: 'Not Modified' })
      }
    })
    .catch(error => {
      console.error(error)
      res.status(500).send({ error: 'Internal Server Error' })
    })
})

app.get('/api/movies.rss', (req: any, res: Response) => {
  const feed = new RSS({
    title: 'My Feed',
    description: 'This is my sample RSS feed',
    feed_url: 'https://radarr-cinema-list.honeypot1.tedcrypto.io/api/movies.rss',
    site_url: 'https://radarr-cinema-list.honeypot1.tedcrypto.io'
  })

  res.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.header('Pragma', 'no-cache')
  res.header('Expires', '0')
  res.header('Content-Type', 'application/rss+xml')

  new GetMoviesCommand(nosMovies).execute()
    .then(movies => {
      if (movies.length > 0) {
        for (const movie of movies) {
          feed.item({
            title: movie.title,
            description: movie.description,
            url: `https://www.imdb.com/title/${movie.imdb_id}`,
            date: movie.release_date
          })
        }
        res.send(feed.xml())
      }
    })
    .catch(error => {
      console.error(error)
      res.status(500).send({ error: 'Internal Server Error' })
    })
})

// Start the server
const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
