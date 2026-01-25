import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { UserLoaderGuard } from './guards/user-loader.guard';
import { TenantGuard } from './guards/tenant.guard';
import { UsersModule } from '../users';
import { TenantEntity } from '../tenants/tenant.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([TenantEntity]),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, UserLoaderGuard, TenantGuard],
  exports: [JwtStrategy, UserLoaderGuard, TenantGuard],
})
export class AuthModule {}
