export interface RadarrMovie {
  id: number
  title: string
  tmdbId: number
  imdbId?: string
  hasFile: boolean
  monitored: boolean
}

export interface RadarrRootFolder {
  id: number
  path: string
  freeSpace: number
}

export interface RadarrQualityProfile {
  id: number
  name: string
}

export interface AddMovieRequest {
  tmdbId: number
  title: string
  year: number
  rootFolderPath: string
  qualityProfileId: number
  monitored?: boolean
  searchForMovie?: boolean
}

export interface RadarrClient {
  getMovies: () => Promise<RadarrMovie[]>
  isMovieInLibrary: (tmdbId: number) => Promise<boolean>
  getMovieByTmdbId: (tmdbId: number) => Promise<RadarrMovie | null>
  getRootFolders: () => Promise<RadarrRootFolder[]>
  getQualityProfiles: () => Promise<RadarrQualityProfile[]>
  addMovie: (request: AddMovieRequest) => Promise<RadarrMovie | null>
}

