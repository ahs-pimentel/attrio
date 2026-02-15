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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommonAreasService } from './common-areas.service';
import { CreateCommonAreaDto, UpdateCommonAreaDto, CommonAreaResponseDto } from './dto';
import { RequireTenant, Roles, CurrentUser } from '../auth';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  userId: string;
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('Areas Comuns')
@ApiBearerAuth()
@Controller('common-areas')
@RequireTenant()
export class CommonAreasController {
  constructor(private readonly areasService: CommonAreasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar areas comuns' })
  @ApiResponse({ status: 200, type: [CommonAreaResponseDto] })
  async findAll(@CurrentUser() user: RequestUser): Promise<CommonAreaResponseDto[]> {
    const isSyndic = user.role === UserRole.SYNDIC || user.role === UserRole.SAAS_ADMIN;
    const areas = await this.areasService.findAll(user.tenantId!, isSyndic);
    return areas.map((a) => this.toResponse(a));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar area comum por ID' })
  @ApiResponse({ status: 200, type: CommonAreaResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<CommonAreaResponseDto> {
    const area = await this.areasService.findById(id, user.tenantId!);
    return this.toResponse(area);
  }

  @Post()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Criar area comum' })
  @ApiResponse({ status: 201, type: CommonAreaResponseDto })
  async create(
    @Body() dto: CreateCommonAreaDto,
    @CurrentUser() user: RequestUser,
  ): Promise<CommonAreaResponseDto> {
    const area = await this.areasService.create(user.tenantId!, dto);
    return this.toResponse(area);
  }

  @Put(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Atualizar area comum' })
  @ApiResponse({ status: 200, type: CommonAreaResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommonAreaDto,
    @CurrentUser() user: RequestUser,
  ): Promise<CommonAreaResponseDto> {
    const area = await this.areasService.update(id, user.tenantId!, dto);
    return this.toResponse(area);
  }

  @Delete(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover area comum' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.areasService.delete(id, user.tenantId!);
  }

  private toResponse(a: any): CommonAreaResponseDto {
    return {
      id: a.id,
      tenantId: a.tenantId,
      name: a.name,
      description: a.description,
      rules: a.rules,
      maxCapacity: a.maxCapacity,
      active: a.active,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}
