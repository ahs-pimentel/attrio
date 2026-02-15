import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ReservationEntity } from './entities/reservation.entity';
import { CommonAreaEntity } from './entities/common-area.entity';
import { CreateReservationDto, UpdateReservationStatusDto } from './dto';
import { ReservationStatus } from '@attrio/contracts';

@Injectable()
export class ReservationsService {
  private readonly defaultRelations = ['commonArea', 'reservedByUser', 'approvedByUser'];

  constructor(
    @InjectRepository(ReservationEntity)
    private readonly reservationRepository: Repository<ReservationEntity>,
    @InjectRepository(CommonAreaEntity)
    private readonly areaRepository: Repository<CommonAreaEntity>,
  ) {}

  async findAll(tenantId: string): Promise<ReservationEntity[]> {
    return this.reservationRepository.find({
      where: { tenantId },
      relations: this.defaultRelations,
      order: { reservationDate: 'DESC' },
    });
  }

  async findByUser(tenantId: string, userId: string): Promise<ReservationEntity[]> {
    return this.reservationRepository.find({
      where: { tenantId, reservedBy: userId },
      relations: this.defaultRelations,
      order: { reservationDate: 'DESC' },
    });
  }

  async findByArea(tenantId: string, areaId: string, month?: string): Promise<ReservationEntity[]> {
    const qb = this.reservationRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.commonArea', 'commonArea')
      .leftJoinAndSelect('r.reservedByUser', 'reservedByUser')
      .leftJoinAndSelect('r.approvedByUser', 'approvedByUser')
      .where('r.tenant_id = :tenantId', { tenantId })
      .andWhere('r.common_area_id = :areaId', { areaId })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [ReservationStatus.PENDING, ReservationStatus.APPROVED],
      });

    if (month) {
      // month format: YYYY-MM
      const start = `${month}-01`;
      const [year, m] = month.split('-').map(Number);
      const lastDay = new Date(year, m, 0).getDate();
      const end = `${month}-${String(lastDay).padStart(2, '0')}`;
      qb.andWhere('r.reservation_date BETWEEN :start AND :end', { start, end });
    }

    return qb.orderBy('r.reservation_date', 'ASC').getMany();
  }

  async findById(id: string, tenantId: string): Promise<ReservationEntity> {
    const reservation = await this.reservationRepository.findOne({
      where: { id, tenantId },
      relations: this.defaultRelations,
    });
    if (!reservation) {
      throw new NotFoundException(`Reserva com ID ${id} nao encontrada`);
    }
    return reservation;
  }

  async create(tenantId: string, dto: CreateReservationDto, userId: string): Promise<ReservationEntity> {
    // Validar area
    const area = await this.areaRepository.findOne({
      where: { id: dto.commonAreaId, tenantId },
    });
    if (!area) {
      throw new NotFoundException('Area comum nao encontrada');
    }
    if (!area.active) {
      throw new BadRequestException('Esta area comum esta desativada');
    }

    // Validar data futura
    const today = new Date().toISOString().split('T')[0];
    if (dto.reservationDate < today) {
      throw new BadRequestException('A data da reserva deve ser futura');
    }

    // Verificar conflito
    const existing = await this.reservationRepository.findOne({
      where: {
        commonAreaId: dto.commonAreaId,
        reservationDate: dto.reservationDate,
        status: In([ReservationStatus.PENDING, ReservationStatus.APPROVED]),
      },
    });
    if (existing) {
      throw new ConflictException('Esta area ja possui uma reserva para esta data');
    }

    const reservation = this.reservationRepository.create({
      tenantId,
      commonAreaId: dto.commonAreaId,
      reservedBy: userId,
      reservationDate: dto.reservationDate,
      notes: dto.notes || null,
    });
    return this.reservationRepository.save(reservation);
  }

  async updateStatus(
    id: string,
    tenantId: string,
    dto: UpdateReservationStatusDto,
    userId: string,
  ): Promise<ReservationEntity> {
    const reservation = await this.findById(id, tenantId);

    if (dto.status === ReservationStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('Motivo da rejeicao e obrigatorio');
    }

    reservation.status = dto.status;

    if (dto.status === ReservationStatus.APPROVED) {
      reservation.approvedBy = userId;
      reservation.approvedAt = new Date();
    } else if (dto.status === ReservationStatus.REJECTED) {
      reservation.rejectionReason = dto.rejectionReason!;
    }

    return this.reservationRepository.save(reservation);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const reservation = await this.findById(id, tenantId);
    await this.reservationRepository.remove(reservation);
  }
}
