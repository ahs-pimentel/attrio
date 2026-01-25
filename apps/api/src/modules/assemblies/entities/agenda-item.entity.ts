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
import { AgendaItemStatus } from '@attrio/contracts';
import { AssemblyEntity } from './assembly.entity';
import { VoteEntity } from './vote.entity';

@Entity('agenda_items')
export class AgendaItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'assembly_id' })
  assemblyId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @Column({
    type: 'enum',
    enum: AgendaItemStatus,
    default: AgendaItemStatus.PENDING,
  })
  status: AgendaItemStatus;

  @Column({ name: 'requires_quorum', type: 'boolean', default: true })
  requiresQuorum: boolean;

  @Column({ type: 'varchar', name: 'quorum_type', length: 50, default: 'simple' })
  quorumType: string; // 'simple' (maioria simples), 'qualified' (2/3), 'unanimous'

  @Column({ name: 'voting_started_at', type: 'timestamp with time zone', nullable: true })
  votingStartedAt: Date | null;

  @Column({ name: 'voting_ended_at', type: 'timestamp with time zone', nullable: true })
  votingEndedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  result: string | null; // Texto descritivo do resultado

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => AssemblyEntity, (assembly) => assembly.agendaItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assembly_id' })
  assembly: AssemblyEntity;

  @OneToMany(() => VoteEntity, (vote) => vote.agendaItem)
  votes: VoteEntity[];
}
