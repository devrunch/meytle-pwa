import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('session_locations')
export class SessionLocation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ type: 'varchar', length: 10 })
  party: 'user' | 'companion';

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: string;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;

  // Deleted by cleanup job after this timestamp (max 48h)
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;
}
