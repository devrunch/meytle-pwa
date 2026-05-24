import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('bookings/:bookingId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  getThread(
    @CurrentUser() user: User,
    @Param('bookingId') bookingId: string,
  ) {
    return this.messagesService.getThread(bookingId, user.id);
  }
}
