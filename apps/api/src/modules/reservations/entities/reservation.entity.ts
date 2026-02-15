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
import { ReservationStatus } from '@attrio/contracts';
import { TenantEntity } from '../../tenants/tenant.entity';
import { UserEntity } from '../../users/user.entity';
import { CommonAreaEntity } from './common-area.entity';

@Entity('reservations')
export class ReservationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Index()
  @Column({ type: 'uuid', name: 'common_area_id' })
  commonAreaId: string;

  @Index()
  @Column({ type: 'uuid', name: 'reserved_by' })
  reservedBy: string;

  @Index()
  @Column({ type: 'date', name: 'reservation_date' })
  reservationDate: string;

  @Index()
  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.PENDING })
  status: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @ManyToOne(() => CommonAreaEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'common_area_id' })
  commonArea: CommonAreaEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reserved_by' })
  reservedByUser: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approvedByUser: UserEntity | null;
}
