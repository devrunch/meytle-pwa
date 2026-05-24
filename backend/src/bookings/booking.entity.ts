import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { User } from '../users/user.entity';
import { CompanionProfile, ServiceType } from '../companions/companion-profile.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CancelledByParty {
  USER = 'user',
  COMPANION = 'companion',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

@Entity('bookings')
@Check(`"booked_end" > "booked_start"`)
@Check(`"actual_end" IS NULL OR "actual_end" >= "actual_start"`)
@Check(`("cancelled_by" IS NULL) = ("cancelled_at" IS NULL)`)
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'companion_id' })
  companionId: string;

  @ManyToOne(() => CompanionProfile)
  @JoinColumn({ name: 'companion_id' })
  companion: CompanionProfile;

  @Column({ name: 'service_type', type: 'enum', enum: ServiceType })
  serviceType: ServiceType;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ name: 'booked_start', type: 'timestamptz' })
  bookedStart: Date;

  @Column({ name: 'booked_end', type: 'timestamptz' })
  bookedEnd: Date;

  @Column({ name: 'booked_duration_minutes', type: 'smallint' })
  bookedDurationMinutes: number;

  @Column({ name: 'actual_start', type: 'timestamptz', nullable: true })
  actualStart: Date;

  @Column({ name: 'actual_end', type: 'timestamptz', nullable: true })
  actualEnd: Date;

  @Column({ name: 'auto_completed', default: false })
  autoCompleted: boolean;

  // PostGIS geography point
  @Column({
    name: 'meeting_spot',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  meetingSpot: string;

  @Column({ name: 'meeting_spot_text', type: 'text' })
  meetingSpotText: string;

  @Column({ name: 'is_custom_request', default: false })
  isCustomRequest: boolean;

  @Column({ name: 'custom_note', type: 'text', nullable: true })
  customNote: string;

  // OTP — 6-digit string, plain text (session-scoped one-time code)
  @Column({ name: 'otp_code', type: 'char', length: 6, nullable: true, select: false })
  otpCode: string;

  @Column({ name: 'otp_verified_at', type: 'timestamptz', nullable: true })
  otpVerifiedAt: Date;

  @Column({ name: 'amount_paisa', type: 'int' })
  amountPaisa: number;

  @Column({ name: 'platform_fee_paisa', type: 'int', nullable: true })
  platformFeePaisa: number;

  @Column({ name: 'companion_payout_paisa', type: 'int', nullable: true })
  companionPayoutPaisa: number;

  @Column({ name: 'stripe_payment_intent_id', nullable: true, unique: true })
  stripePaymentIntentId: string;

  @Column({ name: 'cancelled_by', type: 'enum', enum: CancelledByParty, nullable: true })
  cancelledBy: CancelledByParty;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
