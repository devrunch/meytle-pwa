import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, IsNull } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Booking, BookingStatus, CancelledByParty } from './booking.entity';
import { CompanionProfile } from '../companions/companion-profile.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { MailService } from '../mail/mail.service';

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(CompanionProfile) private readonly companions: Repository<CompanionProfile>,
    private readonly dataSource: DataSource,
    private readonly mail: MailService,
  ) {}

  async create(userId: string, dto: CreateBookingDto): Promise<Booking> {
    const companion = await this.companions.findOne({ where: { id: dto.companionId } });
    if (!companion) throw new NotFoundException('Companion not found');

    const bookedStart = new Date(dto.bookedStart);
    const bookedEnd   = new Date(bookedStart.getTime() + dto.bookedDurationMinutes * 60_000);
    const [lng, lat]  = dto.meetingSpot;

    const booking = this.bookings.create({
      userId,
      companionId:           dto.companionId,
      serviceType:           dto.serviceType,
      bookedStart,
      bookedEnd,
      bookedDurationMinutes: dto.bookedDurationMinutes,
      meetingSpotText:       dto.meetingSpotText,
      isCustomRequest:       dto.isCustomRequest ?? false,
      customNote:            dto.customNote,
      amountPaisa:           companion.hourlyRatePaisa * (dto.bookedDurationMinutes / 60),
      status:                BookingStatus.PENDING,
    });

    await this.bookings.save(booking);

    await this.dataSource.query(
      `UPDATE bookings SET meeting_spot = ST_GeomFromEWKT($1) WHERE id = $2`,
      [`SRID=4326;POINT(${lng} ${lat})`, booking.id],
    );

    return booking;
  }

  async findForUser(userId: string): Promise<Booking[]> {
    return this.bookings.find({
      where: { userId },
      relations: { companion: { user: true } },
      order: { bookedStart: 'DESC' },
    });
  }

  async findForCompanion(userId: string): Promise<Booking[]> {
    const companion = await this.companions.findOne({ where: { userId } });
    if (!companion) throw new NotFoundException('No companion profile found');

    return this.bookings.find({
      where: { companionId: companion.id },
      relations: { user: true },
      order: { bookedStart: 'DESC' },
    });
  }

  private async attachMeetingSpotEwkt(booking: Booking): Promise<Booking> {
    const [row] = await this.dataSource.query(
      `SELECT ST_AsEWKT(meeting_spot::geometry) AS ewkt FROM bookings WHERE id = $1`,
      [booking.id],
    );
    booking.meetingSpot = row?.ewkt ?? null;
    return booking;
  }

  async findById(id: string, requesterId: string): Promise<Booking> {
    const booking = await this.bookings.findOne({
      where: { id },
      relations: { user: true, companion: { user: true } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    this.assertParticipant(booking, requesterId);
    return this.attachMeetingSpotEwkt(booking);
  }

  /** Returns the OTP for the booking — only accessible by the booking's user. */
  async getOtpForUser(bookingId: string, userId: string): Promise<{ otpCode: string }> {
    const booking = await this.bookings.findOne({
      where: { id: bookingId },
      select: { id: true, userId: true, status: true, otpCode: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('OTP is only available for confirmed bookings');
    }
    return { otpCode: booking.otpCode! };
  }

  async acceptByCompanion(bookingId: string, userId: string): Promise<Booking> {
    const booking = await this.getOwnedByCompanion(bookingId, userId);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be accepted');
    }

    const otp = this.generateOtp();
    await this.bookings.update(bookingId, {
      status:  BookingStatus.CONFIRMED,
      otpCode: otp,
    });

    // Notify the user
    const full = await this.bookings.findOne({
      where: { id: bookingId },
      relations: { user: true, companion: true },
    });
    if (full?.user?.email) {
      await this.mail.send(
        full.user.email,
        'Your booking is confirmed! 🎉',
        this.mail.bookingConfirmedUser(
          full.user.fullName,
          full.companion?.displayName ?? 'your companion',
          fmtDate(full.bookedStart),
          fmtTime(full.bookedStart),
        ),
      );
    }

    return this.bookings.findOne({ where: { id: bookingId } }) as Promise<Booking>;
  }

  async declineByCompanion(bookingId: string, userId: string): Promise<Booking> {
    const booking = await this.getOwnedByCompanion(bookingId, userId);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be declined');
    }

    await this.bookings.update(bookingId, {
      status:             BookingStatus.CANCELLED,
      cancelledBy:        CancelledByParty.COMPANION,
      cancelledAt:        new Date(),
      cancellationReason: 'Declined by companion',
    });

    // Notify the user
    const full = await this.bookings.findOne({
      where: { id: bookingId },
      relations: { user: true, companion: true },
    });
    if (full?.user?.email) {
      await this.mail.send(
        full.user.email,
        'Booking request declined',
        this.mail.bookingDeclinedUser(
          full.user.fullName,
          full.companion?.displayName ?? 'the companion',
          fmtDate(full.bookedStart),
        ),
      );
    }

    return this.bookings.findOne({ where: { id: bookingId } }) as Promise<Booking>;
  }

  async cancelByUser(bookingId: string, userId: string, dto: CancelBookingDto): Promise<Booking> {
    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== userId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Cannot cancel — contact support for confirmed bookings');
    }

    await this.bookings.update(bookingId, {
      status:             BookingStatus.CANCELLED,
      cancelledBy:        CancelledByParty.USER,
      cancelledAt:        new Date(),
      cancellationReason: dto.reason,
    });

    return this.bookings.findOne({ where: { id: bookingId } }) as Promise<Booking>;
  }

  /** Called by the COMPANION to verify the OTP the user shows them. */
  async verifyOtp(bookingId: string, companionUserId: string, dto: VerifyOtpDto): Promise<Booking> {
    const companion = await this.companions.findOne({ where: { userId: companionUserId } });
    if (!companion) throw new ForbiddenException();

    const booking = await this.bookings.findOne({
      where: { id: bookingId },
      select: { id: true, companionId: true, status: true, otpCode: true, bookedStart: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.companionId !== companion.id) throw new ForbiddenException();
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Booking is not in confirmed state');
    }

    const now      = new Date();
    const diffMs   = now.getTime() - new Date(booking.bookedStart).getTime();
    if (diffMs < -15 * 60_000 || diffMs > 45 * 60_000) {
      throw new BadRequestException('OTP can only be verified within 15 min before to 45 min after the booking start time');
    }

    if (booking.otpCode !== dto.otpCode) {
      throw new BadRequestException('Invalid OTP');
    }

    const actualStart = new Date();
    await this.bookings.update(bookingId, {
      status:         BookingStatus.IN_PROGRESS,
      actualStart,
      otpVerifiedAt:  actualStart,
    });

    return this.bookings.findOne({ where: { id: bookingId } }) as Promise<Booking>;
  }

  async endSession(bookingId: string, companionUserId: string): Promise<Booking> {
    const booking = await this.getOwnedByCompanion(bookingId, companionUserId);
    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
    }

    await this.bookings.update(bookingId, {
      status:    BookingStatus.COMPLETED,
      actualEnd: new Date(),
    });

    return this.bookings.findOne({ where: { id: bookingId } }) as Promise<Booking>;
  }

  // ── Scheduled jobs ──────────────────────────────────────────────────────────

  /** Auto-expire pending bookings not accepted within 24h. */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoExpirePending(): Promise<void> {
    const cutoff  = new Date(Date.now() - 24 * 60 * 60_000);
    const expired = await this.bookings.find({
      where: { status: BookingStatus.PENDING, createdAt: LessThan(cutoff) },
    });

    for (const b of expired) {
      await this.bookings.update(b.id, {
        status:             BookingStatus.CANCELLED,
        cancelledBy:        CancelledByParty.SYSTEM,
        cancelledAt:        new Date(),
        cancellationReason: 'Auto-expired: companion did not respond within 24 hours',
      });
    }
  }

  /** Auto-complete in_progress bookings past booked end + 2h grace. */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoCompleteExpired(): Promise<void> {
    const graceCutoff = new Date(Date.now() - 2 * 60 * 60_000);
    const overdue     = await this.bookings.find({
      where: { status: BookingStatus.IN_PROGRESS, bookedEnd: LessThan(graceCutoff) },
    });

    for (const b of overdue) {
      await this.bookings.update(b.id, {
        status:        BookingStatus.COMPLETED,
        actualEnd:     new Date(b.bookedEnd.getTime() + 2 * 60 * 60_000),
        autoCompleted: true,
      });
    }
  }

  /** Auto-cancel confirmed bookings where OTP not verified 45min after start time. */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoNoShow(): Promise<void> {
    const cutoff   = new Date(Date.now() - 45 * 60_000);
    const noShows  = await this.bookings.find({
      where: {
        status:        BookingStatus.CONFIRMED,
        bookedStart:   LessThan(cutoff),
        otpVerifiedAt: IsNull(),
      },
      relations: { user: true, companion: { user: true } },
    });

    for (const b of noShows) {
      await this.bookings.update(b.id, {
        status:             BookingStatus.CANCELLED,
        cancelledBy:        CancelledByParty.SYSTEM,
        cancelledAt:        new Date(),
        cancellationReason: 'No-show: OTP not verified within 45 minutes of scheduled start time',
      });

      const dateStr = fmtDate(b.bookedStart);

      if (b.user?.email) {
        await this.mail.send(
          b.user.email,
          'Booking cancelled — no-show',
          this.mail.noShowUser(
            b.user.fullName,
            b.companion?.displayName ?? 'your companion',
            dateStr,
          ),
        );
      }

      if (b.companion?.user?.email) {
        await this.mail.send(
          b.companion.user.email,
          'Session cancelled — no-show',
          this.mail.noShowCompanion(
            b.companion.displayName,
            b.user?.fullName ?? 'the client',
            dateStr,
          ),
        );
      }
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private async getOwnedByCompanion(bookingId: string, companionUserId: string): Promise<Booking> {
    const companion = await this.companions.findOne({ where: { userId: companionUserId } });
    if (!companion) throw new ForbiddenException('Not a companion');

    const booking = await this.bookings.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.companionId !== companion.id) throw new ForbiddenException();
    return booking;
  }

  private assertParticipant(booking: Booking, userId: string): void {
    const isUser      = booking.userId === userId;
    const isCompanion = booking.companion?.userId === userId;
    if (!isUser && !isCompanion) throw new ForbiddenException();
  }
}
