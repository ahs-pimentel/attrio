import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UserTenantEntity } from './user-tenant.entity';
import { UserRole } from '@attrio/contracts';
import { UpdateUserDto } from './dto/user.dto';
import { supabaseAdmin } from '../../core/supabase/supabase-admin';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserTenantEntity)
    private readonly userTenantRepository: Repository<UserTenantEntity>,
    private readonly tenantsService: TenantsService,
  ) {}

  async findBySupabaseId(supabaseUserId: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { supabaseUserId },
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByTenant(tenantId: string): Promise<UserEntity[]> {
    return this.userRepository.find({
      where: { tenantId },
    });
  }

  async createOrUpdate(data: {
    supabaseUserId: string;
    email: string;
    name?: string;
    tenantId?: string;
    role?: UserRole;
  }): Promise<UserEntity> {
    let user = await this.findBySupabaseId(data.supabaseUserId);

    if (user) {
      // Atualizar usuario existente
      if (data.email) user.email = data.email;
      if (data.name) user.name = data.name;
      if (data.tenantId !== undefined) {
        // Validar que o tenant existe
        if (data.tenantId) {
          try {
            await this.tenantsService.findById(data.tenantId);
          } catch (error) {
            throw new NotFoundException(`Condominio com ID ${data.tenantId} nao encontrado`);
          }
        }
        user.tenantId = data.tenantId;
      }
      if (data.role) user.role = data.role;
      user = await this.userRepository.save(user);

      // Garantir entrada na junction table
      if (data.tenantId) {
        await this.addUserTenant(user.id, data.tenantId);
      }

      return user;
    }

    // Criar novo usuario
    // Validar que o tenant existe se fornecido
    if (data.tenantId) {
      try {
        await this.tenantsService.findById(data.tenantId);
      } catch (error) {
        throw new NotFoundException(`Condominio com ID ${data.tenantId} nao encontrado`);
      }
    }

    user = this.userRepository.create({
      supabaseUserId: data.supabaseUserId,
      email: data.email,
      name: data.name || data.email.split('@')[0],
      tenantId: data.tenantId || null,
      role: data.role || UserRole.RESIDENT,
    });

    user = await this.userRepository.save(user);

    // Criar entrada na junction table
    if (data.tenantId) {
      await this.addUserTenant(user.id, data.tenantId);
    }

    return user;
  }

  async updateRole(id: string, role: UserRole): Promise<UserEntity | null> {
    const user = await this.findById(id);
    if (!user) return null;

    user.role = role;
    return this.userRepository.save(user);
  }

  async assignToTenant(id: string, tenantId: string): Promise<UserEntity | null> {
    const user = await this.findById(id);
    if (!user) return null;

    // Validar que o tenant existe
    try {
      await this.tenantsService.findById(tenantId);
    } catch (error) {
      throw new NotFoundException(`Condominio com ID ${tenantId} nao encontrado`);
    }

    user.tenantId = tenantId;
    await this.userRepository.save(user);

    // Garantir entrada na junction table
    await this.addUserTenant(id, tenantId);

    return user;
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find({
      relations: ['tenant', 'userTenants', 'userTenants.tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdWithRelations(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['tenant', 'userTenants', 'userTenants.tenant'],
    });
  }

  async update(id: string, dto: UpdateUserDto, currentUserId: string): Promise<UserEntity> {
    const user = await this.findByIdWithRelations(id);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    // Prevent self-demotion
    if (user.id === currentUserId && dto.role && dto.role !== UserRole.SAAS_ADMIN) {
      throw new ForbiddenException('Voce nao pode alterar seu proprio role');
    }

    // SAAS_ADMIN cannot have tenant
    const finalRole = dto.role || user.role;
    if (finalRole === UserRole.SAAS_ADMIN && dto.tenantId) {
      throw new ConflictException('SAAS_ADMIN nao pode ter tenant associado');
    }

    // Email uniqueness
    if (dto.email && dto.email !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('Email ja esta em uso');
      }
    }

    // Auto-clear tenant when promoting to SAAS_ADMIN
    if (dto.role === UserRole.SAAS_ADMIN) {
      user.tenantId = null;
      // Limpar junction table
      await this.userTenantRepository.delete({ userId: id });
    }

    // Apply updates
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.role !== undefined) user.role = dto.role;

    // Processar tenantIds (atribuicao a multiplos condominios)
    if (dto.tenantIds !== undefined) {
      // Validar que todos os tenantIds existem
      for (const tenantId of dto.tenantIds) {
        try {
          await this.tenantsService.findById(tenantId);
        } catch (error) {
          throw new NotFoundException(`Condominio com ID ${tenantId} nao encontrado`);
        }
      }

      // Remover entradas existentes
      await this.userTenantRepository.delete({ userId: id });

      if (dto.tenantIds.length > 0) {
        // Inserir novas entradas
        const entries = dto.tenantIds.map(tenantId =>
          this.userTenantRepository.create({ userId: id, tenantId }),
        );
        await this.userTenantRepository.save(entries);

        // Se tenantId atual nao esta na nova lista, setar o primeiro
        if (!dto.tenantIds.includes(user.tenantId || '')) {
          user.tenantId = dto.tenantIds[0];
        }
      } else {
        user.tenantId = null;
      }
    } else if (dto.tenantId !== undefined) {
      // Validar que o tenantId existe
      if (dto.tenantId) {
        try {
          await this.tenantsService.findById(dto.tenantId);
        } catch (error) {
          throw new NotFoundException(`Condominio com ID ${dto.tenantId} nao encontrado`);
        }
      }

      user.tenantId = dto.tenantId;
      // Garantir entrada na junction table
      if (dto.tenantId) {
        await this.addUserTenant(id, dto.tenantId);
      }
    }

    return this.userRepository.save(user);
  }

  // === Metodos multi-tenant ===

  async findUserTenants(userId: string): Promise<UserTenantEntity[]> {
    return this.userTenantRepository.find({
      where: { userId },
      relations: ['tenant'],
      order: { createdAt: 'ASC' },
    });
  }

  async switchTenant(userId: string, tenantId: string): Promise<UserEntity> {
    // Validar que o tenant existe
    try {
      await this.tenantsService.findById(tenantId);
    } catch (error) {
      throw new NotFoundException(`Condominio com ID ${tenantId} nao encontrado`);
    }

    const userTenant = await this.userTenantRepository.findOne({
      where: { userId, tenantId },
    });

    if (!userTenant) {
      throw new ForbiddenException('Usuario nao tem acesso a este condominio');
    }

    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    user.tenantId = tenantId;
    return this.userRepository.save(user);
  }

  async addUserTenant(userId: string, tenantId: string): Promise<UserTenantEntity> {
    const existing = await this.userTenantRepository.findOne({
      where: { userId, tenantId },
    });
    if (existing) {
      return existing;
    }

    const userTenant = this.userTenantRepository.create({ userId, tenantId });
    return this.userTenantRepository.save(userTenant);
  }

  async removeUserTenant(userId: string, tenantId: string): Promise<void> {
    await this.userTenantRepository.delete({ userId, tenantId });
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      user.supabaseUserId,
      { password: newPassword },
    );

    if (error) {
      this.logger.error(`Erro ao resetar senha do usuario ${id}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    this.logger.log(`Senha do usuario ${user.email} resetada com sucesso`);
  }
}
