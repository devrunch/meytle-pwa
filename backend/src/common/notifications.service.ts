import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
  ) {}

  async send(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    bookingId?: string,
  ): Promise<Notification> {
    const notification = this.notifications.create({
      userId,
      type,
      title,
      body,
      bookingId,
    });
    return this.notifications.save(notification);
  }

  async getForUser(userId: string): Promise<Notification[]> {
    return this.notifications.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifications.count({ where: { userId, isRead: false } });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifications.update({ userId, isRead: false }, { isRead: true });
  }
}
