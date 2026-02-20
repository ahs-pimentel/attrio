import { Controller, Get, Put, Post, Param, Body, ParseUUIDPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@attrio/contracts';
import { UserEntity } from './user.entity';

interface RequestUser {
  id: string;
  userId: string;
  tenantId: string;
  role: UserRole;
}

function mapUserToResponse(user: UserEntity): UserResponseDto {
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
      slug: user.tenant.slug,
    } : null,
    tenants: (user.userTenants || [])
      .filter(ut => ut.tenant != null)
      .map(ut => ({
        id: ut.tenant.id,
        name: ut.tenant.name,
        slug: ut.tenant.slug,
      })),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
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
    return users.map(mapUserToResponse);
  }

  @Get(':id')
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdWithRelations(id);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    return mapUserToResponse(user);
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

    return mapUserToResponse(updated);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Reset user password' })
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { password: string },
  ): Promise<{ message: string }> {
    await this.usersService.resetPassword(id, body.password);
    return { message: 'Senha redefinida com sucesso' };
  }
}
