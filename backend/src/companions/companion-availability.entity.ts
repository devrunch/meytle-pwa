import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { CompanionProfile } from './companion-profile.entity';

@Entity('companion_availability')
@Unique(['companionId', 'dayOfWeek'])
@Check(`"to_time" > "from_time"`)
export class CompanionAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'companion_id' })
  companionId: string;

  @ManyToOne(() => CompanionProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companion_id' })
  companion: CompanionProfile;

  // 0 = Monday, 6 = Sunday
  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek: number;

  @Column({ name: 'from_time', type: 'time' })
  fromTime: string;

  @Column({ name: 'to_time', type: 'time' })
  toTime: string;
}
