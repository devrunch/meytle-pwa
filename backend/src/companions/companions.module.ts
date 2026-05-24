import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanionProfile } from './companion-profile.entity';
import { CompanionService } from './companion-service.entity';
import { CompanionAvailability } from './companion-availability.entity';
import { IdentityVerification } from './identity-verification.entity';
import { User } from '../users/user.entity';
import { CompanionsController } from './companions.controller';
import { CompanionsService } from './companions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanionProfile,
      CompanionService,
      CompanionAvailability,
      IdentityVerification,
      User,
    ]),
  ],
  controllers: [CompanionsController],
  providers: [CompanionsService],
  exports: [CompanionsService],
})
export class CompanionsModule {}
