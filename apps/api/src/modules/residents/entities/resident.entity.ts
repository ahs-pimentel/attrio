import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ResidentStatus, ResidentType } from '@attrio/contracts';
import { TenantEntity } from '../../tenants/tenant.entity';
import { UnitEntity } from '../../units/unit.entity';
import { UserEntity } from '../../users/user.entity';
import { ResidentContactEntity } from './resident-contact.entity';
import { HouseholdMemberEntity } from './household-member.entity';
import { UnitEmployeeEntity } from './unit-employee.entity';
import { VehicleEntity } from './vehicle.entity';
import { PetEntity } from './pet.entity';

@Entity('residents')
export class ResidentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index('idx_residents_tenant_id')
  tenantId: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ type: 'uuid', name: 'unit_id' })
  @Index('idx_residents_unit_id')
  unitId: string;

  @ManyToOne(() => UnitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  @Index('idx_residents_user_id')
  userId: string | null;

  @OneToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity | null;

  // Tipo: Proprietário ou Inquilino
  @Column({
    type: 'enum',
    enum: ResidentType,
    default: ResidentType.OWNER,
  })
  type: ResidentType;

  // Dados pessoais
  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rg: string | null;

  @Column({ type: 'varchar', length: 14, nullable: true })
  cpf: string | null;

  @Column({ type: 'date', name: 'move_in_date', nullable: true })
  moveInDate: Date | null;

  // Dados do proprietário/imobiliária (quando inquilino)
  @Column({ type: 'varchar', length: 255, name: 'landlord_name', nullable: true })
  landlordName: string | null;

  @Column({ type: 'varchar', length: 20, name: 'landlord_phone', nullable: true })
  landlordPhone: string | null;

  @Column({ type: 'varchar', length: 255, name: 'landlord_email', nullable: true })
  landlordEmail: string | null;

  @Column({ type: 'varchar', length: 500, name: 'contract_file_url', nullable: true })
  contractFileUrl: string | null;

  // Autorização LGPD
  @Column({ type: 'boolean', name: 'data_consent', default: false })
  dataConsent: boolean;

  @Column({ type: 'timestamptz', name: 'data_consent_at', nullable: true })
  dataConsentAt: Date | null;

  @Column({
    type: 'enum',
    enum: ResidentStatus,
    default: ResidentStatus.ACTIVE,
  })
  status: ResidentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relacionamentos
  @OneToMany(() => ResidentContactEntity, (contact) => contact.resident)
  emergencyContacts: ResidentContactEntity[];

  @OneToMany(() => HouseholdMemberEntity, (member) => member.resident)
  householdMembers: HouseholdMemberEntity[];

  @OneToMany(() => UnitEmployeeEntity, (employee) => employee.resident)
  employees: UnitEmployeeEntity[];

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.resident)
  vehicles: VehicleEntity[];

  @OneToMany(() => PetEntity, (pet) => pet.resident)
  pets: PetEntity[];
}
