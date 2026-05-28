import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  COMPANION = 'companion',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'avatar_url', nullable: true, type: 'text' })
  avatarUrl: string | null;

  @Column({ name: 'date_of_birth', nullable: true, type: 'date' })
  dateOfBirth: string | null;

  @Column({ nullable: true, type: 'text' })
  bio: string | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  interests: string[] | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  photos: string[] | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.USER],
  })
  roles: UserRole[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
