import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe = require('stripe');
import { User } from '../users/user.entity';
import { CompanionProfile } from '../companions/companion-profile.entity';
import { CompanionService as CompanionServiceEntity } from '../companions/companion-service.entity';
import { ServiceType } from '../companions/companion-profile.entity';
import { Booking, BookingStatus, CancelledByParty } from '../bookings/booking.entity';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUpdateCompanionDto } from './dto/admin-update-companion.dto';
import { AdminUpdateBookingDto } from './dto/admin-update-booking.dto';
import { AdminCaptureDto } from './dto/admin-capture.dto';
import { AdminRefundDto } from './dto/admin-refund.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(CompanionProfile) private readonly companions: Repository<CompanionProfile>,
    @InjectRepository(CompanionServiceEntity) private readonly companionServices: Repository<CompanionServiceEntity>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key?.startsWith('sk_')) {
      this.stripe = new Stripe(key, { apiVersion: '2026-05-27.dahlia' });
    }
  }

  // ── Stats ────────────────────────────────────────────────────────────────────

  async getStats() {
    const [
      totalUsers,
      totalCompanions,
      totalBookings,
      pendingCompanions,
      pendingBookings,
      activeBookings,
      completedBookings,
    ] = await Promise.all([
      this.users.count(),
      this.companions.count(),
      this.bookings.count(),
      this.companions.count({ where: { profileStatus: 'pending_verification' as any } }),
      this.bookings.count({ where: { status: BookingStatus.PENDING } }),
      this.bookings.count({ where: { status: BookingStatus.IN_PROGRESS } }),
      this.bookings.count({ where: { status: BookingStatus.COMPLETED } }),
    ]);

    const revenueRow = await this.bookings
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.platform_fee_paisa), 0)', 'total')
      .where('b.status = :s', { s: BookingStatus.COMPLETED })
      .getRawOne<{ total: string }>();

    const gmvRow = await this.bookings
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.amount_paisa), 0)', 'total')
      .where('b.status = :s', { s: BookingStatus.COMPLETED })
      .getRawOne<{ total: string }>();

    return {
      totalUsers,
      totalCompanions,
      totalBookings,
      completedBookings,
      pendingCompanions,
      pendingBookings,
      activeBookings,
      totalRevenuePaisa: parseInt(revenueRow?.total ?? '0', 10) || 0,
      totalGmvPaisa: parseInt(gmvRow?.total ?? '0', 10) || 0,
    };
  }

  async getDailyRevenue(days = 14) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.bookings
      .createQueryBuilder('b')
      .select(`TO_CHAR(b.created_at, 'YYYY-MM-DD')`, 'date')
      .addSelect('COALESCE(SUM(b.platform_fee_paisa), 0)', 'revenuePaisa')
      .addSelect('COUNT(b.id)', 'count')
      .where('b.status = :s AND b.created_at >= :since', { s: BookingStatus.COMPLETED, since })
      .groupBy(`TO_CHAR(b.created_at, 'YYYY-MM-DD')`)
      .orderBy(`TO_CHAR(b.created_at, 'YYYY-MM-DD')`, 'ASC')
      .getRawMany<{ date: string; revenuePaisa: string; count: string }>();

    const map = new Map(rows.map((r) => [r.date, r]));
    const result: { date: string; revenuePaisa: number; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const row = map.get(key);
      result.push({
        date: key,
        revenuePaisa: parseInt(row?.revenuePaisa ?? '0', 10),
        count: parseInt(row?.count ?? '0', 10),
      });
    }
    return result;
  }

  async getRecentBookings(limit = 8) {
    return this.bookings.find({
      relations: { user: true, companion: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  async findAllUsers(page = 1, limit = 30) {
    const [items, total] = await this.users.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findUser(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, dto: AdminUpdateUserDto) {
    const user = await this.findUser(id);
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.email !== undefined) user.email = dto.email.toLowerCase();
    if (dto.roles !== undefined) user.roles = dto.roles;
    if (dto.bio !== undefined) user.bio = dto.bio ?? null;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl ?? null;
    if (dto.dateOfBirth !== undefined) user.dateOfBirth = dto.dateOfBirth ?? null;
    if (dto.interests !== undefined) user.interests = dto.interests ?? null;
    return this.users.save(user);
  }

  // ── Companions ───────────────────────────────────────────────────────────────

  async findAllCompanions(page = 1, limit = 30, status?: string) {
    const where = status ? { profileStatus: status as any } : {};
    const [items, total] = await this.companions.findAndCount({
      where,
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findCompanion(id: string) {
    const c = await this.companions.findOne({
      where: { id },
      relations: { user: true, services: true, availability: true },
    });
    if (!c) throw new NotFoundException('Companion not found');
    return c;
  }

  async updateCompanion(id: string, dto: AdminUpdateCompanionDto) {
    const c = await this.findCompanion(id);
    if (dto.profileStatus !== undefined) c.profileStatus = dto.profileStatus;
    if (dto.displayName !== undefined) c.displayName = dto.displayName;
    if (dto.bio !== undefined) c.bio = dto.bio;
    if (dto.profilePhotoUrl !== undefined) c.profilePhotoUrl = dto.profilePhotoUrl ?? null;
    if (dto.hourlyRatePaisa !== undefined) c.hourlyRatePaisa = dto.hourlyRatePaisa;
    if (dto.isAvailableNow !== undefined) c.isAvailableNow = dto.isAvailableNow;
    if (dto.dateOfBirth !== undefined) c.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.serviceAreaRadiusKm !== undefined) c.serviceAreaRadiusKm = dto.serviceAreaRadiusKm;
    if (dto.identityVerifiedByAdmin !== undefined) c.identityVerifiedByAdmin = dto.identityVerifiedByAdmin;
    if (dto.stripePayoutsEnabled !== undefined) c.stripePayoutsEnabled = dto.stripePayoutsEnabled;
    if (dto.ratingAvg !== undefined) c.ratingAvg = dto.ratingAvg;
    if (dto.ratingCount !== undefined) c.ratingCount = dto.ratingCount;
    return this.companions.save(c);
  }

  async setCompanionServices(companionId: string, serviceTypes: ServiceType[]) {
    await this.companionServices.delete({ companionId });
    if (serviceTypes.length > 0) {
      const entities = serviceTypes.map((st) =>
        this.companionServices.create({ companionId, serviceType: st }),
      );
      await this.companionServices.save(entities);
    }
    return this.findCompanion(companionId);
  }

  // ── Bookings ─────────────────────────────────────────────────────────────────

  async findAllBookings(page = 1, limit = 30, status?: string) {
    const where = status ? { status: status as BookingStatus } : {};
    const [items, total] = await this.bookings.findAndCount({
      where,
      relations: { user: true, companion: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findBooking(id: string) {
    const b = await this.bookings.findOne({
      where: { id },
      relations: { user: true, companion: { user: true } },
    });
    if (!b) throw new NotFoundException('Booking not found');
    return b;
  }

  async updateBooking(id: string, dto: AdminUpdateBookingDto) {
    const b = await this.findBooking(id);
    if (dto.status !== undefined) b.status = dto.status;
    if (dto.companionPayoutPaisa !== undefined) b.companionPayoutPaisa = dto.companionPayoutPaisa;
    if (dto.platformFeePaisa !== undefined) b.platformFeePaisa = dto.platformFeePaisa;
    if (dto.cancelledBy !== undefined) {
      b.cancelledBy = dto.cancelledBy;
      b.cancelledAt = new Date();
    }
    if (dto.cancellationReason !== undefined) b.cancellationReason = dto.cancellationReason;
    return this.bookings.save(b);
  }

  // ── Payment: Capture ─────────────────────────────────────────────────────────

  async capturePayment(id: string, dto: AdminCaptureDto) {
    if (!this.stripe) throw new InternalServerErrorException('Stripe not configured');

    const b = await this.findBooking(id);
    if (!b.stripePaymentIntentId) throw new BadRequestException('No payment intent on this booking');

    const intent = await this.stripe.paymentIntents.retrieve(b.stripePaymentIntentId);
    if (intent.status !== 'requires_capture') {
      throw new BadRequestException(`Cannot capture — intent status is "${intent.status}"`);
    }

    await this.stripe.paymentIntents.capture(
      b.stripePaymentIntentId,
      dto.amountPaisa ? { amount_to_capture: dto.amountPaisa } : undefined,
    );

    if (dto.amountPaisa) {
      const feePct = this.config.get<number>('PLATFORM_FEE_PERCENT', 5) / 100;
      b.platformFeePaisa = Math.round(dto.amountPaisa * feePct);
      b.companionPayoutPaisa = dto.amountPaisa - b.platformFeePaisa;
      b.amountPaisa = dto.amountPaisa;
    }
    b.status = BookingStatus.COMPLETED;
    b.actualEnd = new Date();
    await this.bookings.save(b);

    this.logger.log(`Admin captured PI ${b.stripePaymentIntentId} for booking ${id}`);
    return { success: true, booking: b };
  }

  // ── Payment: Refund ──────────────────────────────────────────────────────────

  async refundPayment(id: string, dto: AdminRefundDto) {
    if (!this.stripe) throw new InternalServerErrorException('Stripe not configured');

    const b = await this.findBooking(id);
    if (!b.stripePaymentIntentId) throw new BadRequestException('No payment intent on this booking');

    const intent = await this.stripe.paymentIntents.retrieve(b.stripePaymentIntentId);

    if (intent.status === 'requires_capture') {
      await this.stripe.paymentIntents.cancel(b.stripePaymentIntentId);
      b.status = BookingStatus.CANCELLED;
      b.cancelledBy = CancelledByParty.ADMIN;
      b.cancellationReason = dto.reason ?? 'Admin cancelled';
      b.cancelledAt = new Date();
      await this.bookings.save(b);
      return { success: true, action: 'cancelled', booking: b };
    }

    if (intent.status !== 'succeeded') {
      throw new BadRequestException(`Cannot refund — intent status is "${intent.status}"`);
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: b.stripePaymentIntentId,
      ...(dto.amountPaisa && { amount: dto.amountPaisa }),
      reason: dto.reason ? 'fraudulent' : 'requested_by_customer',
    });

    const isFullRefund = !dto.amountPaisa || dto.amountPaisa >= (intent.amount_received ?? intent.amount);
    if (isFullRefund) {
      b.status = BookingStatus.CANCELLED;
      b.cancelledBy = CancelledByParty.ADMIN;
      b.cancellationReason = dto.reason ?? 'Admin refunded';
      b.cancelledAt = new Date();
      await this.bookings.save(b);
    }

    this.logger.log(`Admin refunded PI ${b.stripePaymentIntentId}: ${refund.id}`);
    return { success: true, action: 'refunded', refundId: refund.id, booking: b };
  }

  // ── Payment: Cancel Intent ───────────────────────────────────────────────────

  async cancelBookingPayment(id: string, reason: string) {
    if (!this.stripe) throw new InternalServerErrorException('Stripe not configured');

    const b = await this.findBooking(id);
    if (!b.stripePaymentIntentId) throw new BadRequestException('No payment intent on this booking');

    const intent = await this.stripe.paymentIntents.retrieve(b.stripePaymentIntentId);
    const cancellable = ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture'];

    if (cancellable.includes(intent.status)) {
      await this.stripe.paymentIntents.cancel(b.stripePaymentIntentId);
    }

    b.status = BookingStatus.CANCELLED;
    b.cancelledBy = CancelledByParty.ADMIN;
    b.cancellationReason = reason;
    b.cancelledAt = new Date();
    await this.bookings.save(b);

    this.logger.log(`Admin cancelled booking ${id}`);
    return { success: true, booking: b };
  }
}
