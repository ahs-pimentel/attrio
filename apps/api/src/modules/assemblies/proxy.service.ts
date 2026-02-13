import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssemblyEntity, AssemblyParticipantEntity } from './entities';
import { ParticipantApprovalStatus } from '@attrio/contracts';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

type UploadedFile = Express.Multer.File;

interface ProxyUploadResult {
  participantId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
}

interface PendingProxyItem {
  participantId: string;
  unitIdentifier: string;
  proxyName: string;
  proxyDocument: string | null;
  fileName: string | null;
  fileUrl: string | null;
  checkinTime: Date;
}

@Injectable()
export class ProxyService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'proxies');

  constructor(
    @InjectRepository(AssemblyEntity)
    private readonly assemblyRepository: Repository<AssemblyEntity>,
    @InjectRepository(AssemblyParticipantEntity)
    private readonly participantRepository: Repository<AssemblyParticipantEntity>,
  ) {
    // Garante que o diretorio de uploads existe
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload de arquivo de procuracao
   */
  async uploadProxy(
    participantId: string,
    sessionToken: string,
    file: UploadedFile,
  ): Promise<ProxyUploadResult> {
    // Valida session token
    const participant = await this.participantRepository.findOne({
      where: { id: participantId, sessionToken },
      relations: ['unit'],
    });

    if (!participant) {
      throw new NotFoundException('Participante nao encontrado ou sessao invalida');
    }

    if (!participant.proxyName) {
      throw new BadRequestException('Este participante nao e um procurador');
    }

    // Valida tipo de arquivo (PDF, JPG, PNG)
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo nao permitido. Use PDF, JPG ou PNG');
    }

    // Valida tamanho (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo muito grande. Tamanho maximo: 5MB');
    }

    // Gera nome unico para o arquivo
    const ext = path.extname(file.originalname);
    const uniqueName = `${participantId}-${randomBytes(8).toString('hex')}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    // Salva arquivo
    fs.writeFileSync(filePath, file.buffer);

    // Atualiza participante
    participant.proxyFileName = file.originalname;
    participant.proxyFileUrl = `/uploads/proxies/${uniqueName}`;
    await this.participantRepository.save(participant);

    return {
      participantId: participant.id,
      fileName: file.originalname,
      fileUrl: participant.proxyFileUrl,
      uploadedAt: new Date(),
    };
  }

  /**
   * Aprova procuracao de um participante
   */
  async approveProxy(
    assemblyId: string,
    participantId: string,
    approvedById: string,
    tenantId: string,
  ): Promise<AssemblyParticipantEntity> {
    // Valida assembleia
    const assembly = await this.assemblyRepository.findOne({
      where: { id: assemblyId, tenantId },
    });

    if (!assembly) {
      throw new NotFoundException('Assembleia nao encontrada');
    }

    // Busca participante
    const participant = await this.participantRepository.findOne({
      where: { id: participantId, assemblyId },
      relations: ['unit'],
    });

    if (!participant) {
      throw new NotFoundException('Participante nao encontrado');
    }

    if (!participant.proxyName) {
      throw new BadRequestException('Este participante nao e um procurador');
    }

    if (participant.approvalStatus === ParticipantApprovalStatus.APPROVED) {
      throw new BadRequestException('Procuracao ja foi aprovada');
    }

    // Aprova
    participant.approvalStatus = ParticipantApprovalStatus.APPROVED;
    participant.approvedBy = approvedById;
    participant.approvedAt = new Date();
    participant.rejectionReason = null;

    return this.participantRepository.save(participant);
  }

  /**
   * Rejeita procuracao de um participante
   */
  async rejectProxy(
    assemblyId: string,
    participantId: string,
    rejectedById: string,
    reason: string,
    tenantId: string,
  ): Promise<AssemblyParticipantEntity> {
    // Valida assembleia
    const assembly = await this.assemblyRepository.findOne({
      where: { id: assemblyId, tenantId },
    });

    if (!assembly) {
      throw new NotFoundException('Assembleia nao encontrada');
    }

    // Busca participante
    const participant = await this.participantRepository.findOne({
      where: { id: participantId, assemblyId },
      relations: ['unit'],
    });

    if (!participant) {
      throw new NotFoundException('Participante nao encontrado');
    }

    if (!participant.proxyName) {
      throw new BadRequestException('Este participante nao e um procurador');
    }

    if (participant.approvalStatus === ParticipantApprovalStatus.REJECTED) {
      throw new BadRequestException('Procuracao ja foi rejeitada');
    }

    // Rejeita
    participant.approvalStatus = ParticipantApprovalStatus.REJECTED;
    participant.approvedBy = rejectedById;
    participant.approvedAt = new Date();
    participant.rejectionReason = reason;

    return this.participantRepository.save(participant);
  }

  /**
   * Lista procuracoes pendentes de aprovacao
   */
  async getPendingProxies(assemblyId: string, tenantId: string): Promise<PendingProxyItem[]> {
    // Valida assembleia
    const assembly = await this.assemblyRepository.findOne({
      where: { id: assemblyId, tenantId },
    });

    if (!assembly) {
      throw new NotFoundException('Assembleia nao encontrada');
    }

    // Busca participantes com procuracao pendente
    const participants = await this.participantRepository.find({
      where: {
        assemblyId,
        approvalStatus: ParticipantApprovalStatus.PENDING,
      },
      relations: ['unit'],
      order: { joinedAt: 'ASC' },
    });

    // Filtra apenas procuradores
    return participants
      .filter((p) => p.proxyName)
      .map((p) => ({
        participantId: p.id,
        unitIdentifier: p.unit?.identifier || 'N/A',
        proxyName: p.proxyName!,
        proxyDocument: p.proxyDocument,
        fileName: p.proxyFileName,
        fileUrl: p.proxyFileUrl,
        checkinTime: p.joinedAt!,
      }));
  }

  /**
   * Obtem arquivo de procuracao
   */
  async getProxyFile(
    assemblyId: string,
    participantId: string,
    tenantId: string,
  ): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    // Valida assembleia
    const assembly = await this.assemblyRepository.findOne({
      where: { id: assemblyId, tenantId },
    });

    if (!assembly) {
      throw new NotFoundException('Assembleia nao encontrada');
    }

    // Busca participante
    const participant = await this.participantRepository.findOne({
      where: { id: participantId, assemblyId },
    });

    if (!participant) {
      throw new NotFoundException('Participante nao encontrado');
    }

    if (!participant.proxyFileUrl) {
      throw new NotFoundException('Arquivo de procuracao nao encontrado');
    }

    // Extrai nome do arquivo da URL
    const fileName = path.basename(participant.proxyFileUrl);
    const filePath = path.join(this.uploadDir, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Arquivo nao encontrado no servidor');
    }

    // Determina mime type
    const ext = path.extname(fileName).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';

    return {
      filePath,
      fileName: participant.proxyFileName || fileName,
      mimeType,
    };
  }

  /**
   * Valida sessao do participante e retorna status
   */
  async validateSession(sessionToken: string): Promise<{
    valid: boolean;
    participant?: AssemblyParticipantEntity & {
      unitIdentifier?: string;
      assemblyTitle?: string;
    };
  }> {
    const participant = await this.participantRepository.findOne({
      where: { sessionToken },
      relations: ['unit', 'assembly'],
    });

    if (!participant) {
      return { valid: false };
    }

    return {
      valid: true,
      participant: {
        ...participant,
        unitIdentifier: participant.unit?.identifier,
        assemblyTitle: participant.assembly?.title,
      },
    };
  }
}
