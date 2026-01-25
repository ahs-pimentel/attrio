import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { UserLoaderGuard } from './guards/user-loader.guard';
import { TenantGuard } from './guards/tenant.guard';
import { UsersModule } from '../users';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, UserLoaderGuard, TenantGuard],
  exports: [JwtStrategy, UserLoaderGuard, TenantGuard],
})
export class AuthModule {}
