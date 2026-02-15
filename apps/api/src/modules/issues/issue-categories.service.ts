import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueCategoryEntity } from './entities/issue-category.entity';
import { CreateIssueCategoryDto, UpdateIssueCategoryDto } from './dto';

@Injectable()
export class IssueCategoriesService {
  constructor(
    @InjectRepository(IssueCategoryEntity)
    private readonly categoryRepository: Repository<IssueCategoryEntity>,
  ) {}

  async findAll(tenantId: string, includeInactive = false): Promise<IssueCategoryEntity[]> {
    const where: any = { tenantId };
    if (!includeInactive) where.active = true;
    return this.categoryRepository.find({ where, order: { name: 'ASC' } });
  }

  async findById(id: string, tenantId: string): Promise<IssueCategoryEntity> {
    const category = await this.categoryRepository.findOne({ where: { id, tenantId } });
    if (!category) {
      throw new NotFoundException(`Categoria com ID ${id} nao encontrada`);
    }
    return category;
  }

  async create(tenantId: string, dto: CreateIssueCategoryDto): Promise<IssueCategoryEntity> {
    const category = this.categoryRepository.create({ tenantId, name: dto.name });
    return this.categoryRepository.save(category);
  }

  async update(id: string, tenantId: string, dto: UpdateIssueCategoryDto): Promise<IssueCategoryEntity> {
    const category = await this.findById(id, tenantId);
    if (dto.name !== undefined) category.name = dto.name;
    if (dto.active !== undefined) category.active = dto.active;
    return this.categoryRepository.save(category);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const category = await this.findById(id, tenantId);
    await this.categoryRepository.remove(category);
  }
}
