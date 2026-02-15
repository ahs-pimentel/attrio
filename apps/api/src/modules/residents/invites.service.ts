import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { randomBytes } from 'crypto';
import {
  ResidentEntity,
  ResidentContactEntity,
  HouseholdMemberEntity,
  UnitEmployeeEntity,
  VehicleEntity,
  PetEntity,
  ResidentInviteEntity,
} from './entities';
import { CreateInviteDto, CompleteResidentRegistrationDto } from './dto';
import { InviteStatus, ResidentStatus } from '@attrio/contracts';
import { UsersService } from '../users/users.service';
import { UnitsService } from '../units/units.service';
import { TenantsService } from '../tenants/tenants.service';
import { EmailService } from '../../core/email/email.service';
import { supabaseAdmin } from '../../core/supabase/supabase-admin';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(ResidentInviteEntity)
    private readonly inviteRepository: Repository<ResidentInviteEntity>,
    @InjectRepository(ResidentEntity)
    private readonly residentRepository: Repository<ResidentEntity>,
    @InjectRepository(ResidentContactEntity)
    private readonly contactRepository: Repository<ResidentContactEntity>,
    @InjectRepository(HouseholdMemberEntity)
    private readonly memberRepository: Repository<HouseholdMemberEntity>,
    @InjectRepository(UnitEmployeeEntity)
    private readonly employeeRepository: Repository<UnitEmployeeEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    private readonly usersService: UsersService,
    private readonly unitsService: UnitsService,
    private readonly tenantsService: TenantsService,
    private readonly emailService: EmailService,
  ) {}

  async createInvite(tenantId: string, dto: CreateInviteDto): Promise<ResidentInviteEntity> {
    // Verificar se a unidade existe
    const unit = await this.unitsService.findById(dto.unitId, tenantId);

    // Verificar se já existe um convite pendente para esse email/unidade
    const existingInvite = await this.inviteRepository.findOne({
      where: {
        unitId: dto.unitId,
        email: dto.email,
        status: InviteStatus.PENDING,
      },
    });

    if (existingInvite) {
      throw new ConflictException('Ja existe um convite pendente para este email nesta unidade');
    }

    // Gerar token único
    const token = randomBytes(32).toString('hex');

    // Criar convite com validade de 7 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = this.inviteRepository.create({
      tenantId,
      unitId: dto.unitId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      token,
      expiresAt,
    });

    const savedInvite = await this.inviteRepository.save(invite);

    // Enviar email de convite
    const tenant = await this.tenantsService.findById(tenantId);
    await this.emailService.sendInviteEmail({
      to: dto.email,
      residentName: dto.name,
      tenantName: tenant.name,
      unitIdentifier: unit.identifier,
      inviteToken: token,
    });

    // Retornar com relacoes
    return this.inviteRepository.findOne({
      where: { id: savedInvite.id },
      relations: ['unit'],
    }) as Promise<ResidentInviteEntity>;
  }

  async findAllByTenant(tenantId: string): Promise<ResidentInviteEntity[]> {
    return this.inviteRepository.find({
      where: { tenantId },
      relations: ['unit'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByToken(token: string): Promise<ResidentInviteEntity | null> {
    return this.inviteRepository.findOne({
      where: { token },
      relations: ['unit', 'tenant'],
    });
  }

  async validateInvite(token: string): Promise<{
    valid: boolean;
    invite?: ResidentInviteEntity;
    error?: string;
  }> {
    const invite = await this.findByToken(token);

    if (!invite) {
      return { valid: false, error: 'Convite nao encontrado' };
    }

    if (invite.status === InviteStatus.ACCEPTED) {
      return { valid: false, error: 'Este convite ja foi utilizado' };
    }

    if (invite.status === InviteStatus.EXPIRED || invite.expiresAt < new Date()) {
      // Marcar como expirado se ainda não estiver
      if (invite.status !== InviteStatus.EXPIRED) {
        invite.status = InviteStatus.EXPIRED;
        await this.inviteRepository.save(invite);
      }
      return { valid: false, error: 'Este convite expirou' };
    }

    return { valid: true, invite };
  }

  async completeRegistration(dto: CompleteResidentRegistrationDto): Promise<ResidentEntity> {
    // Validar convite
    const { valid, invite, error } = await this.validateInvite(dto.inviteToken);
    if (!valid || !invite) {
      throw new BadRequestException(error || 'Convite invalido');
    }

    // Usar email/phone do DTO se fornecidos, senao do convite
    const finalEmail = dto.email || invite.email;
    const finalPhone = dto.phone || invite.phone;

    // Criar usuário no Supabase
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: finalEmail,
      password: dto.password,
      email_confirm: true,
      user_metadata: {
        name: dto.fullName,
      },
    });

    if (authError || !authUser.user) {
      throw new BadRequestException(authError?.message || 'Erro ao criar usuario');
    }

    // Criar usuário no banco local
    const dbUser = await this.usersService.createOrUpdate({
      supabaseUserId: authUser.user.id,
      email: finalEmail,
      name: dto.fullName,
      tenantId: invite.tenantId,
    });

    // Criar morador
    const resident = this.residentRepository.create({
      tenantId: invite.tenantId,
      unitId: invite.unitId,
      userId: dbUser.id,
      type: dto.type,
      fullName: dto.fullName,
      email: finalEmail,
      phone: finalPhone,
      rg: dto.rg,
      cpf: dto.cpf,
      moveInDate: dto.moveInDate ? new Date(dto.moveInDate) : null,
      landlordName: dto.landlordName,
      landlordPhone: dto.landlordPhone,
      landlordEmail: dto.landlordEmail,
      dataConsent: dto.dataConsent,
      dataConsentAt: dto.dataConsent ? new Date() : null,
    });

    const savedResident = await this.residentRepository.save(resident);

    // Criar sub-entidades
    if (dto.emergencyContacts?.length) {
      const contacts = dto.emergencyContacts.map((c) =>
        this.contactRepository.create({ residentId: savedResident.id, ...c }),
      );
      await this.contactRepository.save(contacts);
    }

    if (dto.householdMembers?.length) {
      const members = dto.householdMembers.map((m) =>
        this.memberRepository.create({ residentId: savedResident.id, ...m }),
      );
      await this.memberRepository.save(members);
    }

    if (dto.employees?.length) {
      const employees = dto.employees.map((e) =>
        this.employeeRepository.create({ residentId: savedResident.id, ...e }),
      );
      await this.employeeRepository.save(employees);
    }

    if (dto.vehicles?.length) {
      const vehicles = dto.vehicles.map((v) =>
        this.vehicleRepository.create({ residentId: savedResident.id, ...v }),
      );
      await this.vehicleRepository.save(vehicles);
    }

    if (dto.pets?.length) {
      const pets = dto.pets.map((p) =>
        this.petRepository.create({ residentId: savedResident.id, ...p }),
      );
      await this.petRepository.save(pets);
    }

    // Marcar convite como aceito
    invite.status = InviteStatus.ACCEPTED;
    invite.acceptedAt = new Date();
    await this.inviteRepository.save(invite);

    // Retornar morador com relacionamentos
    return this.residentRepository.findOne({
      where: { id: savedResident.id },
      relations: ['emergencyContacts', 'householdMembers', 'employees', 'vehicles', 'pets'],
    }) as Promise<ResidentEntity>;
  }

  async resendInvite(id: string, tenantId: string): Promise<ResidentInviteEntity> {
    const invite = await this.inviteRepository.findOne({
      where: { id, tenantId },
      relations: ['unit'],
    });

    if (!invite) {
      throw new NotFoundException('Convite nao encontrado');
    }

    if (invite.status === InviteStatus.ACCEPTED) {
      throw new BadRequestException('Este convite ja foi aceito');
    }

    // Gerar novo token e nova data de expiração
    invite.token = randomBytes(32).toString('hex');
    invite.expiresAt = new Date();
    invite.expiresAt.setDate(invite.expiresAt.getDate() + 7);
    invite.status = InviteStatus.PENDING;

    const savedInvite = await this.inviteRepository.save(invite);

    // Reenviar email
    const tenant = await this.tenantsService.findById(tenantId);
    await this.emailService.sendInviteEmail({
      to: invite.email,
      residentName: invite.name,
      tenantName: tenant.name,
      unitIdentifier: invite.unit?.identifier || '',
      inviteToken: invite.token,
    });

    return savedInvite;
  }

  async cancelInvite(id: string, tenantId: string): Promise<void> {
    const invite = await this.inviteRepository.findOne({
      where: { id, tenantId },
    });

    if (!invite) {
      throw new NotFoundException('Convite nao encontrado');
    }

    if (invite.status === InviteStatus.ACCEPTED) {
      throw new BadRequestException('Nao e possivel cancelar um convite ja aceito');
    }

    await this.inviteRepository.remove(invite);
  }
}
