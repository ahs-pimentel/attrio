import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PetType } from '@attrio/contracts';
import { ResidentEntity } from './resident.entity';

@Entity('pets')
export class PetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'resident_id' })
  @Index('idx_pets_resident_id')
  residentId: string;

  @ManyToOne(() => ResidentEntity, (resident) => resident.pets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resident_id' })
  resident: ResidentEntity;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: PetType,
    default: PetType.DOG,
  })
  type: PetType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  breed: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
