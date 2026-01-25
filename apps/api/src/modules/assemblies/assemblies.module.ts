import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AssemblyEntity,
  AssemblyParticipantEntity,
  AgendaItemEntity,
  VoteEntity,
  AssemblyMinutesEntity,
} from './entities';
import { UnitEntity } from '../units/unit.entity';
import { AssembliesService } from './assemblies.service';
import { AgendaItemsService } from './agenda-items.service';
import { ParticipantsService } from './participants.service';
import { VotesService } from './votes.service';
import { AttendanceService } from './attendance.service';
import { MinutesService } from './minutes.service';
import { AssembliesController } from './assemblies.controller';
import { AgendaItemsController } from './agenda-items.controller';
import { ParticipantsController } from './participants.controller';
import { VotesController } from './votes.controller';
import { AttendanceController } from './attendance.controller';
import { MinutesController } from './minutes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssemblyEntity,
      AssemblyParticipantEntity,
      AgendaItemEntity,
      VoteEntity,
      AssemblyMinutesEntity,
      UnitEntity,
    ]),
  ],
  controllers: [
    AssembliesController,
    AgendaItemsController,
    ParticipantsController,
    VotesController,
    AttendanceController,
    MinutesController,
  ],
  providers: [
    AssembliesService,
    AgendaItemsService,
    ParticipantsService,
    VotesService,
    AttendanceService,
    MinutesService,
  ],
  exports: [
    AssembliesService,
    AgendaItemsService,
    ParticipantsService,
    VotesService,
    AttendanceService,
    MinutesService,
  ],
})
export class AssembliesModule {}
