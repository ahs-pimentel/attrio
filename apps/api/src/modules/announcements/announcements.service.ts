import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnouncementEntity } from './announcement.entity';
import { AnnouncementViewEntity } from './announcement-view.entity';
import { AnnouncementLikeEntity } from './announcement-like.entity';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto';
import { AnnouncementType } from '@attrio/contracts';

export interface EngagementData {
  viewCount: number;
  likeCount: number;
  likedByMe: boolean;
}

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(AnnouncementEntity)
    private readonly announcementRepository: Repository<AnnouncementEntity>,
    @InjectRepository(AnnouncementViewEntity)
    private readonly viewRepository: Repository<AnnouncementViewEntity>,
    @InjectRepository(AnnouncementLikeEntity)
    private readonly likeRepository: Repository<AnnouncementLikeEntity>,
  ) {}

  async findAll(tenantId: string): Promise<AnnouncementEntity[]> {
    return this.announcementRepository.find({
      where: { tenantId, published: true },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<AnnouncementEntity> {
    const announcement = await this.announcementRepository.findOne({
      where: { id, tenantId },
      relations: ['creator'],
    });
    if (!announcement) {
      throw new NotFoundException(`Comunicado com ID ${id} nao encontrado`);
    }
    return announcement;
  }

  async create(tenantId: string, dto: CreateAnnouncementDto, userId: string): Promise<AnnouncementEntity> {
    const announcement = this.announcementRepository.create({
      tenantId,
      title: dto.title,
      content: dto.content,
      type: dto.type || AnnouncementType.GENERAL,
      createdBy: userId,
    });
    return this.announcementRepository.save(announcement);
  }

  async createFromAssembly(
    tenantId: string,
    assemblyTitle: string,
    assemblyDescription: string | null,
    assemblyId: string,
    scheduledAt: Date,
    userId: string,
  ): Promise<AnnouncementEntity> {
    const dateStr = scheduledAt.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const content = `<p>Foi agendada uma nova assembleia: <strong>${assemblyTitle}</strong></p>
<p><strong>Data:</strong> ${dateStr}</p>
${assemblyDescription ? `<p>${assemblyDescription}</p>` : ''}
<p>Fique atento e participe!</p>`;

    const announcement = this.announcementRepository.create({
      tenantId,
      title: `Assembleia Agendada: ${assemblyTitle}`,
      content,
      type: AnnouncementType.ASSEMBLY,
      assemblyId,
      createdBy: userId,
    });
    return this.announcementRepository.save(announcement);
  }

  async update(id: string, tenantId: string, dto: UpdateAnnouncementDto): Promise<AnnouncementEntity> {
    const announcement = await this.findById(id, tenantId);

    if (dto.title !== undefined) announcement.title = dto.title;
    if (dto.content !== undefined) announcement.content = dto.content;
    if (dto.published !== undefined) announcement.published = dto.published;

    return this.announcementRepository.save(announcement);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const announcement = await this.findById(id, tenantId);
    await this.announcementRepository.remove(announcement);
  }

  async recordView(announcementId: string, userId: string): Promise<void> {
    try {
      await this.viewRepository.insert({ announcementId, userId });
    } catch (err: any) {
      // Ignora duplicate key - usuario ja visualizou
      if (err.code !== '23505') throw err;
    }
  }

  async toggleLike(announcementId: string, userId: string): Promise<boolean> {
    const existing = await this.likeRepository.findOne({
      where: { announcementId, userId },
    });
    if (existing) {
      await this.likeRepository.remove(existing);
      return false;
    }
    await this.likeRepository.insert({ announcementId, userId });
    return true;
  }

  async getEngagementBatch(
    announcementIds: string[],
    userId: string,
  ): Promise<Map<string, EngagementData>> {
    const result = new Map<string, EngagementData>();
    if (announcementIds.length === 0) return result;

    const viewCounts = await this.viewRepository
      .createQueryBuilder('v')
      .select('v.announcement_id', 'announcementId')
      .addSelect('COUNT(*)::int', 'count')
      .where('v.announcement_id IN (:...ids)', { ids: announcementIds })
      .groupBy('v.announcement_id')
      .getRawMany();

    const likeCounts = await this.likeRepository
      .createQueryBuilder('l')
      .select('l.announcement_id', 'announcementId')
      .addSelect('COUNT(*)::int', 'count')
      .where('l.announcement_id IN (:...ids)', { ids: announcementIds })
      .groupBy('l.announcement_id')
      .getRawMany();

    const userLikes = await this.likeRepository
      .createQueryBuilder('l')
      .select('l.announcement_id', 'announcementId')
      .where('l.announcement_id IN (:...ids)', { ids: announcementIds })
      .andWhere('l.user_id = :userId', { userId })
      .getRawMany();

    const viewMap = new Map(viewCounts.map((r) => [r.announcementId, r.count]));
    const likeMap = new Map(likeCounts.map((r) => [r.announcementId, r.count]));
    const userLikeSet = new Set(userLikes.map((r) => r.announcementId));

    for (const id of announcementIds) {
      result.set(id, {
        viewCount: viewMap.get(id) || 0,
        likeCount: likeMap.get(id) || 0,
        likedByMe: userLikeSet.has(id),
      });
    }
    return result;
  }
}
