import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AssemblyEntity } from './assembly.entity';

export enum MinutesStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
}

@Entity('assembly_minutes')
export class AssemblyMinutesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'assembly_id', unique: true })
  assemblyId: string;

  // Conteudo da ata
  @Column({ type: 'text', nullable: true })
  content: string | null;

  // Resumo gerado automaticamente
  @Column({ type: 'text', nullable: true })
  summary: string | null;

  // Transcrição da assembleia (se gravada)
  @Column({ type: 'text', nullable: true })
  transcription: string | null;

  // Status da ata
  @Column({
    type: 'enum',
    enum: MinutesStatus,
    default: MinutesStatus.DRAFT,
  })
  status: MinutesStatus;

  // URL do arquivo PDF gerado
  @Column({ type: 'varchar', name: 'pdf_url', length: 500, nullable: true })
  pdfUrl: string | null;

  // Metadados da geração
  @Column({ type: 'jsonb', name: 'vote_summary', nullable: true })
  voteSummary: Record<string, unknown> | null;

  @Column({ type: 'jsonb', name: 'attendance_summary', nullable: true })
  attendanceSummary: Record<string, unknown> | null;

  // Aprovação
  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamp with time zone', name: 'approved_at', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => AssemblyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assembly_id' })
  assembly: AssemblyEntity;
}
