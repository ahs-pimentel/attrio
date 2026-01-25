import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { AssemblyEntity, AssemblyParticipantEntity } from './entities';
import { CheckinRequestDto, AttendanceStatusDto, QrCodeDataDto } from './dto/attendance.dto';
import { AssemblyStatus } from '@attrio/contracts';
import { UnitEntity } from '../units/unit.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AssemblyEntity)
    private readonly assemblyRepository: Repository<AssemblyEntity>,
    @InjectRepository(AssemblyParticipantEntity)
    private readonly participantRepository: Repository<AssemblyParticipantEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
  ) {}

  /**
   * Gera um token de check-in para a assembleia
   */
  async generateCheckinToken(assemblyId: string, tenantId: string): Promise<QrCodeDataDto> {
    const assembly = await this.assemblyRepository.findOne({
      where: { id: assemblyId, tenantId },
    });

    if (!assembly) {
      throw new NotFoundException(`Assembleia com ID ${assemblyId} nao encontrada`);
    }

    // Gera token unico
    const token = randomBytes(32).toString('hex');
    assembly.checkinToken = token;
    await this.assemblyRepository.save(assembly);

    return {
      checkinToken: token,
      checkinUrl: `/api/assemblies/checkin/${token}`,
      assemblyId: assembly.id,
      assemblyTitle: assembly.title,
    };
  }

  /**
   * Realiza check-in de um participante via token do QR Code
   */
  async checkin(dto: CheckinRequestDto): Promise<{
    success: boolean;
    participantId: string;
    assemblyId: string;
    assemblyTitle: string;
    unitIdentifier: string;
    checkinTime: Date;
    message?: string;
  }> {
    // Busca assembleia pelo token
    const assembly = await this.assemblyRepository.findOne({
      where: { checkinToken: dto.checkinToken },
      relations: ['tenant'],
    });

    if (!assembly) {
      throw new NotFoundException('Token de check-in invalido');
    }

    // Valida status da assembleia
    if (assembly.status === AssemblyStatus.FINISHED) {
      throw new BadRequestException('Esta assembleia ja foi finalizada');
    }

    if (assembly.status === AssemblyStatus.CANCELLED) {
      throw new BadRequestException('Esta assembleia foi cancelada');
    }

    // Busca a unidade
    const unit = await this.unitRepository.findOne({
      where: { id: dto.unitId, tenantId: assembly.tenantId },
    });

    if (!unit) {
      throw new NotFoundException('Unidade nao encontrada ou nao pertence a este condominio');
    }

    // Valida dados do participante
    if (!dto.residentId && !dto.proxyName) {
      throw new BadRequestException('Informe o morador ou os dados do procurador');
    }

    // Verifica se a unidade ja tem participante registrado
    let participant = await this.participantRepository.findOne({
      where: { assemblyId: assembly.id, unitId: dto.unitId },
    });

    if (participant) {
      // Ja registrado - apenas faz check-in
      if (participant.joinedAt && !participant.leftAt) {
        throw new ConflictException('Esta unidade ja fez check-in e ainda esta presente');
      }

      // Re-entry (voltou apos sair)
      participant.joinedAt = new Date();
      participant.leftAt = null;

      // Atualiza dados do procurador se informado
      if (dto.proxyName) {
        participant.proxyName = dto.proxyName;
        participant.proxyDocument = dto.proxyDocument || null;
      }
    } else {
      // Novo participante
      participant = this.participantRepository.create({
        assemblyId: assembly.id,
        unitId: dto.unitId,
        residentId: dto.residentId || null,
        proxyName: dto.proxyName || null,
        proxyDocument: dto.proxyDocument || null,
        joinedAt: new Date(),
        votingWeight: 1, // Pode ser ajustado conforme fracao ideal
      });
    }

    await this.participantRepository.save(participant);

    return {
      success: true,
      participantId: participant.id,
      assemblyId: assembly.id,
      assemblyTitle: assembly.title,
      unitIdentifier: unit.identifier,
      checkinTime: participant.joinedAt!,
      message: 'Check-in realizado com sucesso',
    };
  }

  /**
   * Realiza checkout de um participante
   */
  async checkout(checkinToken: string, participantId: string): Promise<{
    success: boolean;
    checkoutTime: Date;
  }> {
    // Valida token
    const assembly = await this.assemblyRepository.findOne({
      where: { checkinToken },
    });

    if (!assembly) {
      throw new NotFoundException('Token de check-in invalido');
    }

    const participant = await this.participantRepository.findOne({
      where: { id: participantId, assemblyId: assembly.id },
    });

    if (!participant) {
      throw new NotFoundException('Participante nao encontrado');
    }

    if (!participant.joinedAt) {
      throw new BadRequestException('Participante nao fez check-in');
    }

    if (participant.leftAt) {
      throw new BadRequestException('Participante ja fez checkout');
    }

    participant.leftAt = new Date();
    await this.participantRepository.save(participant);

    return {
      success: true,
      checkoutTime: participant.leftAt,
    };
  }

  /**
   * Obtem status de presenca da assembleia
   */
  async getAttendanceStatus(assemblyId: string, tenantId: string): Promise<AttendanceStatusDto> {
    const assembly = await this.assemblyRepository.findOne({
      where: { id: assemblyId, tenantId },
    });

    if (!assembly) {
      throw new NotFoundException(`Assembleia com ID ${assemblyId} nao encontrada`);
    }

    // Conta total de unidades do condominio
    const totalUnits = await this.unitRepository.count({
      where: { tenantId },
    });

    // Busca participantes
    const participants = await this.participantRepository.find({
      where: { assemblyId },
    });

    let checkedIn = 0;
    let checkedOut = 0;
    let currentlyPresent = 0;
    let totalVotingWeight = 0;
    let presentVotingWeight = 0;

    for (const p of participants) {
      totalVotingWeight += Number(p.votingWeight);

      if (p.joinedAt) {
        checkedIn++;
        if (p.leftAt) {
          checkedOut++;
        } else {
          currentlyPresent++;
          presentVotingWeight += Number(p.votingWeight);
        }
      }
    }

    const quorumPercentage = totalUnits > 0
      ? (currentlyPresent / totalUnits) * 100
      : 0;

    return {
      assemblyId: assembly.id,
      assemblyTitle: assembly.title,
      status: assembly.status,
      totalUnits,
      registeredParticipants: participants.length,
      checkedIn,
      checkedOut,
      currentlyPresent,
      quorumPercentage: Math.round(quorumPercentage * 100) / 100,
      totalVotingWeight,
      presentVotingWeight,
    };
  }

  /**
   * Lista participantes presentes na assembleia
   */
  async getPresentParticipants(assemblyId: string): Promise<AssemblyParticipantEntity[]> {
    return this.participantRepository.find({
      where: { assemblyId },
      relations: ['unit', 'resident'],
      order: { joinedAt: 'ASC' },
    });
  }

  /**
   * Valida se um token de check-in e valido e retorna info da assembleia
   */
  async validateCheckinToken(token: string): Promise<{
    valid: boolean;
    assembly?: {
      id: string;
      title: string;
      status: AssemblyStatus;
      scheduledAt: Date;
      tenantName: string;
    };
  }> {
    const assembly = await this.assemblyRepository.findOne({
      where: { checkinToken: token },
      relations: ['tenant'],
    });

    if (!assembly) {
      return { valid: false };
    }

    return {
      valid: true,
      assembly: {
        id: assembly.id,
        title: assembly.title,
        status: assembly.status,
        scheduledAt: assembly.scheduledAt,
        tenantName: assembly.tenant?.name || '',
      },
    };
  }
}
