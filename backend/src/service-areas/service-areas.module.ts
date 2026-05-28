import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceArea } from './service-area.entity';
import { ServiceAreasService } from './service-areas.service';
import { ServiceAreasController } from './service-areas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceArea])],
  providers: [ServiceAreasService],
  controllers: [ServiceAreasController],
  exports: [ServiceAreasService],
})
export class ServiceAreasModule {}
