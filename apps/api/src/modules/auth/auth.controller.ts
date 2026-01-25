import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserRole } from '@attrio/contracts';

interface EnrichedUser {
  id: string;
  email?: string;
  phone?: string;
  isAnonymous: boolean;
  userId?: string;
  tenantId?: string | null;
  role?: UserRole;
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
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuario autenticado' })
  @ApiOkResponse({ type: ProfileResponse })
  getProfile(@CurrentUser() user: EnrichedUser): ProfileResponse {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      isAnonymous: user.isAnonymous,
      userId: user.userId,
      tenantId: user.tenantId,
      role: user.role,
    };
  }
}
