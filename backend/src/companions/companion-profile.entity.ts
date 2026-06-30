import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { CompanionService } from './companion-service.entity';
import { CompanionAvailability } from './companion-availability.entity';
export { ServiceType } from './service-type.enum';

export enum CompanionStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REJECTED = 'rejected',
}

import { ServiceType } from './service-type.enum';

@Entity('companion_profiles')
export class CompanionProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ nullable: true, length: 300 })
  bio: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ name: 'profile_photo_url', type: 'varchar', nullable: true })
  profilePhotoUrl: string | null;

  @Column({ name: 'hourly_rate_paisa', type: 'int' })
  hourlyRatePaisa: number;

  @Column({
    name: 'profile_status',
    type: 'enum',
    enum: CompanionStatus,
    default: CompanionStatus.PENDING_VERIFICATION,
  })
  profileStatus: CompanionStatus;

  @Column({ name: 'is_available_now', default: false })
  isAvailableNow: boolean;

  // PostGIS geography point — stored as WKT string, queried via raw SQL
  @Column({
    name: 'service_area_centre',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  serviceAreaCentre: string;

  @Column({
    name: 'service_area_radius_km',
    type: 'decimal',
    precision: 4,
    scale: 1,
    default: 10,
  })
  serviceAreaRadiusKm: number;

  @Column({ name: 'stripe_connected_account_id', nullable: true, unique: true })
  stripeConnectedAccountId: string;

  @Column({ name: 'stripe_payouts_enabled', default: false })
  stripePayoutsEnabled: boolean;

  @Column({ name: 'identity_verified_by_stripe', default: false })
  identityVerifiedByStripe: boolean;

  @Column({ name: 'identity_verified_by_veriff', default: false })
  identityVerifiedByVeriff: boolean;

  @Column({ name: 'identity_verified_by_admin', default: false })
  identityVerifiedByAdmin: boolean;

  @Column({ name: 'rating_avg', type: 'decimal', precision: 3, scale: 1, nullable: true })
  ratingAvg: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount: number;

  @OneToMany(() => CompanionService, (s) => s.companion, { eager: false })
  services: CompanionService[];

  @OneToMany(() => CompanionAvailability, (a) => a.companion, { eager: false })
  availability: CompanionAvailability[];

  @Column({ name: 'agreed_to_terms_at', type: 'timestamptz', nullable: true })
  agreedToTermsAt: Date | null;

  @Column({ name: 'agreement_ip', type: 'varchar', nullable: true })
  agreementIp: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
