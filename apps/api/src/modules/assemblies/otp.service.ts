import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { AssemblyEntity } from './entities/assembly.entity';
import { AgendaItemEntity } from './entities/agenda-item.entity';
import { AssemblyStatus, AgendaItemStatus } from '@attrio/contracts';

// Configuracoes de OTP
const OTP_LENGTH = 6;
const ASSEMBLY_OTP_EXPIRY_MINUTES = 10;
const VOTING_OTP_EXPIRY_MINUTES = 5;

export interface OtpData {
  otp: string;
  expiresAt: Date;
  generatedAt: Date;
  remainingSeconds: number;
}

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(AssemblyEntity)
    private readonly assemblyRepository: Repository<AssemblyEntity>,
    @InjectRepository(AgendaItemEntity)
    private readonly agendaItemRepository: Repository<AgendaItemEntity>,
  ) {}

  /**
   * Gera um codigo OTP de 6 digitos
   */
  private generateOtpCode(): string {
    // Gera numero aleatorio de 6 digitos (100000-999999)
    const otp = randomInt(100000, 999999);
    return otp.toString().padStart(OTP_LENGTH, '0');
  }

  // ==================== OTP de Assembleia (Check-in) ====================

  /**
   * Gera novo OTP para check-in da assembleia
   */
  async generateAssemblyOtp(assemblyId: string, tenantId: string): Promise<OtpData> {
    const assembly = await this.assemblyRepository.findOne({
      where: { id: assemblyId, tenantId },
    });

    if (!assembly) {
      throw new NotFoundException(`Assembleia com ID ${assemblyId} nao encontrada`);
    }

    // Valida que assembleia nao esta finalizada ou cancelada
    if (assembly.status === AssemblyStatus.FINISHED || assembly.status === AssemblyStatus.CANCELLED) {
      throw new BadRequestException('Nao e possivel gerar OTP para assembleia finalizada ou cancelada');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ASSEMBLY_OTP_EXPIRY_MINUTES * 60 * 1000);
    const otp = this.generateOtpCode();

    assembly.currentOtp = otp;
    assembly.otpGeneratedAt = now;
    assembly.otpExpiresAt = expiresAt;

    await this.assemblyRepository.save(assembly);

    return {
      otp,
      generatedAt: now,
      expiresAt,
      remainingSeconds: ASSEMBLY_OTP_EXPIRY_MINUTES * 60,
    };
  }

  /**
   * Obtem OTP atual da assembleia (para exibicao pelo sindico)
   */
  async getAssemblyOtp(assemblyId: string, tenantId: string): Promise<OtpData | null> {
    const assembly = await this.assemblyRepository.findOne({
      where: { id: assemblyId, tenantId },
    });

    if (!assembly) {
      throw new NotFoundException(`Assembleia com ID ${assemblyId} nao encontrada`);
    }

    if (!assembly.currentOtp || !assembly.otpExpiresAt) {
      return null;
    }

    const now = new Date();
    const remainingMs = assembly.otpExpiresAt.getTime() - now.getTime();

    // Se expirado, retorna null
    if (remainingMs <= 0) {
      return null;
    }

    return {
      otp: assembly.currentOtp,
      generatedAt: assembly.otpGeneratedAt!,
      expiresAt: assembly.otpExpiresAt,
      remainingSeconds: Math.ceil(remainingMs / 1000),
    };
  }

  /**
   * Valida OTP de check-in da assembleia
   */
  async validateAssemblyOtp(assemblyId: string, otp: string): Promise<boolean> {
    const assembly = await this.assemblyRepository.findOne({
      where: { id: assemblyId },
    });

    if (!assembly) {
      return false;
    }

    // Verifica se tem OTP definido
    if (!assembly.currentOtp || !assembly.otpExpiresAt) {
      return false;
    }

    // Verifica se OTP expirou
    const now = new Date();
    if (now > assembly.otpExpiresAt) {
      return false;
    }

    // Verifica se OTP esta correto (comparacao case-insensitive)
    return assembly.currentOtp === otp;
  }

  /**
   * Valida OTP pelo token de checkin (para uso publico)
   */
  async validateAssemblyOtpByToken(checkinToken: string, otp: string): Promise<{ valid: boolean; assemblyId?: string }> {
    const assembly = await this.assemblyRepository.findOne({
      where: { checkinToken },
    });

    if (!assembly) {
      return { valid: false };
    }

    // Verifica se tem OTP definido
    if (!assembly.currentOtp || !assembly.otpExpiresAt) {
      return { valid: false };
    }

    // Verifica se OTP expirou
    const now = new Date();
    if (now > assembly.otpExpiresAt) {
      return { valid: false };
    }

    // Verifica se OTP esta correto
    if (assembly.currentOtp !== otp) {
      return { valid: false };
    }

    return { valid: true, assemblyId: assembly.id };
  }

  // ==================== OTP de Pauta (Votacao) ====================

  /**
   * Gera novo OTP para votacao da pauta
   */
  async generateVotingOtp(agendaItemId: string, assemblyId: string): Promise<OtpData> {
    const agendaItem = await this.agendaItemRepository.findOne({
      where: { id: agendaItemId, assemblyId },
    });

    if (!agendaItem) {
      throw new NotFoundException(`Pauta com ID ${agendaItemId} nao encontrada`);
    }

    // Valida que pauta esta em votacao
    if (agendaItem.status !== AgendaItemStatus.VOTING) {
      throw new BadRequestException('Pauta nao esta em votacao');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + VOTING_OTP_EXPIRY_MINUTES * 60 * 1000);
    const otp = this.generateOtpCode();

    agendaItem.votingOtp = otp;
    agendaItem.votingOtpGeneratedAt = now;
    agendaItem.votingOtpExpiresAt = expiresAt;

    await this.agendaItemRepository.save(agendaItem);

    return {
      otp,
      generatedAt: now,
      expiresAt,
      remainingSeconds: VOTING_OTP_EXPIRY_MINUTES * 60,
    };
  }

  /**
   * Obtem OTP atual da pauta (para exibicao pelo sindico)
   */
  async getVotingOtp(agendaItemId: string, assemblyId: string): Promise<OtpData | null> {
    const agendaItem = await this.agendaItemRepository.findOne({
      where: { id: agendaItemId, assemblyId },
    });

    if (!agendaItem) {
      throw new NotFoundException(`Pauta com ID ${agendaItemId} nao encontrada`);
    }

    if (!agendaItem.votingOtp || !agendaItem.votingOtpExpiresAt) {
      return null;
    }

    const now = new Date();
    const remainingMs = agendaItem.votingOtpExpiresAt.getTime() - now.getTime();

    // Se expirado, retorna null
    if (remainingMs <= 0) {
      return null;
    }

    return {
      otp: agendaItem.votingOtp,
      generatedAt: agendaItem.votingOtpGeneratedAt!,
      expiresAt: agendaItem.votingOtpExpiresAt,
      remainingSeconds: Math.ceil(remainingMs / 1000),
    };
  }

  /**
   * Valida OTP de votacao da pauta
   */
  async validateVotingOtp(agendaItemId: string, otp: string): Promise<boolean> {
    const agendaItem = await this.agendaItemRepository.findOne({
      where: { id: agendaItemId },
    });

    if (!agendaItem) {
      return false;
    }

    // Verifica se pauta esta em votacao
    if (agendaItem.status !== AgendaItemStatus.VOTING) {
      return false;
    }

    // Verifica se tem OTP definido
    if (!agendaItem.votingOtp || !agendaItem.votingOtpExpiresAt) {
      return false;
    }

    // Verifica se OTP expirou
    const now = new Date();
    if (now > agendaItem.votingOtpExpiresAt) {
      return false;
    }

    // Verifica se OTP esta correto
    return agendaItem.votingOtp === otp;
  }
}
