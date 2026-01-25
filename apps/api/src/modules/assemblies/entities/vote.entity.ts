import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { VoteChoice } from '@attrio/contracts';
import { AgendaItemEntity } from './agenda-item.entity';
import { AssemblyParticipantEntity } from './assembly-participant.entity';

@Entity('votes')
@Unique(['agendaItemId', 'participantId']) // Um participante so vota uma vez por pauta
export class VoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'agenda_item_id' })
  agendaItemId: string;

  @Column({ type: 'uuid', name: 'participant_id' })
  participantId: string;

  @Column({
    type: 'enum',
    enum: VoteChoice,
  })
  choice: VoteChoice;

  @Column({ name: 'voting_weight', type: 'decimal', precision: 5, scale: 2, default: 1 })
  votingWeight: number; // Peso do voto no momento da votacao (snapshot)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => AgendaItemEntity, (item) => item.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agenda_item_id' })
  agendaItem: AgendaItemEntity;

  @ManyToOne(() => AssemblyParticipantEntity, (participant) => participant.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_id' })
  participant: AssemblyParticipantEntity;
}
