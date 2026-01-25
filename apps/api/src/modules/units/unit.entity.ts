import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UnitStatus } from '@attrio/contracts';
import { TenantEntity } from '../tenants/tenant.entity';

@Entity('units')
@Unique('UQ_units_tenant_identifier', ['tenantId', 'identifier'])
export class UnitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index('idx_units_tenant_id')
  tenantId: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ type: 'varchar', length: 50 })
  block: string;

  @Column({ type: 'varchar', length: 50 })
  number: string;

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_units_identifier')
  identifier: string;

  @Column({
    type: 'enum',
    enum: UnitStatus,
    default: UnitStatus.ACTIVE,
  })
  status: UnitStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
