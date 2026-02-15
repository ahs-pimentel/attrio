import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonAreaEntity } from './entities/common-area.entity';
import { ReservationEntity } from './entities/reservation.entity';
import { CommonAreasService } from './common-areas.service';
import { ReservationsService } from './reservations.service';
import { CommonAreasController } from './common-areas.controller';
import { ReservationsController } from './reservations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommonAreaEntity, ReservationEntity])],
  controllers: [CommonAreasController, ReservationsController],
  providers: [CommonAreasService, ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
