import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CompanionsService } from './companions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';
import { CreateCompanionProfileDto } from './dto/create-companion-profile.dto';
import { UpdateCompanionProfileDto } from './dto/update-companion-profile.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { DiscoveryQueryDto } from './dto/discovery-query.dto';
import { IsEnum } from 'class-validator';
import { CompanionStatus } from './companion-profile.entity';

class UpdateStatusDto {
  @IsEnum(CompanionStatus)
  status: CompanionStatus;
}

@Controller('companions')
export class CompanionsController {
  constructor(private readonly companionsService: CompanionsService) {}

  // Public — discovery feed
  @Get()
  discover(@Query() query: DiscoveryQueryDto) {
    return this.companionsService.discover(query);
  }

  // Protected — companion managing their own profile
  // IMPORTANT: all me/... routes must come before :id/... routes
  @Post('me')
  @UseGuards(JwtAuthGuard)
  createProfile(@CurrentUser() user: User, @Body() dto: CreateCompanionProfileDto) {
    return this.companionsService.createProfile(user.id, dto);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser() user: User) {
    return this.companionsService.getMyProfile(user.id);
  }

  @Get('me/availability')
  @UseGuards(JwtAuthGuard)
  getMyAvailability(@CurrentUser() user: User) {
    return this.companionsService.getMyAvailability(user.id);
  }

  @Post('me/stripe-onboard')
  @UseGuards(JwtAuthGuard)
  stripeOnboard(@CurrentUser() user: User, @Body() body: { returnPath?: string }) {
    return this.companionsService.createStripeOnboardingLink(user.id, body?.returnPath);
  }

  @Post('me/stripe-session')
  @UseGuards(JwtAuthGuard)
  stripeSession(@CurrentUser() user: User) {
    return this.companionsService.createStripeAccountSession(user.id);
  }

  @Get('me/stripe-status')
  @UseGuards(JwtAuthGuard)
  stripeStatus(@CurrentUser() user: User) {
    return this.companionsService.syncStripePayoutStatus(user.id);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateCompanionProfileDto) {
    return this.companionsService.updateProfile(user.id, dto);
  }

  @Put('me/availability')
  @UseGuards(JwtAuthGuard)
  setAvailability(@CurrentUser() user: User, @Body() dto: SetAvailabilityDto) {
    return this.companionsService.setAvailability(user.id, dto);
  }

  // Public — companion profile page (parameterized routes last)
  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.companionsService.getProfile(id);
  }

  @Get(':id/services')
  getServices(@Param('id') id: string) {
    return this.companionsService.getServices(id);
  }

  @Get(':id/availability')
  getAvailability(@Param('id') id: string) {
    return this.companionsService.getAvailability(id);
  }

  // Admin — approve / reject / deactivate a companion profile
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.companionsService.updateStatus(id, dto.status);
  }
}
