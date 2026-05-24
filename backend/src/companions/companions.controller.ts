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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { CreateCompanionProfileDto } from './dto/create-companion-profile.dto';
import { UpdateCompanionProfileDto } from './dto/update-companion-profile.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { DiscoveryQueryDto } from './dto/discovery-query.dto';

@Controller('companions')
export class CompanionsController {
  constructor(private readonly companionsService: CompanionsService) {}

  // Public — discovery feed
  @Get()
  discover(@Query() query: DiscoveryQueryDto) {
    return this.companionsService.discover(query);
  }

  // Public — companion profile page
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

  // Protected — companion managing their own profile
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
}
