import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, TenantResponseDto } from './dto/tenant.dto';
import { Roles } from '../auth/decorators';
import { UserRole } from '@attrio/contracts';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Listar todos os tenants (somente SAAS_ADMIN)' })
  @ApiOkResponse({ type: [TenantResponseDto] })
  async findAll(): Promise<TenantResponseDto[]> {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @ApiOperation({ summary: 'Buscar tenant por ID' })
  @ApiOkResponse({ type: TenantResponseDto })
  @ApiNotFoundResponse({ description: 'Tenant nao encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<TenantResponseDto> {
    return this.tenantsService.findById(id);
  }

  @Get('slug/:slug')
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Buscar tenant por slug' })
  @ApiOkResponse({ type: TenantResponseDto })
  @ApiNotFoundResponse({ description: 'Tenant nao encontrado' })
  async findBySlug(@Param('slug') slug: string): Promise<TenantResponseDto> {
    return this.tenantsService.findBySlug(slug);
  }

  @Post()
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Criar novo tenant (somente SAAS_ADMIN)' })
  @ApiCreatedResponse({ type: TenantResponseDto })
  @ApiConflictResponse({ description: 'Slug ja existe' })
  async create(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantsService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @ApiOperation({ summary: 'Atualizar tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  @ApiNotFoundResponse({ description: 'Tenant nao encontrado' })
  @ApiConflictResponse({ description: 'Slug ja existe' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SAAS_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover tenant (somente SAAS_ADMIN)' })
  @ApiNoContentResponse({ description: 'Tenant removido' })
  @ApiNotFoundResponse({ description: 'Tenant nao encontrado' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tenantsService.delete(id);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Desativar tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<TenantResponseDto> {
    return this.tenantsService.deactivate(id);
  }

  @Post(':id/activate')
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Ativar tenant' })
  @ApiOkResponse({ type: TenantResponseDto })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<TenantResponseDto> {
    return this.tenantsService.activate(id);
  }
}
