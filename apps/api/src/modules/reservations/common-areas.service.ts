import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonAreaEntity } from './entities/common-area.entity';
import { CreateCommonAreaDto, UpdateCommonAreaDto } from './dto';

@Injectable()
export class CommonAreasService {
  constructor(
    @InjectRepository(CommonAreaEntity)
    private readonly areaRepository: Repository<CommonAreaEntity>,
  ) {}

  async findAll(tenantId: string, includeInactive = false): Promise<CommonAreaEntity[]> {
    const where: any = { tenantId };
    if (!includeInactive) where.active = true;
    return this.areaRepository.find({ where, order: { name: 'ASC' } });
  }

  async findById(id: string, tenantId: string): Promise<CommonAreaEntity> {
    const area = await this.areaRepository.findOne({ where: { id, tenantId } });
    if (!area) {
      throw new NotFoundException(`Area comum com ID ${id} nao encontrada`);
    }
    return area;
  }

  async create(tenantId: string, dto: CreateCommonAreaDto): Promise<CommonAreaEntity> {
    const area = this.areaRepository.create({
      tenantId,
      name: dto.name,
      description: dto.description || null,
      rules: dto.rules || null,
      maxCapacity: dto.maxCapacity || null,
    });
    return this.areaRepository.save(area);
  }

  async update(id: string, tenantId: string, dto: UpdateCommonAreaDto): Promise<CommonAreaEntity> {
    const area = await this.findById(id, tenantId);
    if (dto.name !== undefined) area.name = dto.name;
    if (dto.description !== undefined) area.description = dto.description;
    if (dto.rules !== undefined) area.rules = dto.rules;
    if (dto.maxCapacity !== undefined) area.maxCapacity = dto.maxCapacity;
    if (dto.active !== undefined) area.active = dto.active;
    return this.areaRepository.save(area);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const area = await this.findById(id, tenantId);
    await this.areaRepository.remove(area);
  }
}
