import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { BudgetEntity } from './entities/budget.entity';
import { RecurringEntity } from './entities/recurring.entity';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateBudgetDto,
  UpdateBudgetDto,
  CreateRecurringDto,
  UpdateRecurringDto,
  RecurringFrequency,
  CashflowMonthDto,
  CategoryBreakdownDto,
} from './dto';
import { TransactionType, TransactionCategory } from '@attrio/contracts';

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  COMMON_FEES: 'Taxa de Condomínio',
  MAINTENANCE: 'Manutenção',
  UTILITIES: 'Utilidades',
  SALARY: 'Salário',
  INSURANCE: 'Seguro',
  RESERVE_FUND: 'Fundo de Reserva',
  OTHER: 'Outro',
};

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
    @InjectRepository(BudgetEntity)
    private readonly budgetRepository: Repository<BudgetEntity>,
    @InjectRepository(RecurringEntity)
    private readonly recurringRepository: Repository<RecurringEntity>,
  ) {}

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private dateRangeWhere(month?: number, year?: number) {
    if (month && year) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
      return Between(start, end);
    }
    if (year) {
      return Between(`${year}-01-01`, `${year}-12-31`);
    }
    return undefined;
  }

  // ─── Transactions ─────────────────────────────────────────────────────────

  async findAll(
    tenantId: string,
    month?: number,
    year?: number,
    type?: TransactionType,
    category?: TransactionCategory,
    page = 1,
    perPage = 50,
  ): Promise<{ data: TransactionEntity[]; total: number }> {
    const where: any = { tenantId };
    const dateRange = this.dateRangeWhere(month, year);
    if (dateRange) where.date = dateRange;
    if (type) where.type = type;
    if (category) where.category = category;

    const [data, total] = await this.transactionRepository.findAndCount({
      where,
      relations: ['creator'],
      order: { date: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return { data, total };
  }

  async findById(id: string, tenantId: string): Promise<TransactionEntity> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, tenantId },
      relations: ['creator'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transacao com ID ${id} nao encontrada`);
    }
    return transaction;
  }

  async getSummary(tenantId: string, month?: number, year?: number) {
    const { data: transactions } = await this.findAll(tenantId, month, year, undefined, undefined, 1, 99999);

    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount: transactions.length,
    };
  }

  async getOverview(tenantId: string, year: number) {
    const { data: transactions } = await this.findAll(tenantId, undefined, year, undefined, undefined, 1, 99999);

    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const cashflow: CashflowMonthDto[] = [];
    for (let m = 1; m <= 12; m++) {
      const monthTxs = transactions.filter((t) => parseInt(t.date.split('-')[1]) === m);
      const income = monthTxs.filter((t) => t.type === TransactionType.INCOME).reduce((s, t) => s + Number(t.amount), 0);
      const expenses = monthTxs.filter((t) => t.type === TransactionType.EXPENSE).reduce((s, t) => s + Number(t.amount), 0);
      cashflow.push({ month: m, year, label: monthNames[m - 1], income, expenses, balance: income - expenses });
    }

    const expensesByCategory = this.buildCategoryBreakdown(
      transactions.filter((t) => t.type === TransactionType.EXPENSE),
      totalExpenses,
    );
    const incomeByCategory = this.buildCategoryBreakdown(
      transactions.filter((t) => t.type === TransactionType.INCOME),
      totalIncome,
    );

    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses, transactionCount: transactions.length, cashflow, expensesByCategory, incomeByCategory };
  }

  private buildCategoryBreakdown(transactions: TransactionEntity[], total: number): CategoryBreakdownDto[] {
    const map = new Map<TransactionCategory, { total: number; count: number }>();
    for (const t of transactions) {
      const existing = map.get(t.category) || { total: 0, count: 0 };
      map.set(t.category, { total: existing.total + Number(t.amount), count: existing.count + 1 });
    }
    return Array.from(map.entries())
      .map(([category, { total: catTotal, count }]) => ({
        category,
        label: CATEGORY_LABELS[category] || category,
        total: catTotal,
        count,
        percentage: total > 0 ? Math.round((catTotal / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  async exportCsv(tenantId: string, month?: number, year?: number): Promise<string> {
    const { data: transactions } = await this.findAll(tenantId, month, year, undefined, undefined, 1, 99999);
    const header = ['Data', 'Tipo', 'Categoria', 'Descricao', 'Valor', 'Referencia', 'Registrado por'];
    const rows = transactions.map((t) => [
      t.date,
      t.type === TransactionType.INCOME ? 'Entrada' : 'Saida',
      CATEGORY_LABELS[t.category] || t.category,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      Number(t.amount).toFixed(2).replace('.', ','),
      t.reference || '',
      `"${((t.creator?.name || t.creator?.email) || '').replace(/"/g, '""')}"`,
    ]);
    return [header.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  }

  async create(tenantId: string, dto: CreateTransactionDto, userId: string): Promise<TransactionEntity> {
    const transaction = this.transactionRepository.create({
      tenantId,
      type: dto.type,
      category: dto.category || TransactionCategory.OTHER,
      description: dto.description,
      amount: dto.amount,
      date: dto.date,
      reference: dto.reference || null,
      createdBy: userId,
    });
    return this.transactionRepository.save(transaction);
  }

  async update(id: string, tenantId: string, dto: UpdateTransactionDto): Promise<TransactionEntity> {
    const transaction = await this.findById(id, tenantId);
    if (dto.type !== undefined) transaction.type = dto.type;
    if (dto.category !== undefined) transaction.category = dto.category;
    if (dto.description !== undefined) transaction.description = dto.description;
    if (dto.amount !== undefined) transaction.amount = dto.amount;
    if (dto.date !== undefined) transaction.date = dto.date;
    if (dto.reference !== undefined) transaction.reference = dto.reference || null;
    return this.transactionRepository.save(transaction);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const transaction = await this.findById(id, tenantId);
    await this.transactionRepository.remove(transaction);
  }

  // ─── Budgets ──────────────────────────────────────────────────────────────

  async findBudgets(tenantId: string, year: number, month?: number) {
    const where: any = { tenantId, year };
    if (month) where.month = month;
    return this.budgetRepository.find({ where, order: { month: 'ASC', category: 'ASC' } });
  }

  async getBudgetsWithSpent(tenantId: string, year: number, month: number) {
    const budgets = await this.findBudgets(tenantId, year, month);
    const { data: transactions } = await this.findAll(tenantId, month, year, TransactionType.EXPENSE, undefined, 1, 99999);

    return budgets.map((b) => {
      const spent = transactions
        .filter((t) => t.category === b.category)
        .reduce((s, t) => s + Number(t.amount), 0);
      const amount = Number(b.amount);
      return { ...b, amount, spent, remaining: amount - spent, percentageUsed: amount > 0 ? Math.round((spent / amount) * 1000) / 10 : 0 };
    });
  }

  async createBudget(tenantId: string, dto: CreateBudgetDto) {
    const existing = await this.budgetRepository.findOne({
      where: { tenantId, category: dto.category, year: dto.year, month: dto.month },
    });
    if (existing) {
      throw new BadRequestException(
        `Ja existe um orcamento para ${CATEGORY_LABELS[dto.category]} em ${dto.month}/${dto.year}`,
      );
    }
    const budget = this.budgetRepository.create({
      tenantId,
      category: dto.category,
      year: dto.year,
      month: dto.month,
      amount: dto.amount,
      notes: dto.notes || null,
    });
    return this.budgetRepository.save(budget);
  }

  async updateBudget(id: string, tenantId: string, dto: UpdateBudgetDto) {
    const budget = await this.budgetRepository.findOne({ where: { id, tenantId } });
    if (!budget) throw new NotFoundException(`Orcamento ${id} nao encontrado`);
    if (dto.amount !== undefined) budget.amount = dto.amount;
    if (dto.notes !== undefined) budget.notes = dto.notes || null;
    return this.budgetRepository.save(budget);
  }

  async deleteBudget(id: string, tenantId: string): Promise<void> {
    const budget = await this.budgetRepository.findOne({ where: { id, tenantId } });
    if (!budget) throw new NotFoundException(`Orcamento ${id} nao encontrado`);
    await this.budgetRepository.remove(budget);
  }

  // ─── Recurring ────────────────────────────────────────────────────────────

  async findRecurring(tenantId: string, activeOnly = false) {
    const where: any = { tenantId };
    if (activeOnly) where.active = true;
    return this.recurringRepository.find({ where, relations: ['creator'], order: { createdAt: 'DESC' } });
  }

  async createRecurring(tenantId: string, dto: CreateRecurringDto, userId: string) {
    const recurring = this.recurringRepository.create({
      tenantId,
      type: dto.type,
      category: dto.category || TransactionCategory.OTHER,
      description: dto.description,
      amount: dto.amount,
      frequency: dto.frequency,
      startDate: dto.startDate,
      endDate: dto.endDate || null,
      reference: dto.reference || null,
      active: true,
      createdBy: userId,
    });
    return this.recurringRepository.save(recurring);
  }

  async updateRecurring(id: string, tenantId: string, dto: UpdateRecurringDto) {
    const recurring = await this.recurringRepository.findOne({ where: { id, tenantId } });
    if (!recurring) throw new NotFoundException(`Recorrencia ${id} nao encontrada`);
    if (dto.type !== undefined) recurring.type = dto.type;
    if (dto.category !== undefined) recurring.category = dto.category;
    if (dto.description !== undefined) recurring.description = dto.description;
    if (dto.amount !== undefined) recurring.amount = dto.amount;
    if (dto.frequency !== undefined) recurring.frequency = dto.frequency;
    if (dto.startDate !== undefined) recurring.startDate = dto.startDate;
    if (dto.endDate !== undefined) recurring.endDate = dto.endDate || null;
    if (dto.reference !== undefined) recurring.reference = dto.reference || null;
    return this.recurringRepository.save(recurring);
  }

  async toggleRecurring(id: string, tenantId: string): Promise<RecurringEntity> {
    const recurring = await this.recurringRepository.findOne({ where: { id, tenantId } });
    if (!recurring) throw new NotFoundException(`Recorrencia ${id} nao encontrada`);
    recurring.active = !recurring.active;
    return this.recurringRepository.save(recurring);
  }

  async deleteRecurring(id: string, tenantId: string): Promise<void> {
    const recurring = await this.recurringRepository.findOne({ where: { id, tenantId } });
    if (!recurring) throw new NotFoundException(`Recorrencia ${id} nao encontrada`);
    await this.recurringRepository.remove(recurring);
  }

  async applyRecurring(id: string, tenantId: string, userId: string, date: string) {
    const recurring = await this.recurringRepository.findOne({ where: { id, tenantId, active: true } });
    if (!recurring) throw new NotFoundException(`Recorrencia ${id} nao encontrada ou inativa`);
    return this.create(tenantId, {
      type: recurring.type,
      category: recurring.category,
      description: recurring.description,
      amount: Number(recurring.amount),
      date,
      reference: recurring.reference || undefined,
    }, userId);
  }

  getNextDueDate(recurring: RecurringEntity): string | null {
    const today = new Date();
    const start = new Date(recurring.startDate);
    const end = recurring.endDate ? new Date(recurring.endDate) : null;

    if (!recurring.active) return null;
    if (end && end < today) return null;

    const monthsMap: Record<RecurringFrequency, number> = {
      [RecurringFrequency.MONTHLY]: 1,
      [RecurringFrequency.BIMONTHLY]: 2,
      [RecurringFrequency.QUARTERLY]: 3,
      [RecurringFrequency.SEMIANNUAL]: 6,
      [RecurringFrequency.ANNUAL]: 12,
    };
    const step = monthsMap[recurring.frequency] || 1;

    let current = new Date(start);
    while (current < today) {
      current = new Date(current);
      current.setMonth(current.getMonth() + step);
    }
    if (end && current > end) return null;
    return current.toISOString().split('T')[0];
  }
}
