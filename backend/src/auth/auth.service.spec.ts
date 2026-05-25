import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/user.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockJwt = () => ({ sign: jest.fn().mockReturnValue('token') });

describe('AuthService', () => {
  let service: AuthService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: JwtService, useFactory: mockJwt },
      ],
    }).compile();

    service = module.get(AuthService);
    repo = module.get(getRepositoryToken(User));
  });

  const adultDob = '1995-01-01';
  const minorDob = new Date(Date.now() - 17 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  describe('register', () => {
    it('throws BadRequestException for users under 18', async () => {
      await expect(
        service.register({ email: 'a@b.com', password: 'pass1234', fullName: 'Test', dateOfBirth: minorDob }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException for duplicate email', async () => {
      repo.findOne.mockResolvedValue({ id: '1', email: 'a@b.com' });
      await expect(
        service.register({ email: 'a@b.com', password: 'pass1234', fullName: 'Test', dateOfBirth: adultDob }),
      ).rejects.toThrow(ConflictException);
    });

    it('returns accessToken and user on success', async () => {
      repo.findOne.mockResolvedValue(null);
      const user = { id: '1', email: 'a@b.com', fullName: 'Test', roles: [UserRole.USER], passwordHash: 'hashed' };
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);

      const result = await service.register({
        email: 'a@b.com', password: 'pass1234', fullName: 'Test', dateOfBirth: adultDob,
      });

      expect(result.accessToken).toBe('token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('hashes the password before saving', async () => {
      repo.findOne.mockResolvedValue(null);
      const user = { id: '1', email: 'a@b.com', fullName: 'Test', roles: [UserRole.USER], passwordHash: '' };
      repo.create.mockImplementation((data: Partial<User>) => ({ ...user, ...data }));
      repo.save.mockImplementation(async (u: User) => u);

      await service.register({ email: 'a@b.com', password: 'pass1234', fullName: 'Test', dateOfBirth: adultDob });

      const saved = repo.save.mock.calls[0][0] as User;
      const match = await bcrypt.compare('pass1234', saved.passwordHash);
      expect(match).toBe(true);
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for unknown email', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: 'pass' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correct', 10);
      repo.findOne.mockResolvedValue({ id: '1', email: 'a@b.com', passwordHash: hash, roles: [UserRole.USER] });
      await expect(service.login({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });

    it('returns token on valid credentials', async () => {
      const hash = await bcrypt.hash('pass1234', 10);
      const user = { id: '1', email: 'a@b.com', passwordHash: hash, roles: [UserRole.USER] };
      repo.findOne.mockResolvedValue(user);

      const result = await service.login({ email: 'a@b.com', password: 'pass1234' });
      expect(result.accessToken).toBe('token');
    });
  });
});
