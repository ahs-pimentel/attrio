import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { SubscriptionPlan, SubscriptionStatus } from '@attrio/contracts';

@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_tenants_slug')
  slug: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'varchar', length: 50, default: SubscriptionPlan.STARTER })
  plan: SubscriptionPlan;

  @Column({ type: 'varchar', length: 50, name: 'subscription_status', default: SubscriptionStatus.ACTIVE })
  subscriptionStatus: SubscriptionStatus;

  @Column({ type: 'varchar', length: 255, name: 'stripe_customer_id', nullable: true, unique: true })
  @Index('idx_tenants_stripe_customer_id')
  stripeCustomerId: string | null;

  @Column({ type: 'varchar', length: 255, name: 'stripe_subscription_id', nullable: true, unique: true })
  stripeSubscriptionId: string | null;

  @Column({ type: 'integer', name: 'max_units', default: 30 })
  maxUnits: number;

  @Column({ type: 'timestamptz', name: 'trial_ends_at', nullable: true })
  trialEndsAt: Date | null;

  @Column({ type: 'timestamptz', name: 'current_period_end', nullable: true })
  currentPeriodEnd: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => UserEntity, (user) => user.tenant)
  users: UserEntity[];
}
