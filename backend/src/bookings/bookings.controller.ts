import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PreparePaymentDto } from './dto/prepare-payment.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('prepare-payment')
  preparePayment(@CurrentUser() user: User, @Body() dto: PreparePaymentDto) {
    return this.bookingsService.preparePayment(user.id, dto);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get()
  findMine(@CurrentUser() user: User) {
    return this.bookingsService.findForUser(user.id);
  }

  @Get('companion')
  findAsCompanion(@CurrentUser() user: User) {
    return this.bookingsService.findForCompanion(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bookingsService.findById(id, user.id);
  }

  @Patch(':id/accept')
  accept(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bookingsService.acceptByCompanion(id, user.id);
  }

  @Patch(':id/decline')
  decline(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bookingsService.declineByCompanion(id, user.id);
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelByUser(id, user.id, dto);
  }

  @Get(':id/otp')
  getOtp(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bookingsService.getOtpForUser(id, user.id);
  }

  @Post(':id/verify-otp')
  verifyOtp(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: VerifyOtpDto,
  ) {
    return this.bookingsService.verifyOtp(id, user.id, dto);
  }

  @Patch(':id/end-session')
  endSession(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bookingsService.endSession(id, user.id);
  }
}
