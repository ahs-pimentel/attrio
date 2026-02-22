import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
    private readonly dataSource: DataSource,
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

    const finalRole = dto.role ?? user.role;

    // Prevent self role change
    if (user.id === currentUserId && dto.role && dto.role !== user.role) {
      throw new ForbiddenException('Nao e possivel alterar o proprio role');
    }

    // SAAS_ADMIN cannot have tenant
    if (finalRole === UserRole.SAAS_ADMIN) {
      const hasTenantId = dto.tenantId != null;
      const hasTenantIds = dto.tenantIds && dto.tenantIds.length > 0;
      if (hasTenantId || hasTenantIds) {
        throw new ConflictException('SAAS_ADMIN nao pode ter condominio associado');
      }
    }

    // Non-SAAS_ADMIN must have at least one tenant
    if (finalRole !== UserRole.SAAS_ADMIN) {
      const willHaveTenants =
        (dto.tenantIds !== undefined && dto.tenantIds.length > 0) ||
        (dto.tenantId != null) ||
        (dto.tenantIds === undefined && dto.tenantId === undefined && (user.tenantId != null || (user.userTenants?.length ?? 0) > 0));
      if (!willHaveTenants) {
        throw new BadRequestException('Usuario com esta permissao precisa estar vinculado a um condominio');
      }
    }

    // Email uniqueness
    if (dto.email && dto.email !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('Email ja esta em uso');
      }
    }

    // Validate tenantIds exist before making any changes
    const tenantIdsToProcess = dto.tenantIds;
    if (tenantIdsToProcess && tenantIdsToProcess.length > 0) {
      for (const tenantId of tenantIdsToProcess) {
        try {
          await this.tenantsService.findById(tenantId);
        } catch {
          throw new NotFoundException(`Condominio com ID ${tenantId} nao encontrado`);
        }
      }
    }

    // Validate single tenantId if provided
    if (dto.tenantId) {
      try {
        await this.tenantsService.findById(dto.tenantId);
      } catch {
        throw new NotFoundException(`Condominio com ID ${dto.tenantId} nao encontrado`);
      }
    }

    // Use a transaction for atomicity
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const userTenantRepo = manager.getRepository(UserTenantEntity);

      // Apply basic field updates
      if (dto.name !== undefined) user.name = dto.name;
      if (dto.email !== undefined) user.email = dto.email;
      if (dto.role !== undefined) user.role = dto.role;

      // Handle tenant assignments based on the final role
      if (finalRole === UserRole.SAAS_ADMIN) {
        // SAAS_ADMIN: clear all tenant associations
        user.tenantId = null;
        await userTenantRepo.delete({ userId: id });
      } else if (tenantIdsToProcess !== undefined) {
        // Process tenantIds array (explicit reassignment)
        await userTenantRepo.delete({ userId: id });

        if (tenantIdsToProcess.length > 0) {
          for (const tenantId of tenantIdsToProcess) {
            await userTenantRepo.insert({ userId: id, tenantId });
          }

          // Set primary tenantId: keep current if in list, otherwise use first
          if (!tenantIdsToProcess.includes(user.tenantId || '')) {
            user.tenantId = tenantIdsToProcess[0];
          }
        } else {
          user.tenantId = null;
        }
      } else if (dto.tenantId !== undefined) {
        // Process single tenantId (legacy path)
        user.tenantId = dto.tenantId;
        if (dto.tenantId) {
          const existing = await userTenantRepo.findOne({
            where: { userId: id, tenantId: dto.tenantId },
          });
          if (!existing) {
            await userTenantRepo.insert({ userId: id, tenantId: dto.tenantId });
          }
        }
      } else if (user.tenantId) {
        // No tenant change requested — repair orphaned junction entry if missing
        const existing = await userTenantRepo.findOne({
          where: { userId: id, tenantId: user.tenantId },
        });
        if (!existing) {
          await userTenantRepo.insert({ userId: id, tenantId: user.tenantId });
        }
      }

      // Clear loaded relations to prevent TypeORM from cascading stale data
      delete (user as any).userTenants;
      delete (user as any).tenant;

      return userRepo.save(user);
    });
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

  async updateOwnProfile(userId: string, data: { name?: string; email?: string }): Promise<UserEntity> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.findByEmail(data.email);
      if (existing) {
        throw new ConflictException('Email ja esta em uso');
      }
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;

    return this.userRepository.save(user);
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
