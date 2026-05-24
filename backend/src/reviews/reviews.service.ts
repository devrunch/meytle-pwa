import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { CompanionProfile } from '../companions/companion-profile.entity';
import { CreateReviewDto } from './dto/create-review.dto';

const REVIEW_WINDOW_MS = 14 * 24 * 60 * 60_000; // 14 days after completion

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @InjectRepository(CompanionProfile) private readonly companions: Repository<CompanionProfile>,
  ) {}

  async create(reviewerId: string, dto: CreateReviewDto): Promise<Review> {
    const booking = await this.bookings.findOne({
      where: { id: dto.bookingId },
      relations: ['companion'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== reviewerId) throw new ForbiddenException('Only the user can leave a review');
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Reviews can only be left for completed bookings');
    }

    const cutoff = new Date((booking.actualEnd ?? booking.bookedEnd).getTime() + REVIEW_WINDOW_MS);
    if (new Date() > cutoff) {
      throw new BadRequestException('Review window has expired (14 days after completion)');
    }

    const existing = await this.reviews.findOne({ where: { bookingId: dto.bookingId } });
    if (existing) throw new ConflictException('Review already submitted for this booking');

    const review = this.reviews.create({
      bookingId: dto.bookingId,
      reviewerId,
      companionId: booking.companion.id,
      starRating: dto.starRating,
      comment: dto.comment,
    });

    return this.reviews.save(review);
    // Note: rating_avg + rating_count on companion_profiles are updated by DB trigger
  }

  async getForCompanion(companionId: string): Promise<Review[]> {
    return this.reviews.find({
      where: { companionId, isRemoved: false },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
