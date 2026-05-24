import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { CompanionProfile } from '../companions/companion-profile.entity';

@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'companion_id' })
  companionId: string;

  @ManyToOne(() => CompanionProfile)
  @JoinColumn({ name: 'companion_id' })
  companion: CompanionProfile;

  @Column({ name: 'booking_id', unique: true })
  bookingId: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'stripe_transfer_id', unique: true })
  stripeTransferId: string;

  @Column({ name: 'amount_paisa', type: 'int' })
  amountPaisa: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
