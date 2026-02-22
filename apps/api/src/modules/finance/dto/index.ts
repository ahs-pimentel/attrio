import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TransactionCategory, TransactionType } from '@attrio/contracts';

// ─── Transaction DTOs ──────────────────────────────────────────────────────

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ enum: TransactionCategory })
  @IsEnum(TransactionCategory)
  @IsOptional()
  category?: TransactionCategory;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: 1500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: '2026-02-20' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ example: 'NF-1234' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  reference?: string;
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}

export class TransactionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantId: string;
  @ApiProperty({ enum: TransactionType }) type: TransactionType;
  @ApiProperty({ enum: TransactionCategory }) category: TransactionCategory;
  @ApiProperty() description: string;
  @ApiProperty() amount: number;
  @ApiProperty() date: string;
  @ApiPropertyOptional() reference: string | null;
  @ApiProperty() createdBy: string;
  @ApiProperty() createdByName: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class FinanceSummaryDto {
  @ApiProperty() totalIncome: number;
  @ApiProperty() totalExpenses: number;
  @ApiProperty() balance: number;
  @ApiProperty() transactionCount: number;
}

// ─── Cashflow ──────────────────────────────────────────────────────────────

export class CashflowMonthDto {
  @ApiProperty() month: number;
  @ApiProperty() year: number;
  @ApiProperty() label: string;
  @ApiProperty() income: number;
  @ApiProperty() expenses: number;
  @ApiProperty() balance: number;
}

export class CategoryBreakdownDto {
  @ApiProperty({ enum: TransactionCategory }) category: TransactionCategory;
  @ApiProperty() label: string;
  @ApiProperty() total: number;
  @ApiProperty() count: number;
  @ApiProperty() percentage: number;
}

export class FinanceOverviewDto extends FinanceSummaryDto {
  @ApiProperty({ type: [CashflowMonthDto] }) cashflow: CashflowMonthDto[];
  @ApiProperty({ type: [CategoryBreakdownDto] }) expensesByCategory: CategoryBreakdownDto[];
  @ApiProperty({ type: [CategoryBreakdownDto] }) incomeByCategory: CategoryBreakdownDto[];
}

// ─── Budget DTOs ───────────────────────────────────────────────────────────

export class CreateBudgetDto {
  @ApiProperty({ enum: TransactionCategory })
  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 5000.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  notes?: string;
}

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {}

export class BudgetResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantId: string;
  @ApiProperty({ enum: TransactionCategory }) category: TransactionCategory;
  @ApiProperty() year: number;
  @ApiProperty() month: number;
  @ApiProperty() amount: number;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty() spent: number;
  @ApiProperty() remaining: number;
  @ApiProperty() percentageUsed: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

// ─── Recurring DTOs ────────────────────────────────────────────────────────

export enum RecurringFrequency {
  MONTHLY = 'MONTHLY',
  BIMONTHLY = 'BIMONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUAL = 'SEMIANNUAL',
  ANNUAL = 'ANNUAL',
}

export class CreateRecurringDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ enum: TransactionCategory })
  @IsEnum(TransactionCategory)
  @IsOptional()
  category?: TransactionCategory;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: 1500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: RecurringFrequency })
  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @ApiProperty({ example: '2026-02-01', description: 'Data da primeira ocorrencia' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Data final (opcional)' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  reference?: string;
}

export class UpdateRecurringDto extends PartialType(CreateRecurringDto) {}

export class RecurringResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tenantId: string;
  @ApiProperty({ enum: TransactionType }) type: TransactionType;
  @ApiProperty({ enum: TransactionCategory }) category: TransactionCategory;
  @ApiProperty() description: string;
  @ApiProperty() amount: number;
  @ApiProperty({ enum: RecurringFrequency }) frequency: RecurringFrequency;
  @ApiProperty() startDate: string;
  @ApiPropertyOptional() endDate: string | null;
  @ApiPropertyOptional() reference: string | null;
  @ApiProperty() active: boolean;
  @ApiProperty() nextDueDate: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
