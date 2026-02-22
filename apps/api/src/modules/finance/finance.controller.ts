import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionResponseDto,
  FinanceSummaryDto,
  FinanceOverviewDto,
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetResponseDto,
  CreateRecurringDto,
  UpdateRecurringDto,
  RecurringResponseDto,
} from './dto';
import { RequireTenant, Roles, CurrentUser } from '../auth/decorators';
import { UserRole, TransactionType, TransactionCategory } from '@attrio/contracts';

interface RequestUser {
  userId: string;
  tenantId: string | null;
  role: UserRole;
}

@ApiTags('Financeiro')
@ApiBearerAuth()
@Controller('finance')
@RequireTenant()
@Roles(UserRole.SYNDIC, UserRole.SAAS_ADMIN)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ─── Summary / Overview ──────────────────────────────────────────────────

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro (indicadores)' })
  @ApiResponse({ status: 200, type: FinanceSummaryDto })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async getSummary(
    @CurrentUser() user: RequestUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<FinanceSummaryDto> {
    return this.financeService.getSummary(
      user.tenantId!,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
  }

  @Get('overview')
  @ApiOperation({ summary: 'Visao geral anual com fluxo de caixa e breakdown por categoria' })
  @ApiResponse({ status: 200, type: FinanceOverviewDto })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async getOverview(
    @CurrentUser() user: RequestUser,
    @Query('year') year?: string,
  ): Promise<FinanceOverviewDto> {
    const y = year ? parseInt(year) : new Date().getFullYear();
    return this.financeService.getOverview(user.tenantId!, y) as Promise<FinanceOverviewDto>;
  }

  // ─── Export CSV ──────────────────────────────────────────────────────────

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar transacoes em CSV' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async exportCsv(
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<void> {
    const csv = await this.financeService.exportCsv(
      user.tenantId!,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
    const filename = `financeiro-${year || 'todos'}-${month || 'todos'}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8
  }

  // ─── Budgets ─────────────────────────────────────────────────────────────

  @Get('budgets')
  @ApiOperation({ summary: 'Listar orcamentos com gasto real' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  async getBudgets(
    @CurrentUser() user: RequestUser,
    @Query('year') year: string,
    @Query('month') month?: string,
  ) {
    if (month) {
      return this.financeService.getBudgetsWithSpent(user.tenantId!, parseInt(year), parseInt(month));
    }
    return this.financeService.findBudgets(user.tenantId!, parseInt(year));
  }

  @Post('budgets')
  @ApiOperation({ summary: 'Criar orcamento' })
  @ApiResponse({ status: 201, type: BudgetResponseDto })
  async createBudget(
    @Body() dto: CreateBudgetDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financeService.createBudget(user.tenantId!, dto);
  }

  @Put('budgets/:id')
  @ApiOperation({ summary: 'Atualizar orcamento' })
  async updateBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financeService.updateBudget(id, user.tenantId!, dto);
  }

  @Delete('budgets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover orcamento' })
  async deleteBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.financeService.deleteBudget(id, user.tenantId!);
  }

  // ─── Recurring ───────────────────────────────────────────────────────────

  @Get('recurring')
  @ApiOperation({ summary: 'Listar transacoes recorrentes' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async getRecurring(
    @CurrentUser() user: RequestUser,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<RecurringResponseDto[]> {
    const list = await this.financeService.findRecurring(user.tenantId!, activeOnly === 'true');
    return list.map((r) => this.toRecurringResponse(r));
  }

  @Post('recurring')
  @ApiOperation({ summary: 'Criar transacao recorrente' })
  @ApiResponse({ status: 201, type: RecurringResponseDto })
  async createRecurring(
    @Body() dto: CreateRecurringDto,
    @CurrentUser() user: RequestUser,
  ): Promise<RecurringResponseDto> {
    const r = await this.financeService.createRecurring(user.tenantId!, dto, user.userId);
    return this.toRecurringResponse(r);
  }

  @Put('recurring/:id')
  @ApiOperation({ summary: 'Atualizar recorrencia' })
  async updateRecurring(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringDto,
    @CurrentUser() user: RequestUser,
  ): Promise<RecurringResponseDto> {
    const r = await this.financeService.updateRecurring(id, user.tenantId!, dto);
    return this.toRecurringResponse(r);
  }

  @Patch('recurring/:id/toggle')
  @ApiOperation({ summary: 'Ativar/desativar recorrencia' })
  async toggleRecurring(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<RecurringResponseDto> {
    const r = await this.financeService.toggleRecurring(id, user.tenantId!);
    return this.toRecurringResponse(r);
  }

  @Post('recurring/:id/apply')
  @ApiOperation({ summary: 'Gerar transacao a partir da recorrencia' })
  @ApiQuery({ name: 'date', required: true })
  async applyRecurring(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') date: string,
    @CurrentUser() user: RequestUser,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.financeService.applyRecurring(id, user.tenantId!, user.userId, date);
    const full = await this.financeService.findById(transaction.id, user.tenantId!);
    return this.toResponse(full);
  }

  @Delete('recurring/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover recorrencia' })
  async deleteRecurring(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.financeService.deleteRecurring(id, user.tenantId!);
  }

  // ─── Transactions ────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Listar transacoes' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiQuery({ name: 'category', required: false, enum: TransactionCategory })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('type') type?: TransactionType,
    @Query('category') category?: TransactionCategory,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ): Promise<{ data: TransactionResponseDto[]; total: number }> {
    const result = await this.financeService.findAll(
      user.tenantId!,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
      type,
      category,
      page ? parseInt(page) : 1,
      perPage ? parseInt(perPage) : 50,
    );
    return { data: result.data.map((t) => this.toResponse(t)), total: result.total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar transacao por ID' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.financeService.findById(id, user.tenantId!);
    return this.toResponse(transaction);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar transacao' })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  async create(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: RequestUser,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.financeService.create(user.tenantId!, dto, user.userId);
    const full = await this.financeService.findById(transaction.id, user.tenantId!);
    return this.toResponse(full);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar transacao' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
    @CurrentUser() user: RequestUser,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.financeService.update(id, user.tenantId!, dto);
    return this.toResponse(transaction);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover transacao' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.financeService.delete(id, user.tenantId!);
  }

  // ─── Private mappers ─────────────────────────────────────────────────────

  private toResponse(t: any): TransactionResponseDto {
    return {
      id: t.id,
      tenantId: t.tenantId,
      type: t.type,
      category: t.category,
      description: t.description,
      amount: Number(t.amount),
      date: t.date,
      reference: t.reference,
      createdBy: t.createdBy,
      createdByName: t.creator?.name || t.creator?.email || '',
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }

  private toRecurringResponse(r: any): RecurringResponseDto {
    return {
      id: r.id,
      tenantId: r.tenantId,
      type: r.type,
      category: r.category,
      description: r.description,
      amount: Number(r.amount),
      frequency: r.frequency,
      startDate: r.startDate,
      endDate: r.endDate,
      reference: r.reference,
      active: r.active,
      nextDueDate: this.financeService.getNextDueDate(r),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
