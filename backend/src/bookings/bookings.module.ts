import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Booking } from './booking.entity';
import { TipPayment } from './tip-payment.entity';
import { Payout } from './payout.entity';
import { StripeWebhookEvent } from './stripe-webhook-event.entity';
import { SessionLocation } from './session-location.entity';
import { NoShowDispute } from './no-show-dispute.entity';
import { CompanionProfile } from '../companions/companion-profile.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { MailModule } from '../mail/mail.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      TipPayment,
      Payout,
      StripeWebhookEvent,
      SessionLocation,
      NoShowDispute,
      CompanionProfile,
    ]),
    ScheduleModule.forRoot(),
    MailModule,
    PushModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
