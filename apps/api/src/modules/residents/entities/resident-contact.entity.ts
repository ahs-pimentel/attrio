import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ResidentEntity } from './resident.entity';

@Entity('resident_contacts')
export class ResidentContactEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'resident_id' })
  @Index('idx_resident_contacts_resident_id')
  residentId: string;

  @ManyToOne(() => ResidentEntity, (resident) => resident.emergencyContacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resident_id' })
  resident: ResidentEntity;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'boolean', name: 'is_whatsapp', default: false })
  isWhatsApp: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
