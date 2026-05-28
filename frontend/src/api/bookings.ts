import { client } from './client';
import type { Booking } from '../types';

export const bookingsApi = {
  myBookings: () => client.get<Booking[]>('/bookings').then((r) => r.data),
};
