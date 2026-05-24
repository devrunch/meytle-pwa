import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

export enum TipStatus {
  PENDING = 'pending',
  CAPTURED = 'captured',
  TRANSFERRED = 'transferred',
  REFUNDED = 'refunded',
}

@Entity('tip_payments')
export class TipPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', unique: true })
  bookingId: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  // Min ₹100 = 10000 paisa
  @Column({ name: 'amount_paisa', type: 'int' })
  amountPaisa: number;

  @Column({ name: 'stripe_payment_intent_id', unique: true })
  stripePaymentIntentId: string;

  @Column({ type: 'enum', enum: TipStatus, default: TipStatus.PENDING })
  status: TipStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
