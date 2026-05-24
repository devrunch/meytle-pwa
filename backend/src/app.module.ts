import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { User } from './users/user.entity'
import { CompanionProfile } from './companions/companion-profile.entity'
import { CompanionService } from './companions/companion-service.entity'
import { CompanionAvailability } from './companions/companion-availability.entity'
import { IdentityVerification } from './companions/identity-verification.entity'
import { Booking } from './bookings/booking.entity'
import { TipPayment } from './bookings/tip-payment.entity'
import { Payout } from './bookings/payout.entity'
import { StripeWebhookEvent } from './bookings/stripe-webhook-event.entity'
import { SessionLocation } from './bookings/session-location.entity'
import { NoShowDispute } from './bookings/no-show-dispute.entity'
import { Message } from './messages/message.entity'
import { MessageRead } from './messages/message-read.entity'
import { Review } from './reviews/review.entity'
import { Notification } from './common/notification.entity'
import { PlatformConfig } from './common/platform-config.entity'

import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { CompanionsModule } from './companions/companions.module'
import { BookingsModule } from './bookings/bookings.module'
import { MessagesModule } from './messages/messages.module'
import { ReviewsModule } from './reviews/reviews.module'
import { NotificationsModule } from './common/notifications.module'

const entities = [
  User,
  CompanionProfile, CompanionService, CompanionAvailability, IdentityVerification,
  Booking, TipPayment, Payout, StripeWebhookEvent, SessionLocation, NoShowDispute,
  Message, MessageRead,
  Review,
  Notification,
  PlatformConfig,
]

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST', 'localhost'),
        port: cfg.get<number>('DB_PORT', 5432),
        username: cfg.get('DB_USERNAME', 'postgres'),
        password: cfg.get('DB_PASSWORD', ''),
        database: cfg.get('DB_NAME', 'meytle'),
        entities,
        synchronize: cfg.get('NODE_ENV') !== 'production',
      }),
    }),

    AuthModule,
    UsersModule,
    CompanionsModule,
    BookingsModule,
    MessagesModule,
    ReviewsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
