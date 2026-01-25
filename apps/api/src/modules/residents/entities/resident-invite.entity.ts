import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { InviteStatus } from '@attrio/contracts';
import { TenantEntity } from '../../tenants/tenant.entity';
import { UnitEntity } from '../../units/unit.entity';

@Entity('resident_invites')
export class ResidentInviteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index('idx_resident_invites_tenant_id')
  tenantId: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ type: 'uuid', name: 'unit_id' })
  @Index('idx_resident_invites_unit_id')
  unitId: string;

  @ManyToOne(() => UnitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity;

  // Dados básicos do convite
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  // Token único para o link de convite
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_resident_invites_token')
  token: string;

  @Column({
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.PENDING,
  })
  status: InviteStatus;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', name: 'accepted_at', nullable: true })
  acceptedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
