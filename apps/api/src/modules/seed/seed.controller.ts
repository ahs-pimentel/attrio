import { Controller, Post, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SeedService } from './seed.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Seed (Development)')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Verificar status do seed' })
  async status() {
    return this.seedService.getStatus();
  }

  @Public()
  @Post('init')
  @ApiOperation({ summary: 'Inicializar dados de desenvolvimento' })
  async initDevelopment() {
    return this.seedService.initDevelopment();
  }

  @Post('register-me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar usuario atual no tenant de desenvolvimento' })
  async registerMe(@Req() req: { user: { id: string; email?: string } }) {
    const { id: supabaseUserId, email } = req.user;
    return this.seedService.registerUser(supabaseUserId, email || 'user@example.com');
  }

  @Post('auto-setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup completo: cria tenant e registra usuario' })
  async autoSetup(@Req() req: { user: { id: string; email?: string } }) {
    // Primeiro inicializa o tenant
    await this.seedService.initDevelopment();

    // Depois registra o usuario
    const { id: supabaseUserId, email } = req.user;
    return this.seedService.registerUser(supabaseUserId, email || 'user@example.com');
  }
}
