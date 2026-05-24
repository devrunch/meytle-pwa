import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('stripe_webhook_events')
export class StripeWebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stripe_event_id', unique: true })
  stripeEventId: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ default: false })
  processed: boolean;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
