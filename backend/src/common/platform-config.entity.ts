import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('platform_config')
export class PlatformConfig {
  @PrimaryColumn()
  key: string;

  @Column()
  value: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: User;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
