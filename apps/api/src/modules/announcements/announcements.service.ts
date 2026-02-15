import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnouncementEntity } from './announcement.entity';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto';
import { AnnouncementType } from '@attrio/contracts';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(AnnouncementEntity)
    private readonly announcementRepository: Repository<AnnouncementEntity>,
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
}
