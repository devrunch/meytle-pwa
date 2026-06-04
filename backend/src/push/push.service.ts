import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscription } from './push-subscription.entity';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subs: Repository<PushSubscription>,
    private readonly config: ConfigService,
  ) {
    const pub  = this.config.get<string>('VAPID_PUBLIC_KEY');
    const priv = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subj = this.config.get<string>('VAPID_SUBJECT', 'mailto:noreply@meytle.com');

    if (pub && priv) {
      webpush.setVapidDetails(subj, pub, priv);
      this.enabled = true;
      this.logger.log('Push notifications enabled');
    } else {
      this.enabled = false;
      this.logger.warn('Push notifications disabled — set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY');
    }
  }

  async subscribe(userId: string, endpoint: string, p256dh: string, auth: string): Promise<void> {
    const existing = await this.subs.findOne({ where: { userId, endpoint } });
    if (existing) return;
    await this.subs.save(this.subs.create({ userId, endpoint, p256dh, auth }));
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.subs.delete({ userId, endpoint });
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) return;
    const subscriptions = await this.subs.find({ where: { userId } });
    const dead: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) dead.push(sub.endpoint);
          else this.logger.warn(`Push failed for ${sub.endpoint}: ${err.message}`);
        }
      }),
    );

    if (dead.length > 0) {
      await this.subs.delete(dead.map((endpoint) => ({ userId, endpoint })) as any);
    }
  }
}
