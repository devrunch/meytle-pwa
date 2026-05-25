import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { User } from '../users/user.entity';
import { CompanionProfile } from '../companions/companion-profile.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', unique: true })
  bookingId: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'reviewer_id' })
  reviewerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  // Denormalised for profile-page query performance
  @Column({ name: 'companion_id' })
  companionId: string;

  @ManyToOne(() => CompanionProfile)
  @JoinColumn({ name: 'companion_id' })
  companion: CompanionProfile;

  @Column({ name: 'star_rating', type: 'smallint' })
  starRating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'is_removed', default: false })
  isRemoved: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
