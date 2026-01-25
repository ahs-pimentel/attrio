import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UserRole } from '@attrio/contracts';

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
}
