import { Body, Controller, Delete, Get, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { PushService } from './push.service';
import { ConfigService } from '@nestjs/config';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(
    private readonly push: PushService,
    private readonly config: ConfigService,
  ) {}

  @Get('vapid-public-key')
  getVapidKey() {
    return { publicKey: this.config.get<string>('VAPID_PUBLIC_KEY', '') };
  }

  @Post('push-subscribe')
  @HttpCode(HttpStatus.OK)
  subscribe(
    @CurrentUser() user: User,
    @Body() body: { endpoint: string; p256dh: string; auth: string },
  ) {
    return this.push.subscribe(user.id, body.endpoint, body.p256dh, body.auth)
      .then(() => ({ message: 'Subscribed' }));
  }

  @Delete('push-subscribe')
  @HttpCode(HttpStatus.OK)
  unsubscribe(@CurrentUser() user: User, @Body() body: { endpoint: string }) {
    return this.push.unsubscribe(user.id, body.endpoint)
      .then(() => ({ message: 'Unsubscribed' }));
  }
}
