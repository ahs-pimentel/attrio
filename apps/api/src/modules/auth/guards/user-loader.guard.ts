import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { TenantEntity } from '../../tenants/tenant.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../strategies/jwt.strategy';
import { UserRole } from '@attrio/contracts';

const DEV_TENANT_SLUG = 'condominio-dev';

/**
 * Guard que carrega os dados completos do usuario do banco de dados
 * apos a autenticacao JWT. Deve rodar apos o JwtAuthGuard.
 *
 * Em modo desenvolvimento, auto-cria usuarios com role SYNDIC e tenant de dev.
 */
@Injectable()
export class UserLoaderGuard implements CanActivate {
  private readonly logger = new Logger(UserLoaderGuard.name);
  private readonly isDevelopment: boolean;

  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {
    this.isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
  }

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
    let dbUser = await this.usersService.findBySupabaseId(authUser.id);

    // Auto-cria usuario se nao existir
    if (!dbUser) {
      if (this.isDevelopment) {
        this.logger.log(`Auto-criando usuario em desenvolvimento: ${authUser.email}`);
        const devTenant = await this.getOrCreateDevTenant();
        dbUser = await this.usersService.createOrUpdate({
          supabaseUserId: authUser.id,
          email: authUser.email || 'user@dev.local',
          name: authUser.email?.split('@')[0] || 'Dev User',
          tenantId: devTenant.id,
          role: UserRole.SAAS_ADMIN,
        });
        this.logger.log(`Usuario criado: ${dbUser.id} no tenant ${devTenant.id}`);
      } else {
        this.logger.log(`Auto-criando usuario em producao: ${authUser.email}`);
        dbUser = await this.usersService.createOrUpdate({
          supabaseUserId: authUser.id,
          email: authUser.email || 'user@unknown.com',
          name: authUser.email?.split('@')[0] || 'User',
          role: UserRole.RESIDENT,
        });
        this.logger.log(`Usuario criado em producao: ${dbUser.id}`);
      }
    }

    // Em desenvolvimento, se usuario existe mas nao tem tenant, atribuir
    if (dbUser && !dbUser.tenantId && this.isDevelopment) {
      const devTenant = await this.getOrCreateDevTenant();
      dbUser = await this.usersService.createOrUpdate({
        supabaseUserId: authUser.id,
        email: dbUser.email,
        tenantId: devTenant.id,
      });
      this.logger.log(`Tenant atribuido ao usuario: ${dbUser.id}`);
    }

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

  private async getOrCreateDevTenant(): Promise<TenantEntity> {
    let tenant = await this.tenantRepository.findOne({
      where: { slug: DEV_TENANT_SLUG },
    });

    if (!tenant) {
      this.logger.log('Criando tenant de desenvolvimento...');
      tenant = this.tenantRepository.create({
        name: 'Condominio de Desenvolvimento',
        slug: DEV_TENANT_SLUG,
        active: true,
      });
      tenant = await this.tenantRepository.save(tenant);
      this.logger.log(`Tenant criado: ${tenant.id}`);
    }

    return tenant;
  }
}
