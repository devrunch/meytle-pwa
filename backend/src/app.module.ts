import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

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
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // true only in dev — use migrations in prod
        synchronize: cfg.get('NODE_ENV') !== 'production',
      }),
    }),

    // modules go here after specs are written
  ],
})
export class AppModule {}
