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
import { AttendanceService } from './attendance.service';
import {
  CheckinRequestDto,
  CheckinResponseDto,
  CheckoutRequestDto,
  AttendanceStatusDto,
  QrCodeDataDto,
} from './dto/attendance.dto';
import { RequireTenant, Roles, CurrentUser, Public } from '../auth/decorators';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('Presenca em Assembleias')
@Controller('assemblies')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ==================== ROTAS PUBLICAS (Check-in via QR Code) ====================

  @Post('checkin')
  @Public()
  @ApiOperation({ summary: 'Realizar check-in via token do QR Code (publico)' })
  @ApiResponse({ status: 201, type: CheckinResponseDto })
  @ApiResponse({ status: 400, description: 'Dados invalidos ou assembleia nao permite check-in' })
  @ApiResponse({ status: 404, description: 'Token invalido' })
  @ApiResponse({ status: 409, description: 'Unidade ja fez check-in' })
  async checkin(@Body() dto: CheckinRequestDto): Promise<CheckinResponseDto> {
    return this.attendanceService.checkin(dto);
  }

  @Post('checkout')
  @Public()
  @ApiOperation({ summary: 'Realizar checkout via token (publico)' })
  @ApiResponse({ status: 200 })
  async checkout(@Body() dto: CheckoutRequestDto) {
    return this.attendanceService.checkout(dto.checkinToken, dto.participantId);
  }

  @Get('checkin/validate/:token')
  @Public()
  @ApiOperation({ summary: 'Validar token de check-in e obter info da assembleia (publico)' })
  @ApiParam({ name: 'token', description: 'Token de check-in' })
  @ApiResponse({ status: 200 })
  async validateToken(@Param('token') token: string) {
    return this.attendanceService.validateCheckinToken(token);
  }

  // ==================== ROTAS AUTENTICADAS ====================

  @Post(':id/generate-checkin-token')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Gerar token de check-in para QR Code' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 201, type: QrCodeDataDto })
  async generateCheckinToken(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<QrCodeDataDto> {
    return this.attendanceService.generateCheckinToken(id, user.tenantId!);
  }

  @Get(':id/attendance')
  @ApiBearerAuth()
  @RequireTenant()
  @ApiOperation({ summary: 'Obter status de presenca da assembleia' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 200, type: AttendanceStatusDto })
  async getAttendanceStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<AttendanceStatusDto> {
    return this.attendanceService.getAttendanceStatus(id, user.tenantId!);
  }

  @Get(':id/attendance/participants')
  @ApiBearerAuth()
  @RequireTenant()
  @ApiOperation({ summary: 'Listar participantes com status de presenca' })
  @ApiParam({ name: 'id', description: 'ID da assembleia' })
  @ApiResponse({ status: 200 })
  async getPresentParticipants(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.getPresentParticipants(id);
  }
}
