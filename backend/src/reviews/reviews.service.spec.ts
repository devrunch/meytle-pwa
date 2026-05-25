import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Review } from './review.entity';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { CompanionProfile } from '../companions/companion-profile.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepo: ReturnType<typeof mockRepo>;
  let bookingRepo: ReturnType<typeof mockRepo>;

  const completedBooking = (overrides = {}): Partial<Booking> => ({
    id: 'bk1',
    userId: 'u1',
    companion: { id: 'cp1' } as CompanionProfile,
    status: BookingStatus.COMPLETED,
    actualEnd: new Date(Date.now() - 1 * 60 * 60_000), // ended 1h ago
    bookedEnd: new Date(Date.now() - 1 * 60 * 60_000),
    ...overrides,
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useFactory: mockRepo },
        { provide: getRepositoryToken(Booking), useFactory: mockRepo },
        { provide: getRepositoryToken(CompanionProfile), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(ReviewsService);
    reviewRepo = module.get(getRepositoryToken(Review));
    bookingRepo = module.get(getRepositoryToken(Booking));
  });

  it('creates a review for a completed booking', async () => {
    bookingRepo.findOne.mockResolvedValue(completedBooking());
    reviewRepo.findOne.mockResolvedValue(null);
    const review = { id: 'r1', bookingId: 'bk1', starRating: 5 };
    reviewRepo.create.mockReturnValue(review);
    reviewRepo.save.mockResolvedValue(review);

    const result = await service.create('u1', { bookingId: 'bk1', starRating: 5 });
    expect(result).toEqual(review);
  });

  it('throws ForbiddenException if reviewer is not the booking user', async () => {
    bookingRepo.findOne.mockResolvedValue(completedBooking());
    await expect(service.create('other', { bookingId: 'bk1', starRating: 5 }))
      .rejects.toThrow(ForbiddenException);
  });

  it('throws BadRequestException for non-completed bookings', async () => {
    bookingRepo.findOne.mockResolvedValue(completedBooking({ status: BookingStatus.CONFIRMED }));
    await expect(service.create('u1', { bookingId: 'bk1', starRating: 4 }))
      .rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException after 14-day review window', async () => {
    bookingRepo.findOne.mockResolvedValue(completedBooking({
      actualEnd: new Date(Date.now() - 15 * 24 * 60 * 60_000), // 15 days ago
    }));
    await expect(service.create('u1', { bookingId: 'bk1', starRating: 4 }))
      .rejects.toThrow(BadRequestException);
  });

  it('throws ConflictException if review already exists', async () => {
    bookingRepo.findOne.mockResolvedValue(completedBooking());
    reviewRepo.findOne.mockResolvedValue({ id: 'existing' });
    await expect(service.create('u1', { bookingId: 'bk1', starRating: 4 }))
      .rejects.toThrow(ConflictException);
  });
});
