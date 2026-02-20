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
import { AssembliesService } from './assemblies.service';
import { AnnouncementsService } from '../announcements/announcements.service';
import {
  CreateAssemblyDto,
  UpdateAssemblyDto,
  AssemblyResponseDto,
  AssemblyDetailResponseDto,
} from './dto';
import { RequireTenant, Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  userId: string;
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('Assembleias')
@ApiBearerAuth()
@Controller('assemblies')
@RequireTenant()
export class AssembliesController {
  constructor(
    private readonly assembliesService: AssembliesService,
    private readonly announcementsService: AnnouncementsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as assembleias do condominio' })
  @ApiResponse({ status: 200, type: [AssemblyResponseDto] })
  async findAll(@CurrentUser() user: RequestUser): Promise<AssemblyResponseDto[]> {
    return this.assembliesService.findAll(user.tenantId!);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Listar assembleias proximas (agendadas ou em andamento)' })
  @ApiResponse({ status: 200, type: [AssemblyResponseDto] })
  async findUpcoming(@CurrentUser() user: RequestUser): Promise<AssemblyResponseDto[]> {
    return this.assembliesService.findUpcoming(user.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar assembleia por ID' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: AssemblyDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Assembleia nao encontrada' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<AssemblyDetailResponseDto> {
    return this.assembliesService.findById(id, user.tenantId!);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obter estatisticas da assembleia' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 200 })
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assembliesService.getStats(id, user.tenantId!);
  }

  @Post()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Criar nova assembleia' })
  @ApiResponse({ status: 201, type: AssemblyResponseDto })
  async create(
    @Body() dto: CreateAssemblyDto,
    @CurrentUser() user: RequestUser,
  ): Promise<AssemblyResponseDto> {
    const assembly = await this.assembliesService.create(user.tenantId!, dto);

    // Cria comunicado automatico para a assembleia
    try {
      await this.announcementsService.createFromAssembly(
        user.tenantId!,
        assembly.title,
        assembly.description,
        assembly.id,
        assembly.scheduledAt,
        user.userId,
      );
    } catch (err) {
      // Nao falha a criacao da assembleia se o comunicado falhar
    }

    return assembly;
  }

  @Put(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Atualizar assembleia' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: AssemblyResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssemblyDto,
    @CurrentUser() user: RequestUser,
  ): Promise<AssemblyResponseDto> {
    return this.assembliesService.update(id, user.tenantId!, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir assembleia' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    return this.assembliesService.delete(id, user.tenantId!);
  }

  @Post(':id/start')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Iniciar assembleia' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: AssemblyResponseDto })
  async start(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<AssemblyResponseDto> {
    return this.assembliesService.start(id, user.tenantId!);
  }

  @Post(':id/finish')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Finalizar assembleia' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: AssemblyResponseDto })
  async finish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<AssemblyResponseDto> {
    return this.assembliesService.finish(id, user.tenantId!);
  }

  @Post(':id/cancel')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Cancelar assembleia' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: AssemblyResponseDto })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<AssemblyResponseDto> {
    return this.assembliesService.cancel(id, user.tenantId!);
  }
}
