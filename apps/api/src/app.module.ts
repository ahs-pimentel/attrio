import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from './modules/tenants/tenant.entity';
import { HealthModule } from './modules/health/health.module';
import {
  AuthModule,
  JwtAuthGuard,
  UserLoaderGuard,
  RolesGuard,
  TenantGuard,
} from './modules/auth';
import { UsersModule } from './modules/users';
import { TenantsModule } from './modules/tenants';
import { UnitsModule } from './modules/units';
import { ResidentsModule } from './modules/residents';
import { AssembliesModule } from './modules/assemblies';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { IssuesModule } from './modules/issues/issues.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { SeedModule } from './modules/seed';
import { getDatabaseConfig } from './core/db/database.config';
import { EmailModule } from './core/email/email.module';

@Module({
  imports: [
    // Configuracao de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Configuracao do TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    // Repositorio global para UserLoaderGuard (guards globais)
    TypeOrmModule.forFeature([TenantEntity]),

    // Core
    EmailModule,

    // Modulos da aplicacao
    AuthModule,
    UsersModule,
    TenantsModule,
    UnitsModule,
    ResidentsModule,
    AssembliesModule,
    AnnouncementsModule,
    IssuesModule,
    ReservationsModule,
    HealthModule,
    SeedModule,
  ],
  providers: [
    // Guards globais executam na ordem de declaracao:
    // 1. JwtAuthGuard - Valida token JWT (rotas @Public() ignoram)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 2. UserLoaderGuard - Carrega dados do usuario do banco
    {
      provide: APP_GUARD,
      useClass: UserLoaderGuard,
    },
    // 3. RolesGuard - Verifica roles (rotas sem @Roles() permitem qualquer autenticado)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // 4. TenantGuard - Verifica contexto de tenant (rotas @RequireTenant())
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule {}
