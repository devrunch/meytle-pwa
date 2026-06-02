import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, DataSource } from 'typeorm';
import Stripe = require('stripe');
import { CompanionProfile, CompanionStatus } from './companion-profile.entity';
import { CompanionService as CompanionServiceEntity } from './companion-service.entity';
import { CompanionAvailability } from './companion-availability.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateCompanionProfileDto } from './dto/create-companion-profile.dto';
import { UpdateCompanionProfileDto } from './dto/update-companion-profile.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { DiscoveryQueryDto } from './dto/discovery-query.dto';

@Injectable()
export class CompanionsService {
  private readonly logger = new Logger(CompanionsService.name);
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(
    @InjectRepository(CompanionProfile) private readonly profiles: Repository<CompanionProfile>,
    @InjectRepository(CompanionServiceEntity) private readonly services: Repository<CompanionServiceEntity>,
    @InjectRepository(CompanionAvailability) private readonly availability: Repository<CompanionAvailability>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    const keyValid =
      !!key &&
      (key.startsWith('sk_test_') || key.startsWith('sk_live_')) &&
      key.length > 20;
    if (keyValid) {
      this.stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
      this.logger.log(
        `Stripe initialised — key ${key.slice(0, 12)}...${key.slice(-4)}`,
      );
    } else {
      this.logger.warn(
        `Stripe NOT initialised — STRIPE_SECRET_KEY missing or placeholder. Value: "${key ?? 'undefined'}"`,
      );
    }
  }

  async createProfile(userId: string, dto: CreateCompanionProfileDto): Promise<CompanionProfile> {
    const existing = await this.profiles.findOne({ where: { userId } });
    if (existing) throw new ConflictException('Companion profile already exists');

    const [lng, lat] = dto.serviceAreaCentre;

    const profile = await this.dataSource.transaction(async (em) => {
      const p = em.create(CompanionProfile, {
        userId,
        displayName: dto.displayName,
        bio: dto.bio,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        profilePhotoUrl: dto.profilePhotoUrl ?? null,
        hourlyRatePaisa: dto.hourlyRatePaisa,
        serviceAreaRadiusKm: dto.serviceAreaRadiusKm ?? 50,
      });
      await em.save(p);

      // Update geography column via raw SQL to bypass TypeORM's ST_GeomFromGeoJSON wrapping
      await em.query(
        `UPDATE companion_profiles SET service_area_centre = ST_GeomFromEWKT($1) WHERE id = $2`,
        [`SRID=4326;POINT(${lng} ${lat})`, p.id],
      );

      const svcEntities = dto.services.map((type) =>
        em.create(CompanionServiceEntity, { companionId: p.id, serviceType: type }),
      );
      await em.save(svcEntities);

      // Add companion role to user
      await em.query(
        `UPDATE users SET roles = array_append(roles, $1::users_roles_enum) WHERE id = $2 AND NOT (roles::text[] @> ARRAY[$1]::text[])`,
        [UserRole.COMPANION, userId],
      );

      return p;
    });

    return profile;
  }

  private async attachEwkt(profile: CompanionProfile): Promise<CompanionProfile> {
    const [row] = await this.dataSource.query(
      `SELECT ST_AsEWKT(service_area_centre::geometry) AS ewkt FROM companion_profiles WHERE id = $1`,
      [profile.id],
    );
    profile.serviceAreaCentre = row?.ewkt ?? null;
    return profile;
  }

  async getProfile(companionId: string): Promise<CompanionProfile> {
    const profile = await this.profiles.findOne({
      where: { id: companionId },
      relations: { user: true },
    });
    if (!profile) throw new NotFoundException('Companion not found');
    return this.attachEwkt(profile);
  }

