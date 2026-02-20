import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MinutesService } from './minutes.service';
import {
  UpdateMinutesDto,
  MinutesResponseDto,
  GenerateMinutesResponseDto,
} from './dto/minutes.dto';
import { RequireTenant, Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  tenantId: string | null;
  userId: string;
  role: UserRole;
}

@ApiTags('Atas de Assembleia')
@ApiBearerAuth()
@Controller('assemblies/:assemblyId/minutes')
@RequireTenant()
export class MinutesController {
  constructor(private readonly minutesService: MinutesService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar ata da assembleia' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: MinutesResponseDto })
  async findByAssembly(
    @Param('assemblyId', ParseUUIDPipe) assemblyId: string,
  ): Promise<MinutesResponseDto | null> {
    return this.minutesService.findByAssembly(assemblyId);
  }

  @Post('generate')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Gerar ata automaticamente' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiResponse({ status: 201, type: GenerateMinutesResponseDto })
  async generateMinutes(
    @Param('assemblyId', ParseUUIDPipe) assemblyId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<GenerateMinutesResponseDto> {
    return this.minutesService.generateMinutes(assemblyId, user.tenantId!);
  }

  @Put()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Atualizar conteudo da ata' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: MinutesResponseDto })
  async update(
    @Param('assemblyId', ParseUUIDPipe) assemblyId: string,
    @Body() dto: UpdateMinutesDto,
  ): Promise<MinutesResponseDto> {
    return this.minutesService.update(assemblyId, dto);
  }

  @Post('approve')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Aprovar ata' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: MinutesResponseDto })
  async approve(
    @Param('assemblyId', ParseUUIDPipe) assemblyId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<MinutesResponseDto> {
    return this.minutesService.approve(assemblyId, user.userId);
  }

  @Post('publish')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Publicar ata' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: MinutesResponseDto })
  async publish(
    @Param('assemblyId', ParseUUIDPipe) assemblyId: string,
  ): Promise<MinutesResponseDto> {
    return this.minutesService.publish(assemblyId);
  }
}
