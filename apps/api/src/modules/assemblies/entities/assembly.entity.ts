import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { AssemblyStatus } from '@attrio/contracts';
import { TenantEntity } from '../../tenants/tenant.entity';
import { AgendaItemEntity } from './agenda-item.entity';
import { AssemblyParticipantEntity } from './assembly-participant.entity';

@Entity('assemblies')
export class AssemblyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'scheduled_at', type: 'timestamp with time zone' })
  scheduledAt: Date;

  @Column({ name: 'started_at', type: 'timestamp with time zone', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'finished_at', type: 'timestamp with time zone', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'varchar', name: 'meeting_url', length: 500, nullable: true })
  meetingUrl: string | null;

  @Column({
    type: 'enum',
    enum: AssemblyStatus,
    default: AssemblyStatus.SCHEDULED,
  })
  status: AssemblyStatus;

  // Token para check-in via QR Code
  @Column({ type: 'varchar', name: 'checkin_token', length: 64, nullable: true, unique: true })
  checkinToken: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @OneToMany(() => AgendaItemEntity, (item) => item.assembly, { cascade: true })
  agendaItems: AgendaItemEntity[];

  @OneToMany(() => AssemblyParticipantEntity, (participant) => participant.assembly, { cascade: true })
  participants: AssemblyParticipantEntity[];
}
