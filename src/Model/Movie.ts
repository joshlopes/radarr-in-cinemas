export interface Movie {
  title: string
  tmdbId: number
  tmdb_id: number
  poster: string
  images: {
    coverType: string
    url: string
  }[],
  description: string
  year: number,
  release_date: string
}
