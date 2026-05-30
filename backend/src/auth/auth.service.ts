import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';

const MIN_AGE_YEARS = 18;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    this.assertMinAge(dto.dateOfBirth);

    const exists = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.users.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      roles: [UserRole.USER],
    });
    await this.users.save(user);

    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueToken(user);
  }

  private issueToken(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    return {
      accessToken: this.jwt.sign(payload),
      user: this.sanitise(user),
    };
  }

  private sanitise(user: User) {
    const { passwordHash: _, ...safe } = user as User & { passwordHash: string };
    return safe;
  }

  async promoteToAdmin(userId: string, secret: string) {
    const expected = this.config.get<string>('ADMIN_SECRET');
    if (!expected || secret !== expected) throw new ForbiddenException('Invalid admin secret');

    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    if (!user.roles.includes(UserRole.ADMIN)) {
      user.roles = [...user.roles, UserRole.ADMIN];
      await this.users.save(user);
    }
    return this.issueToken(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findOne({ where: { email: email.toLowerCase() } });
    if (!user) return; // silently succeed — don't reveal whether email exists

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = token;
    user.passwordResetExpiresAt = expiresAt;
    await this.users.save(user);

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:5173');
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    await this.mail.send(user.email, 'Reset your Meytle password', this.mail.passwordReset(resetUrl));
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.users.findOne({ where: { passwordResetToken: token } });

    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or has expired');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await this.users.save(user);
  }

  private assertMinAge(dob: string) {
    const birth = new Date(dob);
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - MIN_AGE_YEARS);
    if (birth > cutoff) {
      throw new BadRequestException(`Must be at least ${MIN_AGE_YEARS} years old`);
    }
  }
}
