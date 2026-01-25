import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ResidentEntity,
  ResidentContactEntity,
  HouseholdMemberEntity,
  UnitEmployeeEntity,
  VehicleEntity,
  PetEntity,
  ResidentInviteEntity,
} from './entities';
import { ResidentsService } from './residents.service';
import { InvitesService } from './invites.service';
import { ResidentsController } from './residents.controller';
import { InvitesController } from './invites.controller';
import { UsersModule } from '../users';
import { UnitsModule } from '../units';
import { TenantsModule } from '../tenants';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResidentEntity,
      ResidentContactEntity,
      HouseholdMemberEntity,
      UnitEmployeeEntity,
      VehicleEntity,
      PetEntity,
      ResidentInviteEntity,
    ]),
    UsersModule,
    UnitsModule,
    TenantsModule,
  ],
  controllers: [ResidentsController, InvitesController],
  providers: [ResidentsService, InvitesService],
  exports: [ResidentsService, InvitesService],
})
export class ResidentsModule {}
