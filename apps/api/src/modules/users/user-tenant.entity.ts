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
import { UserEntity } from './user.entity';
import { TenantEntity } from '../tenants/tenant.entity';

@Entity('user_tenants')
@Unique(['userId', 'tenantId'])
export class UserTenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index('IDX_user_tenants_user_id')
  userId: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index('IDX_user_tenants_tenant_id')
  tenantId: string;

  @ManyToOne(() => UserEntity, (user) => user.userTenants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
