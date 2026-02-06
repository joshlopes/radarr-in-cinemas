import express, { type Response } from 'express'
import { NosMovies } from './Infrastructure/Cinema/Nos/NosMovies'
import { TmdbIndexer } from './Infrastructure/Indexer/Tmdb/TmdbIndexer'
import { GetMoviesCommand } from './Application/Query/GetMovies/GetMoviesCommand'
import { InMemoryLogStore } from './Infrastructure/Logging/InMemoryLogStore'
import { InMemoryMovieStatusStore } from './Infrastructure/Dashboard/InMemoryMovieStatusStore'
import { DashboardController } from './Ui/Http/DashboardController'
import { HttpRadarrClient } from './Infrastructure/Radarr/HttpRadarrClient'
import RSS from 'rss'
import path from 'path'
import fs from 'fs'

// Create a new Express application instance
const app = express()
// CORS allow everyone to query
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

// Init logging and dashboard stores
const logStore = new InMemoryLogStore(500)
const movieStatusStore = new InMemoryMovieStatusStore()

// Init Radarr client (optional - only if configured)
const radarrUrl = process.env.RADARR_URL ?? ''
const radarrApiKey = process.env.RADARR_API_KEY ?? ''
const radarrClient = radarrUrl !== '' && radarrApiKey !== ''
  ? new HttpRadarrClient(radarrUrl, radarrApiKey, logStore)
  : undefined

if (radarrClient != null) {
  logStore.log('info', 'Radarr integration enabled', 'System', { url: radarrUrl })
} else {
  logStore.log('info', 'Radarr integration disabled (RADARR_URL and RADARR_API_KEY not set)', 'System')
}

// Init services with logging
const indexer = new TmdbIndexer(process.env.TMDB_API_KEY ?? '', logStore)
const nosMovies = new NosMovies(indexer, logStore, movieStatusStore, radarrClient)

// Dashboard controller
const dashboardController = new DashboardController(logStore, movieStatusStore, radarrClient, indexer)

// Log startup
logStore.log('info', 'Server starting up', 'System')

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

// Dashboard API routes
app.get('/api/dashboard', (req, res) => {
  dashboardController.getDashboardData(req, res)
})

app.get('/api/dashboard/logs', (req, res) => {
  dashboardController.getLogs(req, res)
})

app.get('/api/dashboard/movies', (req, res) => {
  dashboardController.getMovies(req, res)
})

app.get('/api/dashboard/stats', (req, res) => {
  dashboardController.getStats(req, res)
})

// Radarr API routes
app.get('/api/radarr/config', (req, res) => {
  void dashboardController.getRadarrConfig(req, res)
})

app.use(express.json())
app.post('/api/radarr/add', (req, res) => {
  void dashboardController.addToRadarr(req, res)
})

// Movie details API route
app.get('/api/movies/:tmdbId/details', (req, res) => {
  void dashboardController.getMovieDetails(req, res)
})

// Serve dashboard HTML
app.get('/', (_req, res) => {
  // Try multiple paths to support both dev (src/) and prod (dist/) environments
  const possiblePaths = [
    path.join(import.meta.dir, 'Ui/Html/dashboard.html'),
    path.join(import.meta.dir, '../src/Ui/Html/dashboard.html'),
    path.join(process.cwd(), 'src/Ui/Html/dashboard.html'),
    path.join(process.cwd(), 'Ui/Html/dashboard.html')
  ]

  let html: string | null = null
  for (const htmlPath of possiblePaths) {
    if (fs.existsSync(htmlPath)) {
      html = fs.readFileSync(htmlPath, 'utf-8')
      break
    }
  }

  if (html !== null) {
    res.header('Content-Type', 'text/html')
    res.send(html)
  } else {
    logStore.log('error', 'Dashboard HTML not found', 'System', { triedPaths: possiblePaths })
    res.status(500).send('Dashboard not found')
  }
})

app.get('/dashboard', (_req, res) => {
  res.redirect('/')
})

// Start the server
const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => {
  logStore.log('info', `Server started on port ${PORT}`, 'System')
  console.log(`Server is running on http://localhost:${PORT}`)
  console.log(`Dashboard available at http://localhost:${PORT}/`)
})
