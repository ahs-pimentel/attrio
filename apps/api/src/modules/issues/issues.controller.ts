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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { CreateIssueDto, UpdateIssueDto, IssueResponseDto } from './dto';
import { RequireTenant, Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  userId: string;
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('Ocorrencias')
@ApiBearerAuth()
@Controller('issues')
@RequireTenant()
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ocorrencias' })
  @ApiResponse({ status: 200, type: [IssueResponseDto] })
  async findAll(@CurrentUser() user: RequestUser): Promise<IssueResponseDto[]> {
    const issues =
      user.role === UserRole.RESIDENT
        ? await this.issuesService.findByUser(user.tenantId!, user.userId)
        : await this.issuesService.findAll(user.tenantId!);
    return issues.map((i) => this.toResponse(i));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar ocorrencia por ID' })
  @ApiResponse({ status: 200, type: IssueResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<IssueResponseDto> {
    const issue = await this.issuesService.findById(id, user.tenantId!);
    if (user.role === UserRole.RESIDENT && issue.createdBy !== user.userId) {
      throw new ForbiddenException('Voce nao tem permissao para ver esta ocorrencia');
    }
    return this.toResponse(issue);
  }

  @Post()
  @ApiOperation({ summary: 'Criar ocorrencia' })
  @ApiResponse({ status: 201, type: IssueResponseDto })
  async create(
    @Body() dto: CreateIssueDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IssueResponseDto> {
    const issue = await this.issuesService.create(user.tenantId!, dto, user.userId);
    const full = await this.issuesService.findById(issue.id, user.tenantId!);
    return this.toResponse(full);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar ocorrencia' })
  @ApiResponse({ status: 200, type: IssueResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIssueDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IssueResponseDto> {
    const issue = await this.issuesService.findById(id, user.tenantId!);

    // Morador so pode editar titulo/descricao de issues OPEN que criou
    if (user.role === UserRole.RESIDENT) {
      if (issue.createdBy !== user.userId) {
        throw new ForbiddenException('Voce nao tem permissao para editar esta ocorrencia');
      }
      if (dto.status) {
        throw new ForbiddenException('Apenas o sindico pode alterar o status');
      }
    }

    const updated = await this.issuesService.update(id, user.tenantId!, dto, user.userId);
    return this.toResponse(updated);
  }

  @Delete(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover ocorrencia' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.issuesService.delete(id, user.tenantId!);
  }

  private toResponse(i: any): IssueResponseDto {
    return {
      id: i.id,
      tenantId: i.tenantId,
      unitId: i.unitId,
      unitIdentifier: i.unit?.identifier || null,
      categoryId: i.categoryId,
      categoryName: i.category?.name || null,
      title: i.title,
      description: i.description,
      status: i.status,
      priority: i.priority,
      createdBy: i.createdBy,
      createdByName: i.creator?.name || i.creator?.email || '',
      resolvedBy: i.resolvedBy,
      resolvedByName: i.resolver?.name || i.resolver?.email || null,
      resolvedAt: i.resolvedAt,
      resolutionNote: i.resolutionNote || null,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    };
  }
}
