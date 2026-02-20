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
import { ParticipantsService } from './participants.service';
import {
  RegisterParticipantDto,
  UpdateParticipantDto,
  ParticipantDetailResponseDto,
} from './dto';
import { RequireTenant, Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('Participantes de Assembleia')
@ApiBearerAuth()
@Controller('assemblies/:assemblyId/participants')
@RequireTenant()
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar participantes de uma assembleia' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: [ParticipantDetailResponseDto] })
  async findByAssembly(
    @Param('assemblyId', ParseUUIDPipe) assemblyId: string,
  ): Promise<ParticipantDetailResponseDto[]> {
    return this.participantsService.findByAssembly(assemblyId);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Obter estatisticas de presenca' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiResponse({ status: 200 })
  async getAttendance(
    @Param('assemblyId', ParseUUIDPipe) assemblyId: string,
  ) {
    return this.participantsService.getAttendanceStats(assemblyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar participante por ID' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'id', description: 'ID do participante' })
  @ApiResponse({ status: 200, type: ParticipantDetailResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ParticipantDetailResponseDto> {
    return this.participantsService.findById(id);
  }

  @Post()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN, UserRole.DOORMAN)
  @ApiOperation({ summary: 'Registrar participante na assembleia' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiResponse({ status: 201, type: ParticipantDetailResponseDto })
  async register(
    @Param('assemblyId', ParseUUIDPipe) assemblyId: string,
    @Body() dto: RegisterParticipantDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ParticipantDetailResponseDto> {
    return this.participantsService.register(assemblyId, user.tenantId!, dto);
  }

  @Put(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Atualizar dados do participante' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'id', description: 'ID do participante' })
  @ApiResponse({ status: 200, type: ParticipantDetailResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParticipantDto,
  ): Promise<ParticipantDetailResponseDto> {
    return this.participantsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover participante' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'id', description: 'ID do participante' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.participantsService.remove(id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Marcar entrada do participante' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'id', description: 'ID do participante' })
  @ApiResponse({ status: 200, type: ParticipantDetailResponseDto })
  async markJoined(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ParticipantDetailResponseDto> {
    return this.participantsService.markJoined(id);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Marcar saida do participante' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'id', description: 'ID do participante' })
  @ApiResponse({ status: 200, type: ParticipantDetailResponseDto })
  async markLeft(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ParticipantDetailResponseDto> {
    return this.participantsService.markLeft(id);
  }
}
