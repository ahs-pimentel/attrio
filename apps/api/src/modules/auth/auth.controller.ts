import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './strategies/jwt.strategy';

class ProfileResponse {
  id: string;
  email?: string;
  phone?: string;
  isAnonymous: boolean;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuario autenticado' })
  @ApiOkResponse({ type: ProfileResponse })
  getProfile(@CurrentUser() user: AuthenticatedUser): ProfileResponse {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      isAnonymous: user.isAnonymous,
    };
  }
}
