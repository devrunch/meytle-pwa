import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CompanionProfile } from './companion-profile.entity';
import { ServiceType } from './service-type.enum';

@Entity('companion_services')
@Unique(['companionId', 'serviceType'])
export class CompanionService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'companion_id' })
  companionId: string;

  @ManyToOne(() => CompanionProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companion_id' })
  companion: CompanionProfile;

  @Column({ name: 'service_type', type: 'enum', enum: ServiceType })
  serviceType: ServiceType;
}
