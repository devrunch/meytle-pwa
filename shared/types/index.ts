// Shared types used by both frontend and backend.
// Frontend imports: import type { ... } from '../../shared/types'
// Backend imports:  import type { ... } from '../../shared/types'

export type UserRole = 'user' | 'companion'

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export type ExperienceType =
  | 'coffee'
  | 'dining'
  | 'concert'
  | 'travel'
  | 'fitness'
  | 'culture'
  | 'nature'
  | 'movies'
  | 'shopping'
  | 'gaming'

// Expand these after specs are written
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
