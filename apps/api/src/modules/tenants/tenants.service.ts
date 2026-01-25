import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from './tenant.entity';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  async findAll(): Promise<TenantEntity[]> {
    return this.tenantRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant com ID ${id} nao encontrado`);
    }
    return tenant;
  }

  async findBySlug(slug: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findOne({ where: { slug } });
    if (!tenant) {
      throw new NotFoundException(`Tenant com slug ${slug} nao encontrado`);
    }
    return tenant;
  }

  async create(dto: CreateTenantDto): Promise<TenantEntity> {
    // Verificar se slug ja existe
    const existing = await this.tenantRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" ja esta em uso`);
    }

    const tenant = this.tenantRepository.create(dto);
    return this.tenantRepository.save(tenant);
  }

  async update(id: string, dto: UpdateTenantDto): Promise<TenantEntity> {
    const tenant = await this.findById(id);

    // Se estiver atualizando o slug, verificar se ja existe
    if (dto.slug && dto.slug !== tenant.slug) {
      const existing = await this.tenantRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(`Slug "${dto.slug}" ja esta em uso`);
      }
    }

    Object.assign(tenant, dto);
    return this.tenantRepository.save(tenant);
  }

  async delete(id: string): Promise<void> {
    const tenant = await this.findById(id);
    await this.tenantRepository.remove(tenant);
  }

  async deactivate(id: string): Promise<TenantEntity> {
    return this.update(id, { active: false });
  }

  async activate(id: string): Promise<TenantEntity> {
    return this.update(id, { active: true });
  }
}
