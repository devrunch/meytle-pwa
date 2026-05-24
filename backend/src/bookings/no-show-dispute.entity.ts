import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from '../users/user.entity';

@Entity('no_show_disputes')
export class NoShowDispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', unique: true })
  bookingId: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'reported_by_user_id' })
  reportedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by_user_id' })
  reportedBy: User;

  @CreateDateColumn({ name: 'reported_at' })
  reportedAt: Date;

  @Column({ name: 'companion_pct', type: 'decimal', precision: 5, scale: 2, nullable: true })
  companionPct: number;

  @Column({ name: 'user_refund_pct', type: 'decimal', precision: 5, scale: 2, nullable: true })
  userRefundPct: number;

  @Column({ name: 'platform_pct', type: 'decimal', precision: 5, scale: 2, nullable: true })
  platformPct: number;

  @Column({ name: 'resolved_by_admin_id', nullable: true })
  resolvedByAdminId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolved_by_admin_id' })
  resolvedByAdmin: User;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string;
}
