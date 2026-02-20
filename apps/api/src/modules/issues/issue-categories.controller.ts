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
import { IssueCategoriesService } from './issue-categories.service';
import {
  CreateIssueCategoryDto,
  UpdateIssueCategoryDto,
  IssueCategoryResponseDto,
} from './dto';
import { RequireTenant, Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  userId: string;
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('Categorias de Ocorrencias')
@ApiBearerAuth()
@Controller('issue-categories')
@RequireTenant()
export class IssueCategoriesController {
  constructor(private readonly categoriesService: IssueCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias de ocorrencias' })
  @ApiResponse({ status: 200, type: [IssueCategoryResponseDto] })
  async findAll(@CurrentUser() user: RequestUser): Promise<IssueCategoryResponseDto[]> {
    const categories = await this.categoriesService.findAll(user.tenantId!, true);
    return categories.map((c) => this.toResponse(c));
  }

  @Post()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Criar categoria de ocorrencia' })
  @ApiResponse({ status: 201, type: IssueCategoryResponseDto })
  async create(
    @Body() dto: CreateIssueCategoryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IssueCategoryResponseDto> {
    const category = await this.categoriesService.create(user.tenantId!, dto);
    return this.toResponse(category);
  }

  @Put(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Atualizar categoria de ocorrencia' })
  @ApiResponse({ status: 200, type: IssueCategoryResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIssueCategoryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IssueCategoryResponseDto> {
    const category = await this.categoriesService.update(id, user.tenantId!, dto);
    return this.toResponse(category);
  }

  @Delete(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover categoria de ocorrencia' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.categoriesService.delete(id, user.tenantId!);
  }

  private toResponse(c: any): IssueCategoryResponseDto {
    return {
      id: c.id,
      tenantId: c.tenantId,
      name: c.name,
      active: c.active,
      createdAt: c.createdAt,
    };
  }
}
