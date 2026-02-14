import { Controller, Get, Put, Param, Body, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  id: string;
  userId: string;
  tenantId: string;
  role: UserRole;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'List all users' })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map(user => ({
      id: user.id,
      supabaseUserId: user.supabaseUserId,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  @Get(':id')
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdWithRelations(id);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    return {
      id: user.id,
      supabaseUserId: user.supabaseUserId,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Put(':id')
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, dto, currentUser.userId);
    const updated = await this.usersService.findByIdWithRelations(user.id);

    if (!updated) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return {
      id: updated.id,
      supabaseUserId: updated.supabaseUserId,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      tenantId: updated.tenantId,
      tenant: updated.tenant ? {
        id: updated.tenant.id,
        name: updated.tenant.name,
        slug: updated.tenant.slug
      } : null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
