import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '@attrio/contracts';

const DEV_TENANT_SLUG = 'condominio-dev';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getStatus() {
    const tenantCount = await this.tenantRepository.count();
    const userCount = await this.userRepository.count();
    const devTenant = await this.tenantRepository.findOne({
      where: { slug: DEV_TENANT_SLUG },
    });

    return {
      initialized: !!devTenant,
      tenants: tenantCount,
      users: userCount,
      devTenantId: devTenant?.id || null,
    };
  }

  async initDevelopment() {
    this.logger.log('Inicializando dados de desenvolvimento...');

    // Verificar se ja existe o tenant de desenvolvimento
    let devTenant = await this.tenantRepository.findOne({
      where: { slug: DEV_TENANT_SLUG },
    });

    if (!devTenant) {
      this.logger.log('Criando tenant de desenvolvimento...');
      devTenant = this.tenantRepository.create({
        name: 'Condominio de Desenvolvimento',
        slug: DEV_TENANT_SLUG,
        active: true,
      });
      devTenant = await this.tenantRepository.save(devTenant);
      this.logger.log(`Tenant criado com ID: ${devTenant.id}`);
    } else {
      this.logger.log(`Tenant de desenvolvimento ja existe: ${devTenant.id}`);
    }

    return {
      success: true,
      message: 'Dados de desenvolvimento inicializados',
      tenant: {
        id: devTenant.id,
        name: devTenant.name,
        slug: devTenant.slug,
      },
    };
  }

  async registerUser(supabaseUserId: string, email: string) {
    this.logger.log(`Registrando usuario: ${email} (${supabaseUserId})`);

    // Buscar tenant de desenvolvimento
    let devTenant = await this.tenantRepository.findOne({
      where: { slug: DEV_TENANT_SLUG },
    });

    if (!devTenant) {
      // Criar se nao existir
      const initResult = await this.initDevelopment();
      devTenant = await this.tenantRepository.findOne({
        where: { slug: DEV_TENANT_SLUG },
      });
    }

    // Verificar se usuario ja existe
    let user = await this.userRepository.findOne({
      where: { supabaseUserId },
    });

    if (user) {
      // Atualizar tenant se necessario
      if (!user.tenantId && devTenant) {
        user.tenantId = devTenant.id;
        user.role = UserRole.SYNDIC;
        user = await this.userRepository.save(user);
        this.logger.log(`Usuario atualizado com tenant: ${user.id}`);
      }
    } else {
      // Criar novo usuario
      user = this.userRepository.create({
        supabaseUserId,
        email,
        name: email.split('@')[0],
        tenantId: devTenant?.id || null,
        role: UserRole.SYNDIC, // Primeiro usuario vira sindico
      });
      user = await this.userRepository.save(user);
      this.logger.log(`Novo usuario criado: ${user.id}`);
    }

    return {
      success: true,
      message: 'Usuario registrado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async getOrCreateDevTenant(): Promise<TenantEntity> {
    let tenant = await this.tenantRepository.findOne({
      where: { slug: DEV_TENANT_SLUG },
    });

    if (!tenant) {
      tenant = this.tenantRepository.create({
        name: 'Condominio de Desenvolvimento',
        slug: DEV_TENANT_SLUG,
        active: true,
      });
      tenant = await this.tenantRepository.save(tenant);
    }

    return tenant;
  }
}
