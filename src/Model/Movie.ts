export interface Movie {
  title: string
  tmdbId: number
  tmdb_id: number
  imdbId: string
  imdb_id: string
  poster: string
  images: Array<{
    coverType: string
    url: string
  }>
  description: string
  year: number
  release_date: string
}
