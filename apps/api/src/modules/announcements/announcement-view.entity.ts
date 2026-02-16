import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { AnnouncementEntity } from './announcement.entity';
import { UserEntity } from '../users/user.entity';

@Entity('announcement_views')
@Unique(['announcementId', 'userId'])
export class AnnouncementViewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'announcement_id' })
  announcementId: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => AnnouncementEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'announcement_id' })
  announcement: AnnouncementEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
