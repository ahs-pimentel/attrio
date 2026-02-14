import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UserRole } from '@attrio/contracts';
import { UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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
      if (data.tenantId !== undefined) user.tenantId = data.tenantId;
      if (data.role) user.role = data.role;
      return this.userRepository.save(user);
    }

    // Criar novo usuario
    user = this.userRepository.create({
      supabaseUserId: data.supabaseUserId,
      email: data.email,
      name: data.name || data.email.split('@')[0],
      tenantId: data.tenantId || null,
      role: data.role || UserRole.RESIDENT,
    });

    return this.userRepository.save(user);
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

    user.tenantId = tenantId;
    return this.userRepository.save(user);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find({
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdWithRelations(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['tenant'],
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
    }

    // Apply updates
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.tenantId !== undefined) user.tenantId = dto.tenantId;

    return this.userRepository.save(user);
  }
}
