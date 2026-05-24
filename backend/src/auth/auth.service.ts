import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

const MIN_AGE_YEARS = 18;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
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

  private assertMinAge(dob: string) {
    const birth = new Date(dob);
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - MIN_AGE_YEARS);
    if (birth > cutoff) {
      throw new BadRequestException(`Must be at least ${MIN_AGE_YEARS} years old`);
    }
  }
}
