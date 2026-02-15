import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueEntity } from './entities/issue.entity';
import { CreateIssueDto, UpdateIssueDto } from './dto';
import { IssueStatus, IssuePriority } from '@attrio/contracts';

@Injectable()
export class IssuesService {
  private readonly defaultRelations = ['creator', 'resolver', 'category', 'unit'];

  constructor(
    @InjectRepository(IssueEntity)
    private readonly issueRepository: Repository<IssueEntity>,
  ) {}

  async findAll(tenantId: string): Promise<IssueEntity[]> {
    return this.issueRepository.find({
      where: { tenantId },
      relations: this.defaultRelations,
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(tenantId: string, userId: string): Promise<IssueEntity[]> {
    return this.issueRepository.find({
      where: { tenantId, createdBy: userId },
      relations: this.defaultRelations,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<IssueEntity> {
    const issue = await this.issueRepository.findOne({
      where: { id, tenantId },
      relations: this.defaultRelations,
    });
    if (!issue) {
      throw new NotFoundException(`Ocorrencia com ID ${id} nao encontrada`);
    }
    return issue;
  }

  async create(tenantId: string, dto: CreateIssueDto, userId: string): Promise<IssueEntity> {
    const issue = this.issueRepository.create({
      tenantId,
      title: dto.title,
      description: dto.description,
      categoryId: dto.categoryId || null,
      unitId: dto.unitId || null,
      priority: dto.priority || IssuePriority.MEDIUM,
      createdBy: userId,
    });
    return this.issueRepository.save(issue);
  }

  async update(id: string, tenantId: string, dto: UpdateIssueDto, userId: string): Promise<IssueEntity> {
    const issue = await this.findById(id, tenantId);

    if (dto.title !== undefined) issue.title = dto.title;
    if (dto.description !== undefined) issue.description = dto.description;
    if (dto.categoryId !== undefined) issue.categoryId = dto.categoryId;
    if (dto.priority !== undefined) issue.priority = dto.priority;

    if (dto.resolutionNote !== undefined) issue.resolutionNote = dto.resolutionNote;

    if (dto.status !== undefined) {
      issue.status = dto.status;
      if (dto.status === IssueStatus.RESOLVED || dto.status === IssueStatus.CLOSED) {
        issue.resolvedBy = userId;
        issue.resolvedAt = new Date();
      }
    }

    return this.issueRepository.save(issue);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const issue = await this.findById(id, tenantId);
    await this.issueRepository.remove(issue);
  }
}
