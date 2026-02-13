import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssemblyParticipantEntity, AssemblyEntity } from './entities';
import { RegisterParticipantDto, UpdateParticipantDto } from './dto';
import { AssemblyStatus } from '@attrio/contracts';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(AssemblyParticipantEntity)
    private readonly participantRepository: Repository<AssemblyParticipantEntity>,
    @InjectRepository(AssemblyEntity)
    private readonly assemblyRepository: Repository<AssemblyEntity>,
  ) {}

  async findByAssembly(assemblyId: string): Promise<(AssemblyParticipantEntity & { unitIdentifier?: string; residentName?: string })[]> {
    const participants = await this.participantRepository.find({
      where: { assemblyId },
      relations: ['unit', 'resident'],
      order: { createdAt: 'ASC' },
    });

    // Transform to include flat fields for frontend
    return participants.map(p => ({
      ...p,
      unitIdentifier: p.unit?.identifier || undefined,
      residentName: p.resident?.fullName || undefined,
    }));
  }

  async findById(id: string): Promise<AssemblyParticipantEntity & { unitIdentifier?: string; residentName?: string }> {
    const participant = await this.participantRepository.findOne({
      where: { id },
      relations: ['unit', 'resident', 'assembly'],
    });
    if (!participant) {
      throw new NotFoundException(`Participante com ID ${id} nao encontrado`);
    }
    return {
      ...participant,
      unitIdentifier: participant.unit?.identifier || undefined,
      residentName: participant.resident?.fullName || undefined,
    };
  }

  async findByUnitAndAssembly(unitId: string, assemblyId: string): Promise<AssemblyParticipantEntity | null> {
    return this.participantRepository.findOne({
      where: { unitId, assemblyId },
      relations: ['unit', 'resident'],
    });
  }

  async register(
    assemblyId: string,
    tenantId: string,
    dto: RegisterParticipantDto,
  ): Promise<AssemblyParticipantEntity & { unitIdentifier?: string; residentName?: string }> {
    // Verificar se a assembleia existe e pertence ao tenant
    const assembly = await this.assemblyRepository.findOne({
      where: { id: assemblyId, tenantId },
    });

    if (!assembly) {
      throw new NotFoundException(`Assembleia com ID ${assemblyId} nao encontrada`);
    }

    if (assembly.status === AssemblyStatus.FINISHED || assembly.status === AssemblyStatus.CANCELLED) {
      throw new BadRequestException('Nao e possivel registrar participantes em assembleia finalizada ou cancelada');
    }

    // Verificar se a unidade ja esta registrada
    const existingParticipant = await this.findByUnitAndAssembly(dto.unitId, assemblyId);
    if (existingParticipant) {
      throw new ConflictException('Esta unidade ja possui um representante registrado nesta assembleia');
    }

    // Validar que se nao tem residentId, deve ter proxyName
    if (!dto.residentId && !dto.proxyName) {
      throw new BadRequestException('Informe o morador ou os dados do procurador');
    }

    const participant = this.participantRepository.create({
      assemblyId,
      unitId: dto.unitId,
      residentId: dto.residentId,
      proxyName: dto.proxyName,
      proxyDocument: dto.proxyDocument,
      votingWeight: dto.votingWeight ?? 1,
    });

    const saved = await this.participantRepository.save(participant);
    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdateParticipantDto): Promise<AssemblyParticipantEntity & { unitIdentifier?: string; residentName?: string }> {
    const participant = await this.findById(id);

    if (participant.assembly.status === AssemblyStatus.FINISHED) {
      throw new BadRequestException('Nao e possivel alterar participante de assembleia finalizada');
    }

    if (dto.proxyName !== undefined) participant.proxyName = dto.proxyName;
    if (dto.proxyDocument !== undefined) participant.proxyDocument = dto.proxyDocument;
    if (dto.votingWeight !== undefined) participant.votingWeight = dto.votingWeight;

    await this.participantRepository.save(participant);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const participant = await this.findById(id);

    if (participant.assembly.status === AssemblyStatus.FINISHED) {
      throw new BadRequestException('Nao e possivel remover participante de assembleia finalizada');
    }

    // Verificar se ja votou
    if (participant.votes && participant.votes.length > 0) {
      throw new BadRequestException('Nao e possivel remover participante que ja votou');
    }

    await this.participantRepository.remove(participant);
  }

  async markJoined(id: string): Promise<AssemblyParticipantEntity & { unitIdentifier?: string; residentName?: string }> {
    const participant = await this.findById(id);

    if (participant.assembly.status !== AssemblyStatus.IN_PROGRESS) {
      throw new BadRequestException('A assembleia precisa estar em andamento');
    }

    participant.joinedAt = new Date();
    await this.participantRepository.save(participant);
    return this.findById(id);
  }

  async markLeft(id: string): Promise<AssemblyParticipantEntity & { unitIdentifier?: string; residentName?: string }> {
    const participant = await this.findById(id);
    participant.leftAt = new Date();
    await this.participantRepository.save(participant);
    return this.findById(id);
  }

  async getAttendanceStats(assemblyId: string): Promise<{
    registered: number;
    joined: number;
    left: number;
    present: number;
    totalWeight: number;
    presentWeight: number;
  }> {
    const participants = await this.findByAssembly(assemblyId);

    const stats = {
      registered: participants.length,
      joined: 0,
      left: 0,
      present: 0,
      totalWeight: 0,
      presentWeight: 0,
    };

    for (const p of participants) {
      const weight = Number(p.votingWeight);
      stats.totalWeight += weight;

      if (p.joinedAt) {
        stats.joined++;
        if (!p.leftAt) {
          stats.present++;
          stats.presentWeight += weight;
        } else {
          stats.left++;
        }
      }
    }

    return stats;
  }
}
