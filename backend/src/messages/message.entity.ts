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

@Entity('messages')
export class Message {
  // BIGSERIAL: highest-insert table, sequential keeps B-tree tight
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'sender_id' })
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ type: 'text' })
  content: string;

  // Set TRUE when phone-number pattern matched server-side
  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}
