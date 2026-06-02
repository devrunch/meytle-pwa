export type UserRole = 'user' | 'companion' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  bio?: string | null;
  interests?: string[] | null;
  photos?: string[] | null;
  roles: UserRole[];
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanionProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  profilePhotoUrl?: string;
  hourlyRatePaisa: number;
  ratingAvg?: number;
  ratingCount?: number;
  isAvailableNow: boolean;
  profileStatus: 'pending_verification' | 'active' | 'inactive' | 'rejected';
  serviceAreaRadiusKm: number;
  serviceAreaCentre?: string;
  dateOfBirth?: string | null;
  stripeConnectedAccountId?: string | null;
  stripePayoutsEnabled?: boolean;
  identityVerifiedByStripe?: boolean;
  identityVerifiedByVeriff?: boolean;
  identityVerifiedByAdmin?: boolean;
  services?: CompanionService[];
  user?: User;
}

export interface CompanionAvailability {
  id: string;
  companionId: string;
  dayOfWeek: number;
  fromTime: string;
  toTime: string;
}

export interface CompanionService {
  id: string;
  companionId: string;
  serviceType: ServiceType;
}

export type ServiceType = 'coffee' | 'dining' | 'concert' | 'travel' | 'fitness' | 'culture' | 'nature' | 'movies' | 'shopping' | 'gaming';

export interface Booking {
  id: string;
  userId: string;
  companionId: string;
  serviceType: ServiceType;
  bookedStart: string;
  bookedEnd: string;
  bookedDurationMinutes: number;
  meetingSpotText: string;
  meetingSpot?: string;
  amountPaisa: number;
  status: BookingStatus;
  otpCode?: string;
  otpVerifiedAt?: string;
  actualStart?: string;
  actualEnd?: string;
  cancelledBy?: 'user' | 'companion' | 'system';
  cancelledAt?: string;
  cancellationReason?: string;
  isCustomRequest: boolean;
  customNote?: string;
  companion?: CompanionProfile;
  user?: User;
  createdAt: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  isBlocked: boolean;
  sentAt: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  defaultRadiusKm: number;
  displayOrder: number;
  isActive: boolean;
}
