import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { CompanionProfile } from '../companions/companion-profile.entity';
import { CompanionService } from '../companions/companion-service.entity';
import { Booking } from '../bookings/booking.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, CompanionProfile, CompanionService, Booking])],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
