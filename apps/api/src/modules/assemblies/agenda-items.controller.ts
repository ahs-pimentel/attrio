import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AgendaItemsService } from './agenda-items.service';
import {
  CreateAgendaItemDto,
  UpdateAgendaItemDto,
  AgendaItemDetailResponseDto,
  VoteResultDto,
} from './dto';
import { RequireTenant, Roles, CurrentUser } from '../auth';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('Pautas de Assembleia')
@ApiBearerAuth()
@Controller('assemblies/:assemblyId/agenda-items')
@RequireTenant()
export class AgendaItemsController {
  constructor(private readonly agendaItemsService: AgendaItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pautas de uma assembleia' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: [AgendaItemDetailResponseDto] })
  async findByAssembly(
    @Param('assemblyId', ParseUUIDPipe) assemblyId: string,
  ): Promise<AgendaItemDetailResponseDto[]> {
    return this.agendaItemsService.findByAssembly(assemblyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pauta por ID' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'id', description: 'ID da pauta' })
  @ApiResponse({ status: 200, type: AgendaItemDetailResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgendaItemDetailResponseDto> {
    return this.agendaItemsService.findById(id);
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Obter resultado da votacao' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'id', description: 'ID da pauta' })
  @ApiResponse({ status: 200, type: VoteResultDto })
  async getVoteResult(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VoteResultDto> {
    return this.agendaItemsService.getVoteResult(id);
  }

  @Post()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Adicionar pauta a assembleia' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiResponse({ status: 201, type: AgendaItemDetailResponseDto })
  async create(
    @Param('assemblyId', ParseUUIDPipe) assemblyId: string,
    @Body() dto: CreateAgendaItemDto,
    @CurrentUser() user: RequestUser,
  ): Promise<AgendaItemDetailResponseDto> {
    return this.agendaItemsService.create(assemblyId, user.tenantId!, dto);
  }

  @Put(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Atualizar pauta' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'id', description: 'ID da pauta' })
  @ApiResponse({ status: 200, type: AgendaItemDetailResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgendaItemDto,
  ): Promise<AgendaItemDetailResponseDto> {
    return this.agendaItemsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir pauta' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'id', description: 'ID da pauta' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.agendaItemsService.delete(id);
  }

  @Post(':id/start-voting')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Iniciar votacao da pauta' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'id', description: 'ID da pauta' })
  @ApiResponse({ status: 200, type: AgendaItemDetailResponseDto })
  async startVoting(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgendaItemDetailResponseDto> {
    return this.agendaItemsService.startVoting(id);
  }

  @Post(':id/close-voting')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Encerrar votacao da pauta' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'id', description: 'ID da pauta' })
  @ApiResponse({ status: 200, type: AgendaItemDetailResponseDto })
  async closeVoting(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AgendaItemDetailResponseDto> {
    return this.agendaItemsService.closeVoting(id);
  }
}
