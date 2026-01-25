import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

/**
 * Guard que carrega os dados completos do usuario do banco de dados
 * apos a autenticacao JWT. Deve rodar apos o JwtAuthGuard.
 */
@Injectable()
export class UserLoaderGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authUser = request.user as AuthenticatedUser | undefined;

    if (!authUser?.id) {
      return true; // Deixa o JwtAuthGuard lidar com isso
    }

    // Carrega usuario do banco
    const dbUser = await this.usersService.findBySupabaseId(authUser.id);

    if (dbUser) {
      // Enriquece o request.user com dados do banco
      request.user = {
        ...authUser,
        dbUser,
        userId: dbUser.id,
        tenantId: dbUser.tenantId,
        role: dbUser.role,
      };
    }

    return true;
  }
}
