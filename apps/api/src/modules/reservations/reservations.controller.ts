import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto, UpdateReservationStatusDto, ReservationResponseDto } from './dto';
import { RequireTenant, Roles, CurrentUser } from '../auth';
import { UserRole, ReservationStatus } from '@attrio/contracts';

interface RequestUser {
  userId: string;
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('Reservas')
@ApiBearerAuth()
@Controller('reservations')
@RequireTenant()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar reservas' })
  @ApiResponse({ status: 200, type: [ReservationResponseDto] })
  async findAll(@CurrentUser() user: RequestUser): Promise<ReservationResponseDto[]> {
    const reservations =
      user.role === UserRole.RESIDENT
        ? await this.reservationsService.findByUser(user.tenantId!, user.userId)
        : await this.reservationsService.findAll(user.tenantId!);
    return reservations.map((r) => this.toResponse(r));
  }

  @Get('area/:areaId')
  @ApiOperation({ summary: 'Listar reservas de uma area' })
  @ApiQuery({ name: 'month', required: false, description: 'Filtro por mes (YYYY-MM)' })
  @ApiResponse({ status: 200, type: [ReservationResponseDto] })
  async findByArea(
    @Param('areaId', ParseUUIDPipe) areaId: string,
    @Query('month') month: string | undefined,
    @CurrentUser() user: RequestUser,
  ): Promise<ReservationResponseDto[]> {
    const reservations = await this.reservationsService.findByArea(
      user.tenantId!,
      areaId,
      month,
    );
    return reservations.map((r) => this.toResponse(r));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar reserva por ID' })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.findById(id, user.tenantId!);
    return this.toResponse(reservation);
  }

  @Post()
  @ApiOperation({ summary: 'Criar reserva' })
  @ApiResponse({ status: 201, type: ReservationResponseDto })
  async create(
    @Body() dto: CreateReservationDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.create(user.tenantId!, dto, user.userId);
    const full = await this.reservationsService.findById(reservation.id, user.tenantId!);
    return this.toResponse(full);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status da reserva' })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReservationStatusDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.findById(id, user.tenantId!);

    const isSyndic = user.role === UserRole.SYNDIC || user.role === UserRole.SAAS_ADMIN;

    // Morador so pode cancelar propria reserva
    if (!isSyndic) {
      if (dto.status !== ReservationStatus.CANCELLED) {
        throw new ForbiddenException('Apenas o sindico pode aprovar ou rejeitar reservas');
      }
      if (reservation.reservedBy !== user.userId) {
        throw new ForbiddenException('Voce so pode cancelar suas proprias reservas');
      }
    }

    const updated = await this.reservationsService.updateStatus(
      id,
      user.tenantId!,
      dto,
      user.userId,
    );
    return this.toResponse(updated);
  }

  @Delete(':id')
  @Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover reserva' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.reservationsService.delete(id, user.tenantId!);
  }

  private toResponse(r: any): ReservationResponseDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      commonAreaId: r.commonAreaId,
      commonAreaName: r.commonArea?.name || '',
      reservedBy: r.reservedBy,
      reservedByName: r.reservedByUser?.name || r.reservedByUser?.email || '',
      reservationDate: r.reservationDate,
      status: r.status,
      notes: r.notes,
      approvedBy: r.approvedBy,
      approvedByName: r.approvedByUser?.name || r.approvedByUser?.email || null,
      approvedAt: r.approvedAt,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
