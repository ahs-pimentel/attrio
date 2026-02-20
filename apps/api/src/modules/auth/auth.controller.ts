import { Controller, Get, Post, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserRole } from '@attrio/contracts';
import { UsersService } from '../users/users.service';

interface EnrichedUser {
  id: string;
  email?: string;
  phone?: string;
  isAnonymous: boolean;
  userId?: string;
  tenantId?: string | null;
  role?: UserRole;
}

class TenantInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

class ProfileResponse {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  isAnonymous: boolean;

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  tenantId?: string | null;

  @ApiPropertyOptional({ enum: UserRole })
  role?: UserRole;

  @ApiPropertyOptional({ type: [TenantInfoDto] })
  availableTenants?: TenantInfoDto[];
}

class SwitchTenantDto {
  @ApiProperty()
  @IsUUID()
  tenantId: string;
}

class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;
}

class UpdateProfileResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuario autenticado' })
  @ApiOkResponse({ type: ProfileResponse })
  async getProfile(@CurrentUser() user: EnrichedUser): Promise<ProfileResponse> {
    const response: ProfileResponse = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      isAnonymous: user.isAnonymous,
      userId: user.userId,
      tenantId: user.tenantId,
      role: user.role,
    };

    if (user.userId) {
      const userTenants = await this.usersService.findUserTenants(user.userId);
      response.availableTenants = userTenants.map(ut => ({
        id: ut.tenant.id,
        name: ut.tenant.name,
        slug: ut.tenant.slug,
      }));
    }

    return response;
  }

  @Get('tenants')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar condominios do usuario autenticado' })
  @ApiOkResponse({ type: [TenantInfoDto] })
  async getUserTenants(@CurrentUser() user: EnrichedUser): Promise<TenantInfoDto[]> {
    if (!user.userId) return [];

    const userTenants = await this.usersService.findUserTenants(user.userId);
    return userTenants.map(ut => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
      slug: ut.tenant.slug,
    }));
  }

  @Post('switch-tenant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trocar condominio ativo' })
  async switchTenant(
    @CurrentUser() user: EnrichedUser,
    @Body() body: SwitchTenantDto,
  ): Promise<{ tenantId: string }> {
    const updated = await this.usersService.switchTenant(user.userId!, body.tenantId);
    return { tenantId: updated.tenantId! };
  }

  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil do usuario autenticado' })
  @ApiOkResponse({ type: UpdateProfileResponse })
  async updateProfile(
    @CurrentUser() user: EnrichedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UpdateProfileResponse> {
    const updated = await this.usersService.updateOwnProfile(user.userId!, dto);
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
    };
  }
}