  async getMyProfile(userId: string): Promise<CompanionProfile> {
    const profile = await this.profiles.findOne({ where: { userId }, relations: { services: true } });
    if (!profile) throw new NotFoundException('No companion profile found');
    return this.attachEwkt(profile);
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
      .where('cp.profile_status IN (:...statuses)', { statuses: [CompanionStatus.ACTIVE, CompanionStatus.PENDING_VERIFICATION] })
      .orderBy('cp.is_available_now', 'DESC')
      .addOrderBy('cp.rating_avg', 'DESC', 'NULLS LAST')
      .take(limit)
      .skip(offset);

    if (query.service) {
      qb = qb.innerJoin(
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

  async updateStatus(companionId: string, status: CompanionStatus): Promise<CompanionProfile> {
    const profile = await this.profiles.findOne({ where: { id: companionId } });
    if (!profile) throw new NotFoundException('Companion not found');
    await this.profiles.update(companionId, { profileStatus: status });
    return { ...profile, profileStatus: status };
  }

  async getServices(companionId: string): Promise<CompanionServiceEntity[]> {
    return this.services.find({ where: { companionId } });
  }

  async getAvailability(companionId: string): Promise<CompanionAvailability[]> {
    return this.availability.find({ where: { companionId } });
  }

  async getMyAvailability(userId: string): Promise<CompanionAvailability[]> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('No companion profile found');
    return this.availability.find({ where: { companionId: profile.id } });
  }

  async createStripeOnboardingLink(userId: string, returnPath?: string): Promise<{ url: string }> {
    if (!this.stripe) throw new InternalServerErrorException('Stripe is not configured — set STRIPE_SECRET_KEY in your .env');

    const [profile, user] = await Promise.all([
      this.profiles.findOne({ where: { userId } }),
      this.users.findOne({ where: { id: userId } }),
    ]);
    if (!profile) throw new NotFoundException('No companion profile found');

    let accountId = profile.stripeConnectedAccountId;

    try {
      if (!accountId) {
        const nameParts = (user?.fullName ?? profile.displayName).trim().split(/\s+/);
        const firstName = nameParts[0] ?? '';
        const lastName  = nameParts.slice(1).join(' ') || firstName;

        const appUrlForProfile = this.config.get<string>('APP_URL', 'http://localhost:5173');
        const isLocalhost = appUrlForProfile.includes('localhost') || appUrlForProfile.includes('127.0.0.1');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createParams: any = {
          type: 'express',
          email: user?.email,
          business_type: 'individual',
          individual: {
            first_name: firstName,
            last_name: lastName,
            email: user?.email,
            relationship: {
              title: 'Independent Companion',
              owner: true,
            },
          },
          business_profile: {
            url: isLocalhost
              ? 'https://meytle.app'
              : `${appUrlForProfile}/companion/${profile.id}`,
            name: profile.displayName,
            mcc: '7299',
            product_description:
              'Personal companion and social experience services booked through the Meytle platform. Companions are paid per session for time spent with clients.',
          },
          capabilities: { transfers: { requested: true } },
          metadata: { userId, companionId: profile.id },
        };

        if (profile.dateOfBirth) {
          const dob = new Date(profile.dateOfBirth);
          createParams.individual.dob = {
            day:   dob.getUTCDate(),
            month: dob.getUTCMonth() + 1,
            year:  dob.getUTCFullYear(),
          };
        }

        const account = await this.stripe.accounts.create(createParams);
        accountId = account.id;
        await this.profiles.update(profile.id, { stripeConnectedAccountId: accountId });
      }

      const appUrl = this.config.get<string>('APP_URL', 'http://localhost:5173');
      const base = returnPath ?? '/companion/dashboard';
      const link = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${appUrl}${base}?stripe=refresh`,
        return_url:  `${appUrl}${base}?stripe=success`,
        type: 'account_onboarding',
      });

      return { url: link.url };
    } catch (err: unknown) {
      const stripeMsg = (err as { raw?: { message?: string } })?.raw?.message;
      throw new InternalServerErrorException(
        stripeMsg ?? 'Stripe error — check your STRIPE_SECRET_KEY in .env',
      );
    }
  }

  async createStripeAccountSession(userId: string): Promise<{ clientSecret: string }> {
    if (!this.stripe) throw new InternalServerErrorException('Stripe is not configured — set STRIPE_SECRET_KEY in your .env');

    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('No companion profile found');
    if (!profile.stripeConnectedAccountId) throw new NotFoundException('No Stripe account — call stripe-onboard first');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = await (this.stripe as any).accountSessions.create({
        account: profile.stripeConnectedAccountId,
        components: {
          account_onboarding: { enabled: true },
        },
      });
      return { clientSecret: session.client_secret as string };
    } catch (err: unknown) {
      const stripeMsg = (err as { raw?: { message?: string } })?.raw?.message;
      throw new InternalServerErrorException(stripeMsg ?? 'Failed to create Stripe account session');
    }
  }

  async syncStripePayoutStatus(userId: string): Promise<{
    payoutsEnabled: boolean;
    identityVerified: boolean;
    requirements: { currentlyDue: string[]; pastDue: string[]; eventuallyDue: string[] };
  }> {
    if (!this.stripe) return { payoutsEnabled: false, identityVerified: false, requirements: { currentlyDue: [], pastDue: [], eventuallyDue: [] } };

    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile?.stripeConnectedAccountId) return { payoutsEnabled: false, identityVerified: false, requirements: { currentlyDue: [], pastDue: [], eventuallyDue: [] } };

    try {
      const account = await this.stripe.accounts.retrieve(profile.stripeConnectedAccountId);
      const payoutsEnabled = account.payouts_enabled ?? false;
      // Stripe won't enable payouts without identity verification, so treat payouts_enabled
      // as the authoritative signal — individual.verification.status lags or stays 'pending'
      // for Express accounts even after full onboarding completes.
      const identityVerified =
        account.individual?.verification?.status === 'verified' ||
        (payoutsEnabled && (account.charges_enabled ?? false));
      const reqs = account.requirements;

      const updates: Partial<CompanionProfile> = {};
      if (payoutsEnabled !== profile.stripePayoutsEnabled) updates.stripePayoutsEnabled = payoutsEnabled;
      if (identityVerified !== profile.identityVerifiedByStripe) updates.identityVerifiedByStripe = identityVerified;
      // Auto-activate profile once Stripe confirms identity + payouts
      if (payoutsEnabled && identityVerified && profile.profileStatus === CompanionStatus.PENDING_VERIFICATION) {
        updates.profileStatus = CompanionStatus.ACTIVE;
      }
      if (Object.keys(updates).length) await this.profiles.update(profile.id, updates);

      return {
        payoutsEnabled,
        identityVerified,
        requirements: {
          currentlyDue:  reqs?.currently_due  ?? [],
          pastDue:       reqs?.past_due       ?? [],
          eventuallyDue: reqs?.eventually_due ?? [],
        },
      };
    } catch {
      return { payoutsEnabled: false, identityVerified: false, requirements: { currentlyDue: [], pastDue: [], eventuallyDue: [] } };
    }
  }

  async createStripeLoginLink(userId: string): Promise<{ url: string }> {
    if (!this.stripe) throw new InternalServerErrorException('Stripe is not configured');

    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile?.stripeConnectedAccountId) throw new NotFoundException('No Stripe account found');

    try {
      const link = await this.stripe.accounts.createLoginLink(profile.stripeConnectedAccountId);
      return { url: link.url };
    } catch (err: unknown) {
      const stripeMsg = (err as { raw?: { message?: string } })?.raw?.message;
      throw new InternalServerErrorException(stripeMsg ?? 'Failed to create Stripe login link');
    }
  }
}
