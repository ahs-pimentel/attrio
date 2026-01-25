import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { AssemblyEntity } from './assembly.entity';
import { ResidentEntity } from '../../residents/entities/resident.entity';
import { UnitEntity } from '../../units/unit.entity';
import { VoteEntity } from './vote.entity';

@Entity('assembly_participants')
@Unique(['assemblyId', 'unitId']) // Uma unidade so pode ter um representante por assembleia
export class AssemblyParticipantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'assembly_id' })
  assemblyId: string;

  @Column({ type: 'uuid', name: 'unit_id' })
  unitId: string;

  @Column({ type: 'uuid', name: 'resident_id', nullable: true })
  residentId: string | null;

  @Column({ type: 'varchar', name: 'proxy_name', length: 255, nullable: true })
  proxyName: string | null; // Nome do procurador se nao for o morador

  @Column({ type: 'varchar', name: 'proxy_document', length: 20, nullable: true })
  proxyDocument: string | null; // Documento do procurador

  @Column({ name: 'joined_at', type: 'timestamp with time zone', nullable: true })
  joinedAt: Date | null;

  @Column({ name: 'left_at', type: 'timestamp with time zone', nullable: true })
  leftAt: Date | null;

  @Column({ name: 'voting_weight', type: 'decimal', precision: 5, scale: 2, default: 1 })
  votingWeight: number; // Peso do voto (pode variar por fracao ideal)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => AssemblyEntity, (assembly) => assembly.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assembly_id' })
  assembly: AssemblyEntity;

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity;

  @ManyToOne(() => ResidentEntity, { nullable: true })
  @JoinColumn({ name: 'resident_id' })
  resident: ResidentEntity | null;

  @OneToMany(() => VoteEntity, (vote) => vote.participant)
  votes: VoteEntity[];
}
