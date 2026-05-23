export type RequestStatus = 'pending' | 'confirmed' | 'declined' | 'completed'

export interface BookingRequest {
  id: string
  userName: string
  userInitials: string
  userAvatarUrl?: string
  service: string
  date: string
  time: string
  endTime: string
  duration: number
  location: string
  locationCoords?: { lng: number; lat: number }
  total: number
  status: RequestStatus
  note?: string
  // Custom booking fields (when user picks an unavailable date)
  isCustom?: boolean
  customFrom?: string
  customTo?: string
  tip?: number
}

export const MOCK_REQUESTS: BookingRequest[] = [
  {
    id: 'r1',
    userName: 'Amit S.',
    userInitials: 'AS',
    service: 'Coffee Date',
    date: 'May 21, 2026',
    time: '10:00 AM',
    endTime: '12:00 PM',
    duration: 2,
    location: 'Linking Road, Bandra West',
    locationCoords: { lng: 72.8347, lat: 19.0596 },
    total: 1600,
    status: 'pending',
    note: 'Looking forward to a relaxed morning chat! I\'ll be near the Starbucks entrance.',
  },
  {
    id: 'r2',
    userName: 'Ritu K.',
    userInitials: 'RK',
    service: 'Cultural Event',
    date: 'May 22, 2026',
    time: '3:00 PM',
    endTime: '6:00 PM',
    duration: 3,
    location: 'Prithvi Theatre, Juhu',
    locationCoords: { lng: 72.8270, lat: 19.0995 },
    total: 3000,
    status: 'pending',
  },
  {
    id: 'r5',
    userName: 'Neha V.',
    userInitials: 'NV',
    service: 'Nature Walk',
    date: 'May 25, 2026',
    time: '7:00 AM',
    endTime: '9:00 AM',
    duration: 2,
    location: 'Sanjay Gandhi National Park, Borivali',
    locationCoords: { lng: 72.8777, lat: 19.2147 },
    total: 1800,
    status: 'pending',
    isCustom: true,
    customFrom: '7:00 AM',
    customTo: '9:00 AM',
    tip: 200,
    note: 'Sunday is the only day I\'m free, hope you can make it!',
  },
  {
    id: 'r3',
    userName: 'Suresh M.',
    userInitials: 'SM',
    service: 'Coffee Date',
    date: 'May 23, 2026',
    time: '11:00 AM',
    endTime: '12:00 PM',
    duration: 1,
    location: 'Juhu Beach, near food stalls',
    locationCoords: { lng: 72.8264, lat: 19.0948 },
    total: 800,
    status: 'confirmed',
    note: 'I\'ll be wearing a red cap.',
  },
  {
    id: 'r4',
    userName: 'Divya P.',
    userInitials: 'DP',
    service: 'Concert',
    date: 'May 10, 2026',
    time: '6:00 PM',
    endTime: '10:00 PM',
    duration: 4,
    location: 'Jio World Drive, BKC',
    locationCoords: { lng: 72.8656, lat: 19.0638 },
    total: 4800,
    status: 'completed',
  },
]
