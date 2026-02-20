import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Res,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import {
  RejectProxyDto,
  ProxyUploadResponseDto,
  PendingProxyDto,
  ProxyApprovalResultDto,
} from './dto/proxy.dto';
import { RequireTenant, Roles, CurrentUser, Public } from '../auth/decorators';
import { UserRole } from '@attrio/contracts';
import * as fs from 'fs';

interface RequestUser {
  id: string;
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('Procuracoes de Assembleia')
@Controller('assemblies')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  // ==================== ROTAS PUBLICAS (Via Session Token) ====================

  @Post('session/proxy/upload')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de arquivo de procuracao (via session token)' })
  @ApiHeader({ name: 'x-session-token', description: 'Token de sessao do participante' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        participantId: { type: 'string', format: 'uuid' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, type: ProxyUploadResponseDto })
  async uploadProxy(
    @Headers('x-session-token') sessionToken: string,
    @Body('participantId') participantId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProxyUploadResponseDto> {
    if (!sessionToken) {
      throw new UnauthorizedException('Session token nao informado');
    }

    return this.proxyService.uploadProxy(participantId, sessionToken, file);
  }

  // ==================== ROTAS AUTENTICADAS (Sindico) ====================

  @Get(':id/pending-proxies')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Listar procuracoes pendentes de aprovacao' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: [PendingProxyDto] })
  async getPendingProxies(
    @Param('id', ParseUUIDPipe) assemblyId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<PendingProxyDto[]> {
    return this.proxyService.getPendingProxies(assemblyId, user.tenantId!);
  }

  @Post(':id/participants/:participantId/approve')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Aprovar procuracao de um participante' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiParam({ name: 'participantId', description: 'ID do participante' })
  @ApiResponse({ status: 200, type: ProxyApprovalResultDto })
  async approveProxy(
    @Param('id', ParseUUIDPipe) assemblyId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ProxyApprovalResultDto> {
    const result = await this.proxyService.approveProxy(
      assemblyId,
      participantId,
      user.id,
      user.tenantId!,
    );

    return {
      participantId: result.id,
      unitIdentifier: result.unit?.identifier || 'N/A',
      approvalStatus: result.approvalStatus,
      approvedAt: result.approvedAt || undefined,
    };
  }

  @Post(':id/participants/:participantId/reject')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Rejeitar procuracao de um participante' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiParam({ name: 'participantId', description: 'ID do participante' })
  @ApiResponse({ status: 200, type: ProxyApprovalResultDto })
  async rejectProxy(
    @Param('id', ParseUUIDPipe) assemblyId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Body() dto: RejectProxyDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ProxyApprovalResultDto> {
    const result = await this.proxyService.rejectProxy(
      assemblyId,
      participantId,
      user.id,
      dto.reason,
      user.tenantId!,
    );

    return {
      participantId: result.id,
      unitIdentifier: result.unit?.identifier || 'N/A',
      approvalStatus: result.approvalStatus,
      approvedAt: result.approvedAt || undefined,
      rejectionReason: result.rejectionReason || undefined,
    };
  }

  @Get(':id/participants/:participantId/proxy')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Download do arquivo de procuracao' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiParam({ name: 'participantId', description: 'ID do participante' })
  async downloadProxy(
    @Param('id', ParseUUIDPipe) assemblyId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ) {
    const { filePath, fileName, mimeType } = await this.proxyService.getProxyFile(
      assemblyId,
      participantId,
      user.tenantId!,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
