import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { ValidateOtpDto, OtpResponseDto, OtpValidationResultDto } from './dto/otp.dto';
import { RequireTenant, Roles, CurrentUser } from '../auth';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('OTP de Assembleia')
@Controller('assemblies')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  // ==================== OTP de Check-in (Assembleia) ====================

  @Post(':id/otp/generate')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Gerar OTP para check-in da assembleia' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 201, type: OtpResponseDto })
  async generateAssemblyOtp(
    @Param('id', ParseUUIDPipe) assemblyId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<OtpResponseDto> {
    return this.otpService.generateAssemblyOtp(assemblyId, user.tenantId!);
  }

  @Get(':id/otp')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Obter OTP atual da assembleia' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: OtpResponseDto })
  async getAssemblyOtp(
    @Param('id', ParseUUIDPipe) assemblyId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<OtpResponseDto | null> {
    return this.otpService.getAssemblyOtp(assemblyId, user.tenantId!);
  }

  // ==================== Validacao Publica de OTP ====================

  @Post('checkin/validate-otp/:token')
  @ApiOperation({ summary: 'Validar OTP pelo token de check-in (publico)' })
  @ApiParam({ name: 'token', description: 'Token de check-in da assembleia' })
  @ApiResponse({ status: 200, type: OtpValidationResultDto })
  async validateOtpByToken(
    @Param('token') checkinToken: string,
    @Body() dto: ValidateOtpDto,
  ): Promise<OtpValidationResultDto> {
    return this.otpService.validateAssemblyOtpByToken(checkinToken, dto.otp);
  }

  // ==================== OTP de Votacao (Pauta) ====================

  @Post(':assemblyId/agenda-items/:agendaItemId/otp/generate')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Gerar OTP para votacao da pauta' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'agendaItemId', description: 'ID da pauta' })
  @ApiResponse({ status: 201, type: OtpResponseDto })
  async generateVotingOtp(
    @Param('assemblyId', ParseUUIDPipe) assemblyId: string,
    @Param('agendaItemId', ParseUUIDPipe) agendaItemId: string,
  ): Promise<OtpResponseDto> {
    return this.otpService.generateVotingOtp(agendaItemId, assemblyId);
  }

  @Get(':assemblyId/agenda-items/:agendaItemId/otp')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Obter OTP atual da pauta' })
  @ApiParam({ name: 'assemblyId', description: 'ID da assembleia' })
  @ApiParam({ name: 'agendaItemId', description: 'ID da pauta' })
  @ApiResponse({ status: 200, type: OtpResponseDto })
  async getVotingOtp(
    @Param('assemblyId', ParseUUIDPipe) assemblyId: string,
    @Param('agendaItemId', ParseUUIDPipe) agendaItemId: string,
  ): Promise<OtpResponseDto | null> {
    return this.otpService.getVotingOtp(agendaItemId, assemblyId);
  }
}
