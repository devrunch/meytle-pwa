import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Message } from './message.entity';
import { MessageRead } from './message-read.entity';
import { Booking, BookingStatus } from '../bookings/booking.entity';
import { CompanionProfile } from '../companions/companion-profile.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  upsert: jest.fn(),
});

describe('MessagesService', () => {
  let service: MessagesService;
  let bookingRepo: ReturnType<typeof mockRepo>;
  let messageRepo: ReturnType<typeof mockRepo>;

  const confirmedBooking = (overrides = {}): Partial<Booking> => ({
    id: 'bk1',
    userId: 'u1',
    companion: { id: 'cp1', userId: 'cu1' } as CompanionProfile,
    status: BookingStatus.CONFIRMED,
    // chat opens 3h before start — set start 1h from now (within window)
    bookedStart: new Date(Date.now() + 1 * 60 * 60_000),
    bookedEnd: new Date(Date.now() + 2 * 60 * 60_000),
    ...overrides,
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getRepositoryToken(Message), useFactory: mockRepo },
        { provide: getRepositoryToken(MessageRead), useFactory: mockRepo },
        { provide: getRepositoryToken(Booking), useFactory: mockRepo },
        { provide: getRepositoryToken(CompanionProfile), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(MessagesService);
    bookingRepo = module.get(getRepositoryToken(Booking));
    messageRepo = module.get(getRepositoryToken(Message));
  });

  describe('send — phone number blocking', () => {
    it('saves message normally for clean content', async () => {
      bookingRepo.findOne.mockResolvedValue(confirmedBooking());
      const msg = { id: '1', bookingId: 'bk1', senderId: 'u1', content: 'See you there!', isBlocked: false };
      messageRepo.create.mockReturnValue(msg);
      messageRepo.save.mockResolvedValue(msg);

      await service.send('bk1', 'u1', 'See you there!');
      expect(messageRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isBlocked: false }));
    });

    it('sets isBlocked=true for 10-digit phone number', async () => {
      bookingRepo.findOne.mockResolvedValue(confirmedBooking());
      const msg = { id: '1', bookingId: 'bk1', senderId: 'u1', content: 'Call me 9876543210', isBlocked: true };
      messageRepo.create.mockReturnValue(msg);
      messageRepo.save.mockResolvedValue(msg);

      await service.send('bk1', 'u1', 'Call me 9876543210');
      expect(messageRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isBlocked: true }));
    });

    it('blocks +91 formatted numbers', async () => {
      bookingRepo.findOne.mockResolvedValue(confirmedBooking());
      const msg = { id: '1', isBlocked: true };
      messageRepo.create.mockReturnValue(msg);
      messageRepo.save.mockResolvedValue(msg);

      await service.send('bk1', 'u1', 'My number is +91 98765 43210');
      expect(messageRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isBlocked: true }));
    });
  });

  describe('send — access window', () => {
    it('throws BadRequestException before the 3h window opens', async () => {
      bookingRepo.findOne.mockResolvedValue(confirmedBooking({
        bookedStart: new Date(Date.now() + 5 * 60 * 60_000), // 5h away — window not open
        bookedEnd: new Date(Date.now() + 6 * 60 * 60_000),
      }));
      await expect(service.send('bk1', 'u1', 'Hi')).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException after the 24h post-end window', async () => {
      bookingRepo.findOne.mockResolvedValue(confirmedBooking({
        bookedStart: new Date(Date.now() - 30 * 60 * 60_000),
        bookedEnd: new Date(Date.now() - 26 * 60 * 60_000), // ended 26h ago
      }));
      await expect(service.send('bk1', 'u1', 'Hi')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for cancelled bookings', async () => {
      bookingRepo.findOne.mockResolvedValue(confirmedBooking({ status: BookingStatus.CANCELLED }));
      await expect(service.send('bk1', 'u1', 'Hi')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for non-participants', async () => {
      bookingRepo.findOne.mockResolvedValue(confirmedBooking());
      await expect(service.send('bk1', 'stranger', 'Hi')).rejects.toThrow(ForbiddenException);
    });
  });
});
