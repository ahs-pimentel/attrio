import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ResidentEntity,
  ResidentContactEntity,
  HouseholdMemberEntity,
  UnitEmployeeEntity,
  VehicleEntity,
  PetEntity,
} from './entities';
import { UpdateResidentDto } from './dto';
import { ResidentStatus, ResidentType, RelationshipType, PetType } from '@attrio/contracts';

@Injectable()
export class ResidentsService {
  constructor(
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
  ) {}

  async findAllByTenant(tenantId: string): Promise<ResidentEntity[]> {
    return this.residentRepository.find({
      where: { tenantId },
      relations: ['unit', 'emergencyContacts', 'householdMembers', 'employees', 'vehicles', 'pets'],
      order: { fullName: 'ASC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<ResidentEntity> {
    const resident = await this.residentRepository.findOne({
      where: { id, tenantId },
      relations: ['unit', 'emergencyContacts', 'householdMembers', 'employees', 'vehicles', 'pets'],
    });
    if (!resident) {
      throw new NotFoundException(`Morador com ID ${id} nao encontrado`);
    }
    return resident;
  }

  async findByUnit(unitId: string, tenantId: string): Promise<ResidentEntity[]> {
    return this.residentRepository.find({
      where: { unitId, tenantId },
      relations: ['emergencyContacts', 'householdMembers', 'employees', 'vehicles', 'pets'],
      order: { fullName: 'ASC' },
    });
  }

  async findByUserId(userId: string): Promise<ResidentEntity | null> {
    return this.residentRepository.findOne({
      where: { userId },
      relations: ['unit', 'tenant', 'emergencyContacts', 'householdMembers', 'employees', 'vehicles', 'pets'],
    });
  }

  async createForUser(data: {
    userId: string;
    tenantId: string;
    unitId: string;
    type: ResidentType;
    fullName: string;
    email?: string;
    phone?: string;
    cpf?: string;
    rg?: string;
  }): Promise<ResidentEntity> {
    const existing = await this.findByUserId(data.userId);
    if (existing) {
      throw new ConflictException('Usuario ja possui um cadastro de morador');
    }

    const resident = this.residentRepository.create({
      ...data,
      status: ResidentStatus.ACTIVE,
      dataConsent: true,
      dataConsentAt: new Date(),
    });
    const saved = await this.residentRepository.save(resident);
    return this.findByUserId(data.userId) as Promise<ResidentEntity>;
  }

  async update(id: string, tenantId: string, dto: UpdateResidentDto): Promise<ResidentEntity> {
    const resident = await this.findById(id, tenantId);
    Object.assign(resident, dto);
    return this.residentRepository.save(resident);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const resident = await this.findById(id, tenantId);
    await this.residentRepository.remove(resident);
  }

  async deactivate(id: string, tenantId: string): Promise<ResidentEntity> {
    return this.update(id, tenantId, { status: ResidentStatus.INACTIVE });
  }

  async activate(id: string, tenantId: string): Promise<ResidentEntity> {
    return this.update(id, tenantId, { status: ResidentStatus.ACTIVE });
  }

  // Métodos para sub-entidades
  async addEmergencyContact(
    residentId: string,
    data: { name: string; phone: string; isWhatsApp: boolean },
  ): Promise<ResidentContactEntity> {
    const contact = this.contactRepository.create({ residentId, ...data });
    return this.contactRepository.save(contact);
  }

  async removeEmergencyContact(contactId: string): Promise<void> {
    await this.contactRepository.delete(contactId);
  }

  async addHouseholdMember(
    residentId: string,
    data: { name: string; email?: string; document?: string; relationship: RelationshipType },
  ): Promise<HouseholdMemberEntity> {
    const member = this.memberRepository.create({ residentId, ...data });
    return this.memberRepository.save(member);
  }

  async removeHouseholdMember(memberId: string): Promise<void> {
    await this.memberRepository.delete(memberId);
  }

  async addEmployee(
    residentId: string,
    data: { name: string; document?: string },
  ): Promise<UnitEmployeeEntity> {
    const employee = this.employeeRepository.create({ residentId, ...data });
    return this.employeeRepository.save(employee);
  }

  async removeEmployee(employeeId: string): Promise<void> {
    await this.employeeRepository.delete(employeeId);
  }

  async addVehicle(
    residentId: string,
    data: { brand: string; model: string; color: string; plate: string },
  ): Promise<VehicleEntity> {
    const vehicle = this.vehicleRepository.create({ residentId, ...data });
    return this.vehicleRepository.save(vehicle);
  }

  async removeVehicle(vehicleId: string): Promise<void> {
    await this.vehicleRepository.delete(vehicleId);
  }

  async addPet(
    residentId: string,
    data: { name: string; type: PetType; breed?: string; color?: string },
  ): Promise<PetEntity> {
    const pet = this.petRepository.create({ residentId, ...data });
    return this.petRepository.save(pet);
  }

  async removePet(petId: string): Promise<void> {
    await this.petRepository.delete(petId);
  }
}
