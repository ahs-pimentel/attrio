import { IsEnum, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan, SubscriptionStatus } from '@attrio/contracts';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'ID do condominio' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ enum: SubscriptionPlan, description: 'Plano desejado' })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiPropertyOptional({ description: 'URL de retorno apos sucesso' })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({ description: 'URL de retorno apos cancelamento' })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class CreatePortalDto {
  @ApiProperty({ description: 'ID do condominio' })
  @IsUUID()
  tenantId: string;

  @ApiPropertyOptional({ description: 'URL de retorno apos sair do portal' })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}

export class PlanResponseDto {
  @ApiProperty({ enum: SubscriptionPlan })
  key: SubscriptionPlan;

  @ApiProperty()
  name: string;

  @ApiProperty()
  maxUnits: number;

  @ApiProperty()
  priceMonthly: number;

  @ApiProperty({ type: [String] })
  features: string[];
}

export class SubscriptionResponseDto {
  @ApiProperty({ enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty()
  maxUnits: number;

  @ApiProperty()
  currentUnits: number;

  @ApiProperty({ nullable: true })
  currentPeriodEnd: string | null;

  @ApiProperty()
  cancelAtPeriodEnd: boolean;
}

export class CheckoutResponseDto {
  @ApiProperty()
  url: string;
}
