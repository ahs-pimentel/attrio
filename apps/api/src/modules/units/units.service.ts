import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitEntity } from './unit.entity';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { UnitStatus } from '@attrio/contracts';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
  ) {}

  async findAllByTenant(tenantId: string): Promise<UnitEntity[]> {
    return this.unitRepository.find({
      where: { tenantId },
      order: { block: 'ASC', number: 'ASC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<UnitEntity> {
    const unit = await this.unitRepository.findOne({
      where: { id, tenantId },
    });
    if (!unit) {
      throw new NotFoundException(`Unidade com ID ${id} nao encontrada`);
    }
    return unit;
  }

  async findByIdentifier(identifier: string, tenantId: string): Promise<UnitEntity | null> {
    return this.unitRepository.findOne({
      where: { identifier, tenantId },
    });
  }

  async create(tenantId: string, dto: CreateUnitDto): Promise<UnitEntity> {
    // Gerar identifier se nao informado
    const identifier = dto.identifier || `${dto.block}-${dto.number}`;

    // Verificar se identifier ja existe no tenant
    const existing = await this.findByIdentifier(identifier, tenantId);
    if (existing) {
      throw new ConflictException(`Unidade "${identifier}" ja existe neste condominio`);
    }

    const unit = this.unitRepository.create({
      tenantId,
      block: dto.block,
      number: dto.number,
      identifier,
    });

    return this.unitRepository.save(unit);
  }

  async update(id: string, tenantId: string, dto: UpdateUnitDto): Promise<UnitEntity> {
    const unit = await this.findById(id, tenantId);

    // Se estiver atualizando o identifier, verificar duplicidade
    if (dto.identifier && dto.identifier !== unit.identifier) {
      const existing = await this.findByIdentifier(dto.identifier, tenantId);
      if (existing) {
        throw new ConflictException(`Unidade "${dto.identifier}" ja existe neste condominio`);
      }
    }

    // Se atualizou block ou number e nao informou identifier, recalcular
    if ((dto.block || dto.number) && !dto.identifier) {
      const newBlock = dto.block || unit.block;
      const newNumber = dto.number || unit.number;
      const newIdentifier = `${newBlock}-${newNumber}`;

      if (newIdentifier !== unit.identifier) {
        const existing = await this.findByIdentifier(newIdentifier, tenantId);
        if (existing) {
          throw new ConflictException(`Unidade "${newIdentifier}" ja existe neste condominio`);
        }
        dto.identifier = newIdentifier;
      }
    }

    Object.assign(unit, dto);
    return this.unitRepository.save(unit);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const unit = await this.findById(id, tenantId);
    await this.unitRepository.remove(unit);
  }

  async deactivate(id: string, tenantId: string): Promise<UnitEntity> {
    return this.update(id, tenantId, { status: UnitStatus.INACTIVE });
  }

  async activate(id: string, tenantId: string): Promise<UnitEntity> {
    return this.update(id, tenantId, { status: UnitStatus.ACTIVE });
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.unitRepository.count({ where: { tenantId } });
  }
}
