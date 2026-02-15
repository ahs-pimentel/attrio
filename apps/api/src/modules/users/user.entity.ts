import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '@attrio/contracts';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserTenantEntity } from './user-tenant.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'supabase_user_id', unique: true })
  @Index('idx_users_supabase_user_id')
  supabaseUserId: string;

  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  @Index('idx_users_tenant_id')
  tenantId: string | null;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.users, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity | null;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.RESIDENT,
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => UserTenantEntity, (ut) => ut.user)
  userTenants: UserTenantEntity[];
}
