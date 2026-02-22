import { apiClient } from './client';

export type TransactionType = 'INCOME' | 'EXPENSE';

export type TransactionCategory =
  | 'COMMON_FEES'
  | 'MAINTENANCE'
  | 'UTILITIES'
  | 'SALARY'
  | 'INSURANCE'
  | 'RESERVE_FUND'
  | 'OTHER';

export type RecurringFrequency =
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUAL'
  | 'ANNUAL';

export interface TransactionResponse {
  id: string;
  tenantId: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  date: string;
  reference: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}

export interface CashflowMonth {
  month: number;
  year: number;
  label: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  label: string;
  total: number;
  count: number;
  percentage: number;
}

export interface FinanceOverview extends FinanceSummary {
  cashflow: CashflowMonth[];
  expensesByCategory: CategoryBreakdown[];
  incomeByCategory: CategoryBreakdown[];
}

export interface BudgetResponse {
  id: string;
  tenantId: string;
  category: TransactionCategory;
  year: number;
  month: number;
  amount: number;
  notes: string | null;
  spent: number;
  remaining: number;
  percentageUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringResponse {
  id: string;
  tenantId: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string | null;
  reference: string | null;
  active: boolean;
  nextDueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  type: TransactionType;
  category?: TransactionCategory;
  description: string;
  amount: number;
  date: string;
  reference?: string;
}

export interface UpdateTransactionDto {
  type?: TransactionType;
  category?: TransactionCategory;
  description?: string;
  amount?: number;
  date?: string;
  reference?: string;
}

export interface CreateBudgetDto {
  category: TransactionCategory;
  year: number;
  month: number;
  amount: number;
  notes?: string;
}

export interface CreateRecurringDto {
  type: TransactionType;
  category?: TransactionCategory;
  description: string;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  reference?: string;
}

function buildQs(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const financeApi = {
  getSummary: (month?: number, year?: number) =>
    apiClient.get<FinanceSummary>(`/finance/summary${buildQs({ month, year })}`),

  getOverview: (year?: number) =>
    apiClient.get<FinanceOverview>(`/finance/overview${buildQs({ year })}`),

  list: (params?: { month?: number; year?: number; type?: TransactionType; category?: TransactionCategory; page?: number; perPage?: number }) =>
    apiClient.get<{ data: TransactionResponse[]; total: number }>(`/finance${buildQs(params || {})}`),

  getById: (id: string) => apiClient.get<TransactionResponse>(`/finance/${id}`),

  create: (data: CreateTransactionDto) =>
    apiClient.post<TransactionResponse>('/finance', data),

  update: (id: string, data: UpdateTransactionDto) =>
    apiClient.put<TransactionResponse>(`/finance/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/finance/${id}`),

  exportCsvUrl: (month?: number, year?: number) =>
    `/finance/export/csv${buildQs({ month, year })}`,

  // Budgets
  getBudgets: (year: number, month?: number) =>
    apiClient.get<BudgetResponse[]>(`/finance/budgets${buildQs({ year, month })}`),

  createBudget: (data: CreateBudgetDto) =>
    apiClient.post<BudgetResponse>('/finance/budgets', data),

  updateBudget: (id: string, data: Partial<CreateBudgetDto>) =>
    apiClient.put<BudgetResponse>(`/finance/budgets/${id}`, data),

  deleteBudget: (id: string) => apiClient.delete<void>(`/finance/budgets/${id}`),

  // Recurring
  getRecurring: (activeOnly?: boolean) =>
    apiClient.get<RecurringResponse[]>(`/finance/recurring${buildQs({ activeOnly: activeOnly ? 'true' : undefined })}`),

  createRecurring: (data: CreateRecurringDto) =>
    apiClient.post<RecurringResponse>('/finance/recurring', data),

  updateRecurring: (id: string, data: Partial<CreateRecurringDto>) =>
    apiClient.put<RecurringResponse>(`/finance/recurring/${id}`, data),

  toggleRecurring: (id: string) =>
    apiClient.patch<RecurringResponse>(`/finance/recurring/${id}/toggle`),

  applyRecurring: (id: string, date: string) =>
    apiClient.post<TransactionResponse>(`/finance/recurring/${id}/apply${buildQs({ date })}`),

  deleteRecurring: (id: string) => apiClient.delete<void>(`/finance/recurring/${id}`),
};
