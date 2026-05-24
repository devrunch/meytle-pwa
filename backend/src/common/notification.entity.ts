import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Booking } from '../bookings/booking.entity';

export enum NotificationType {
  BOOKING_REQUEST_RECEIVED = 'booking_request_received',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_DECLINED = 'booking_declined',
  BOOKING_EXPIRED = 'booking_expired',
  BOOKING_CANCELLED_BY_USER = 'booking_cancelled_by_user',
  BOOKING_CANCELLED_BY_COMPANION = 'booking_cancelled_by_companion',
  NEW_MESSAGE = 'new_message',
  REVIEW_AVAILABLE = 'review_available',
  CHAT_WINDOW_OPENING = 'chat_window_opening',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column()
  body: string;

  @Column({ name: 'booking_id', nullable: true })
  bookingId: string;

  @ManyToOne(() => Booking, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
