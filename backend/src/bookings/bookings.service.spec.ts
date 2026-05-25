import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus, CancelledByParty } from './booking.entity';
import { CompanionProfile } from '../companions/companion-profile.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
});

const mockDataSource = () => ({ transaction: jest.fn() });

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingRepo: ReturnType<typeof mockRepo>;
  let companionRepo: ReturnType<typeof mockRepo>;

  const companionProfile = { id: 'cp1', userId: 'cu1', hourlyRatePaisa: 100000 };
  const baseBooking = (overrides: Partial<Booking> = {}): Booking => ({
    id: 'b1',
    userId: 'u1',
    companionId: 'cp1',
    companion: { id: 'cp1', userId: 'cu1' } as CompanionProfile,
    status: BookingStatus.CONFIRMED,
    bookedStart: new Date(Date.now() - 5 * 60_000), // 5 min ago
    bookedEnd: new Date(Date.now() + 55 * 60_000),
    bookedDurationMinutes: 60,
    otpCode: '482913',
    ...overrides,
  } as Booking);

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useFactory: mockRepo },
        { provide: getRepositoryToken(CompanionProfile), useFactory: mockRepo },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get(BookingsService);
    bookingRepo = module.get(getRepositoryToken(Booking));
    companionRepo = module.get(getRepositoryToken(CompanionProfile));
  });

  describe('verifyOtp', () => {
    it('transitions to in_progress on correct OTP', async () => {
      companionRepo.findOne.mockResolvedValue(companionProfile);
      bookingRepo.findOne
        .mockResolvedValueOnce(baseBooking())
        .mockResolvedValueOnce({ ...baseBooking(), status: BookingStatus.IN_PROGRESS });
      bookingRepo.update.mockResolvedValue({});

      const result = await service.verifyOtp('b1', 'cu1', { otpCode: '482913' });
      expect(bookingRepo.update).toHaveBeenCalledWith('b1', expect.objectContaining({
        status: BookingStatus.IN_PROGRESS,
      }));
    });

    it('throws BadRequestException for wrong OTP', async () => {
      companionRepo.findOne.mockResolvedValue(companionProfile);
      bookingRepo.findOne.mockResolvedValue(baseBooking());

      await expect(service.verifyOtp('b1', 'cu1', { otpCode: '000000' }))
        .rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when booking is not confirmed', async () => {
      companionRepo.findOne.mockResolvedValue(companionProfile);
      bookingRepo.findOne.mockResolvedValue(baseBooking({ status: BookingStatus.IN_PROGRESS }));

      await expect(service.verifyOtp('b1', 'cu1', { otpCode: '482913' }))
        .rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when too early (>15 min before start)', async () => {
      companionRepo.findOne.mockResolvedValue(companionProfile);
      bookingRepo.findOne.mockResolvedValue(
        baseBooking({ bookedStart: new Date(Date.now() + 30 * 60_000) }), // 30 min in future
      );

      await expect(service.verifyOtp('b1', 'cu1', { otpCode: '482913' }))
        .rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when >30 min past start', async () => {
      companionRepo.findOne.mockResolvedValue(companionProfile);
      bookingRepo.findOne.mockResolvedValue(
        baseBooking({ bookedStart: new Date(Date.now() - 45 * 60_000) }), // 45 min ago
      );

      await expect(service.verifyOtp('b1', 'cu1', { otpCode: '482913' }))
        .rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException if companion does not own the booking', async () => {
      companionRepo.findOne.mockResolvedValue({ id: 'cp2', userId: 'cu2' });
      bookingRepo.findOne.mockResolvedValue(baseBooking()); // companionId is cp1

      await expect(service.verifyOtp('b1', 'cu2', { otpCode: '482913' }))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelByUser', () => {
    it('cancels a pending booking', async () => {
      bookingRepo.findOne
        .mockResolvedValueOnce(baseBooking({ status: BookingStatus.PENDING }))
        .mockResolvedValueOnce({ ...baseBooking(), status: BookingStatus.CANCELLED });
      bookingRepo.update.mockResolvedValue({});

      await service.cancelByUser('b1', 'u1', { reason: 'changed mind' });
      expect(bookingRepo.update).toHaveBeenCalledWith('b1', expect.objectContaining({
        status: BookingStatus.CANCELLED,
        cancelledBy: CancelledByParty.USER,
      }));
    });

    it('rejects cancellation of a confirmed booking', async () => {
      bookingRepo.findOne.mockResolvedValue(baseBooking({ status: BookingStatus.CONFIRMED }));
      await expect(service.cancelByUser('b1', 'u1', {}))
        .rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException if user does not own the booking', async () => {
      bookingRepo.findOne.mockResolvedValue(baseBooking({ userId: 'other' }));
      await expect(service.cancelByUser('b1', 'u1', {}))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('endSession', () => {
    it('completes an in_progress session', async () => {
      companionRepo.findOne.mockResolvedValue(companionProfile);
      bookingRepo.findOne
        .mockResolvedValueOnce(baseBooking({ status: BookingStatus.IN_PROGRESS }))
        .mockResolvedValueOnce({ ...baseBooking(), status: BookingStatus.COMPLETED });
      bookingRepo.update.mockResolvedValue({});

      await service.endSession('b1', 'cu1');
      expect(bookingRepo.update).toHaveBeenCalledWith('b1', expect.objectContaining({
        status: BookingStatus.COMPLETED,
      }));
    });

    it('throws BadRequestException if session is not in_progress', async () => {
      companionRepo.findOne.mockResolvedValue(companionProfile);
      bookingRepo.findOne.mockResolvedValue(baseBooking({ status: BookingStatus.CONFIRMED }));

      await expect(service.endSession('b1', 'cu1')).rejects.toThrow(BadRequestException);
    });
  });
});
