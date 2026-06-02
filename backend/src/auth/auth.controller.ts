import { Body, Controller, Post, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return user;
  }

  @Post('send-email-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  sendEmailOtp(@CurrentUser() user: User) {
    return this.authService.sendEmailOtp(user.id).then(() => ({ message: 'OTP sent' }));
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  verifyEmail(@CurrentUser() user: User, @Body() body: { otp: string }) {
    return this.authService.verifyEmail(user.id, body.otp);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email).then(() => ({ message: 'If that email exists, a reset link has been sent' }));
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password).then(() => ({ message: 'Password updated' }));
  }

  @Post('promote-admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  promoteAdmin(@CurrentUser() user: User, @Body() body: { secret: string }) {
    return this.authService.promoteToAdmin(user.id, body.secret);
  }
}
