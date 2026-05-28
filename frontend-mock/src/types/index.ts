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

export interface Service {
  type: ExperienceType
  label: string
}

export interface Companion {
  id: string
  name: string
  age: number
  city: string
  neighbourhood: string
  bio: string
  avatarUrl: string | null
  initials: string
  services: Service[]
  rating: number
  reviewCount: number
  isVerified: boolean
  isAvailableNow: boolean
  priceFrom: number
}

export interface Experience {
  type: ExperienceType
  label: string
  imageUrl?: string
}

export type NavTab = 'home' | 'map' | 'messages' | 'bookings' | 'profile'

export type ButtonVariant = 'primary' | 'ghost' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'
