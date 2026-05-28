import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ServiceType } from '../companions/companion-profile.entity';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUpdateCompanionDto } from './dto/admin-update-companion.dto';
import { AdminUpdateBookingDto } from './dto/admin-update-booking.dto';
import { AdminCaptureDto } from './dto/admin-capture.dto';
import { AdminRefundDto } from './dto/admin-refund.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Stats ──────────────────────────────────────────────────────────────────

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('stats/daily-revenue')
  getDailyRevenue(
    @Query('days', new DefaultValuePipe(14), ParseIntPipe) days: number,
  ) {
    return this.adminService.getDailyRevenue(days);
  }

  @Get('stats/recent-bookings')
  getRecentBookings(
    @Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getRecentBookings(limit);
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  @Get('users')
  findAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.adminService.findAllUsers(page, limit);
  }

  @Get('users/:id')
  findUser(@Param('id') id: string) {
    return this.adminService.findUser(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  // ── Companions ────────────────────────────────────────────────────────────

  @Get('companions')
  findAllCompanions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.findAllCompanions(page, limit, status);
  }

  @Get('companions/:id')
  findCompanion(@Param('id') id: string) {
    return this.adminService.findCompanion(id);
  }

  @Patch('companions/:id')
  updateCompanion(@Param('id') id: string, @Body() dto: AdminUpdateCompanionDto) {
    return this.adminService.updateCompanion(id, dto);
  }

  @Post('companions/:id/services')
  setServices(
    @Param('id') id: string,
    @Body() body: { serviceTypes: ServiceType[] },
  ) {
    return this.adminService.setCompanionServices(id, body.serviceTypes);
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  @Get('bookings')
  findAllBookings(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.findAllBookings(page, limit, status);
  }

  @Get('bookings/:id')
  findBooking(@Param('id') id: string) {
    return this.adminService.findBooking(id);
  }

  @Patch('bookings/:id')
  updateBooking(@Param('id') id: string, @Body() dto: AdminUpdateBookingDto) {
    return this.adminService.updateBooking(id, dto);
  }

  @Post('bookings/:id/capture')
  capturePayment(@Param('id') id: string, @Body() dto: AdminCaptureDto) {
    return this.adminService.capturePayment(id, dto);
  }

  @Post('bookings/:id/refund')
  refundPayment(@Param('id') id: string, @Body() dto: AdminRefundDto) {
    return this.adminService.refundPayment(id, dto);
  }

  @Post('bookings/:id/cancel')
  cancelBooking(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.cancelBookingPayment(id, body.reason ?? 'Cancelled by admin');
  }
}
