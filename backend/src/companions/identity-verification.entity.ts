import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CompanionProfile } from './companion-profile.entity';
import { User } from '../users/user.entity';

export enum VerificationTier {
  STRIPE_IDENTITY = 'stripe_identity',
  VERIFF = 'veriff',
  MANUAL = 'manual',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  NEEDS_RESUBMISSION = 'needs_resubmission',
  FAILED = 'failed',
}

@Entity('identity_verifications')
export class IdentityVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'companion_id' })
  companionId: string;

  @ManyToOne(() => CompanionProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companion_id' })
  companion: CompanionProfile;

  @Column({ type: 'enum', enum: VerificationTier })
  tier: VerificationTier;

  @Column({ name: 'external_session_id', nullable: true })
  externalSessionId: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Column({ name: 'document_url', nullable: true })
  documentUrl: string;

  @Column({ name: 'admin_reviewer_id', nullable: true })
  adminReviewerId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_reviewer_id' })
  adminReviewer: User;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
