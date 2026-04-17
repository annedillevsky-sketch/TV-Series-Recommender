export interface Show {
  id: string;
  title: string;
  rating: number; // 1-5
}

export type AgeRating = 'All ages' | '13+' | '14+' | '16+' | '18+';
export type ContentType = 'Movie' | 'TV Show' | 'Both';

export interface WatchlistItem {
  id: string;
  title: string;
  type: 'Movie' | 'TV Show';
  addedAt: number;
}

export interface UserPreferences {
  watchedShows: Show[];
  streamingApps: string[];
  ageRating: AgeRating;
  contentType: ContentType;
}

export interface Recommendation {
  title: string;
  summary: string;
  reason: string;
  genre: string;
  averageRating: string;
  trailerLink: string;
  type: 'Movie' | 'TV Show';
  streamingOn?: string[];
}
