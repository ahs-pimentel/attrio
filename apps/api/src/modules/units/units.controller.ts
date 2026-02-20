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
  ForbiddenException,
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
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto, UnitResponseDto } from './dto/unit.dto';
import { CurrentUser, Roles, RequireTenant } from '../auth/decorators';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('Units')
@ApiBearerAuth()
@Controller('units')
@RequireTenant()
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.DOORMAN)
  @ApiOperation({ summary: 'Listar todas as unidades do condominio' })
  @ApiOkResponse({ type: [UnitResponseDto] })
  async findAll(@CurrentUser() user: RequestUser): Promise<UnitResponseDto[]> {
    return this.unitsService.findAllByTenant(user.tenantId!);
  }

  @Get(':id')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.DOORMAN, UserRole.RESIDENT)
  @ApiOperation({ summary: 'Buscar unidade por ID' })
  @ApiOkResponse({ type: UnitResponseDto })
  @ApiNotFoundResponse({ description: 'Unidade nao encontrada' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<UnitResponseDto> {
    return this.unitsService.findById(id, user.tenantId!);
  }

  @Post()
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @ApiOperation({ summary: 'Criar nova unidade' })
  @ApiCreatedResponse({ type: UnitResponseDto })
  @ApiConflictResponse({ description: 'Unidade ja existe' })
  async create(
    @Body() dto: CreateUnitDto,
    @CurrentUser() user: RequestUser,
  ): Promise<UnitResponseDto> {
    return this.unitsService.create(user.tenantId!, dto);
  }

  @Put(':id')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @ApiOperation({ summary: 'Atualizar unidade' })
  @ApiOkResponse({ type: UnitResponseDto })
  @ApiNotFoundResponse({ description: 'Unidade nao encontrada' })
  @ApiConflictResponse({ description: 'Identificador ja existe' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnitDto,
    @CurrentUser() user: RequestUser,
  ): Promise<UnitResponseDto> {
    return this.unitsService.update(id, user.tenantId!, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover unidade' })
  @ApiNoContentResponse({ description: 'Unidade removida' })
  @ApiNotFoundResponse({ description: 'Unidade nao encontrada' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    return this.unitsService.delete(id, user.tenantId!);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @ApiOperation({ summary: 'Desativar unidade' })
  @ApiOkResponse({ type: UnitResponseDto })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<UnitResponseDto> {
    return this.unitsService.deactivate(id, user.tenantId!);
  }

  @Post(':id/activate')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @ApiOperation({ summary: 'Ativar unidade' })
  @ApiOkResponse({ type: UnitResponseDto })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<UnitResponseDto> {
    return this.unitsService.activate(id, user.tenantId!);
  }
}
