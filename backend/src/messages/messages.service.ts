import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { MessageRead } from './message-read.entity';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { CompanionProfile } from '../companions/companion-profile.entity';

// Phone number pattern — 10+ consecutive digits (with optional +, spaces, dashes)
const PHONE_PATTERN = /(\+?[\d\s\-]{10,})/;

const CHAT_WINDOW_OPEN_BEFORE_MS = 3 * 60 * 60_000;   // 3h before start
const CHAT_WINDOW_CLOSE_AFTER_MS = 24 * 60 * 60_000;  // 24h after end

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(MessageRead) private readonly reads: Repository<MessageRead>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(CompanionProfile) private readonly companions: Repository<CompanionProfile>,
  ) {}

  async getThread(bookingId: string, userId: string): Promise<Message[]> {
    await this.assertAccess(bookingId, userId);
    return this.messages.find({
      where: { bookingId, isBlocked: false },
      order: { sentAt: 'ASC' },
      take: 200,
    });
  }

  async send(bookingId: string, senderId: string, content: string): Promise<Message> {
    await this.assertAccess(bookingId, senderId);

    const isBlocked = PHONE_PATTERN.test(content);

    const msg = this.messages.create({
      bookingId,
      senderId,
      content,
      isBlocked,
    });

    return this.messages.save(msg);
  }

  async markRead(bookingId: string, userId: string): Promise<void> {
    await this.reads.upsert(
      { userId, bookingId, lastReadAt: new Date() },
      ['userId', 'bookingId'],
    );
  }

  private async assertAccess(bookingId: string, userId: string): Promise<Booking> {
    const booking = await this.bookings.findOne({
      where: { id: bookingId },
      relations: ['companion'],
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Resolve companion's user ID
    const companionUserId = booking.companion?.userId;
    const isParticipant = booking.userId === userId || companionUserId === userId;
    if (!isParticipant) throw new ForbiddenException();

    if (booking.status === BookingStatus.CANCELLED) {
      throw new ForbiddenException('Chat is read-only for cancelled bookings');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      // Allow in_progress too — companion may need to contact user
      if (
        booking.status !== BookingStatus.IN_PROGRESS &&
        booking.status !== BookingStatus.COMPLETED
      ) {
        throw new ForbiddenException('Chat is not yet available for this booking');
      }
    }

    const now = Date.now();
    const openAt = new Date(booking.bookedStart).getTime() - CHAT_WINDOW_OPEN_BEFORE_MS;
    const closeAt = new Date(booking.bookedEnd).getTime() + CHAT_WINDOW_CLOSE_AFTER_MS;

    if (now < openAt) {
      throw new BadRequestException(
        `Chat opens 3 hours before the booking starts`,
      );
    }
    if (now > closeAt) {
      throw new ForbiddenException('Chat window has closed for this booking');
    }

    return booking;
  }
}
