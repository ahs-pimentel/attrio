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
import { AnnouncementsService, EngagementData } from './announcements.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementResponseDto,
} from './dto/announcement.dto';
import { RequireTenant, Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  userId: string;
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('Comunicados')
@ApiBearerAuth()
@Controller('announcements')
@RequireTenant()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar comunicados do condominio' })
  @ApiResponse({ status: 200, type: [AnnouncementResponseDto] })
  async findAll(@CurrentUser() user: RequestUser): Promise<AnnouncementResponseDto[]> {
    const announcements = await this.announcementsService.findAll(user.tenantId!);
    const ids = announcements.map((a) => a.id);
    const engagementMap = await this.announcementsService.getEngagementBatch(ids, user.userId);
    return announcements.map((a) => this.toResponse(a, engagementMap.get(a.id)));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar comunicado por ID' })
  @ApiResponse({ status: 200, type: AnnouncementResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<AnnouncementResponseDto> {
    const announcement = await this.announcementsService.findById(id, user.tenantId!);
    const engagementMap = await this.announcementsService.getEngagementBatch([id], user.userId);
    return this.toResponse(announcement, engagementMap.get(id));
  }

  @Post()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Criar comunicado' })
  @ApiResponse({ status: 201, type: AnnouncementResponseDto })
  async create(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() user: RequestUser,
  ): Promise<AnnouncementResponseDto> {
    const announcement = await this.announcementsService.create(user.tenantId!, dto, user.userId);
    const full = await this.announcementsService.findById(announcement.id, user.tenantId!);
    return this.toResponse(full);
  }

  @Put(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Atualizar comunicado' })
  @ApiResponse({ status: 200, type: AnnouncementResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser() user: RequestUser,
  ): Promise<AnnouncementResponseDto> {
    const announcement = await this.announcementsService.update(id, user.tenantId!, dto);
    return this.toResponse(announcement);
  }

  @Delete(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover comunicado' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.announcementsService.delete(id, user.tenantId!);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Registrar visualizacao do comunicado' })
  async recordView(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.announcementsService.findById(id, user.tenantId!);
    await this.announcementsService.recordView(id, user.userId);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Curtir/descurtir comunicado' })
  async toggleLike(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<{ liked: boolean }> {
    await this.announcementsService.findById(id, user.tenantId!);
    const liked = await this.announcementsService.toggleLike(id, user.userId);
    return { liked };
  }

  private toResponse(a: any, engagement?: EngagementData): AnnouncementResponseDto {
    return {
      id: a.id,
      tenantId: a.tenantId,
      title: a.title,
      content: a.content,
      type: a.type,
      assemblyId: a.assemblyId,
      published: a.published,
      createdBy: a.createdBy,
      createdByName: a.creator?.name || null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      viewCount: engagement?.viewCount ?? 0,
      likeCount: engagement?.likeCount ?? 0,
      likedByMe: engagement?.likedByMe ?? false,
    };
  }
}
