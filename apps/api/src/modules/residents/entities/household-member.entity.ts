import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RelationshipType } from '@attrio/contracts';
import { ResidentEntity } from './resident.entity';

@Entity('household_members')
export class HouseholdMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'resident_id' })
  @Index('idx_household_members_resident_id')
  residentId: string;

  @ManyToOne(() => ResidentEntity, (resident) => resident.householdMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resident_id' })
  resident: ResidentEntity;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  document: string | null; // RG ou CPF

  @Column({
    type: 'enum',
    enum: RelationshipType,
    default: RelationshipType.OTHER,
  })
  relationship: RelationshipType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
