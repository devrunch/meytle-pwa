import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CompanionProfile, CompanionStatus, ServiceType } from './companion-profile.entity';
import { CompanionService as CompanionServiceEntity } from './companion-service.entity';
import { CompanionAvailability } from './companion-availability.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateCompanionProfileDto } from './dto/create-companion-profile.dto';
import { UpdateCompanionProfileDto } from './dto/update-companion-profile.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { DiscoveryQueryDto } from './dto/discovery-query.dto';

@Injectable()
export class CompanionsService {
  constructor(
    @InjectRepository(CompanionProfile) private readonly profiles: Repository<CompanionProfile>,
    @InjectRepository(CompanionServiceEntity) private readonly services: Repository<CompanionServiceEntity>,
    @InjectRepository(CompanionAvailability) private readonly availability: Repository<CompanionAvailability>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async createProfile(userId: string, dto: CreateCompanionProfileDto): Promise<CompanionProfile> {
    const existing = await this.profiles.findOne({ where: { userId } });
    if (existing) throw new ConflictException('Companion profile already exists');

    const [lng, lat] = dto.serviceAreaCentre;

    const dobSource = dto.dateOfBirth
      ? dto.dateOfBirth
      : await this.users.findOne({ where: { id: userId }, select: ['dateOfBirth'] })
          .then(u => u?.dateOfBirth?.toISOString().split('T')[0] ?? null);

    const profile = await this.dataSource.transaction(async (em) => {
      const p = em.create(CompanionProfile, {
        userId,
        displayName: dto.displayName,
        bio: dto.bio,
        dateOfBirth: dobSource ? new Date(dobSource) : undefined,
        profilePhotoUrl: dto.profilePhotoUrl,
        hourlyRatePaisa: dto.hourlyRatePaisa,
        serviceAreaCentre: `SRID=4326;POINT(${lng} ${lat})`,
        serviceAreaRadiusKm: dto.serviceAreaRadiusKm,
      });
      await em.save(p);

      const svcEntities = dto.services.map((type) =>
        em.create(CompanionServiceEntity, { companionId: p.id, serviceType: type }),
      );
      await em.save(svcEntities);

      // Add companion role to user
      await em.getRepository(User).createQueryBuilder()
        .update()
        .set({ roles: () => `array_append(roles, '${UserRole.COMPANION}')` })
        .where('id = :id AND NOT (roles @> ARRAY[:role::user_role])', { id: userId, role: UserRole.COMPANION })
        .execute();

      return p;
    });

    return profile;
  }

  async getProfile(companionId: string): Promise<CompanionProfile> {
    const profile = await this.profiles.findOne({
      where: { id: companionId },
      relations: { user: true },
    });
    if (!profile) throw new NotFoundException('Companion not found');
    return profile;
  }

  async getMyProfile(userId: string): Promise<CompanionProfile> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('No companion profile found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateCompanionProfileDto): Promise<CompanionProfile> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('No companion profile found');

    const updates: Partial<CompanionProfile> = {};
    if (dto.displayName !== undefined) updates.displayName = dto.displayName;
    if (dto.bio !== undefined) updates.bio = dto.bio;
    if (dto.profilePhotoUrl !== undefined) updates.profilePhotoUrl = dto.profilePhotoUrl;
    if (dto.hourlyRatePaisa !== undefined) updates.hourlyRatePaisa = dto.hourlyRatePaisa;
    if (dto.isAvailableNow !== undefined) updates.isAvailableNow = dto.isAvailableNow;
    if (dto.serviceAreaRadiusKm !== undefined) updates.serviceAreaRadiusKm = dto.serviceAreaRadiusKm;
    if (dto.serviceAreaCentre !== undefined) {
      const [lng, lat] = dto.serviceAreaCentre;
      updates.serviceAreaCentre = `SRID=4326;POINT(${lng} ${lat})`;
    }

    await this.dataSource.transaction(async (em) => {
      await em.update(CompanionProfile, profile.id, updates);

      if (dto.services !== undefined) {
        await em.delete(CompanionServiceEntity, { companionId: profile.id });
        const svcEntities = dto.services.map((type) =>
          em.create(CompanionServiceEntity, { companionId: profile.id, serviceType: type }),
        );
        await em.save(svcEntities);
      }
    });

    return this.getMyProfile(userId);
  }

  async setAvailability(userId: string, dto: SetAvailabilityDto): Promise<CompanionAvailability[]> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('No companion profile found');

    await this.dataSource.transaction(async (em) => {
      await em.delete(CompanionAvailability, { companionId: profile.id });
      const slots = dto.slots.map((s) =>
        em.create(CompanionAvailability, {
          companionId: profile.id,
          dayOfWeek: s.dayOfWeek,
          fromTime: s.fromTime,
          toTime: s.toTime,
        }),
      );
      await em.save(slots);
    });

    return this.availability.find({ where: { companionId: profile.id } });
  }

  async discover(query: DiscoveryQueryDto): Promise<{ data: CompanionProfile[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, query.limit ?? 20);
    const offset = (page - 1) * limit;

    let qb = this.profiles
      .createQueryBuilder('cp')
      .leftJoinAndSelect('cp.user', 'u')
      .where('cp.profile_status = :status', { status: CompanionStatus.ACTIVE })
      .orderBy('cp.is_available_now', 'DESC')
      .addOrderBy('cp.rating_avg', 'DESC', 'NULLS LAST')
      .take(limit)
      .skip(offset);

    if (query.service) {
      qb = qb
        .innerJoin(
          'companion_services',
          'cs',
          'cs.companion_id = cp.id AND cs.service_type = :svc',
          { svc: query.service },
        );
    }

    if (query.lat !== undefined && query.lng !== undefined && query.radiusKm !== undefined) {
      qb = qb.andWhere(
        `ST_DWithin(cp.service_area_centre::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)`,
        { lat: query.lat, lng: query.lng, radius: query.radiusKm * 1000 },
      );
    }

    if (query.availableNow) {
      qb = qb.andWhere('cp.is_available_now = true');
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getServices(companionId: string): Promise<CompanionServiceEntity[]> {
    return this.services.find({ where: { companionId } });
  }

  async getAvailability(companionId: string): Promise<CompanionAvailability[]> {
    return this.availability.find({ where: { companionId } });
  }
}
