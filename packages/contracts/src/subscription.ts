/** Planos de assinatura disponiveis */
export enum SubscriptionPlan {
  STARTER = 'STARTER',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

/** Status da assinatura */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  UNPAID = 'UNPAID',
}

/** Configuracao de um plano */
export interface PlanConfig {
  key: SubscriptionPlan;
  name: string;
  maxUnits: number;
  priceMonthly: number;
  features: string[];
}

/** Dados da assinatura do tenant */
export interface TenantSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  maxUnits: number;
  currentUnits: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/** Dados de assinatura de um tenant (visao SAAS_ADMIN) */
export interface TenantSubscriptionSummary {
  tenantId: string;
  tenantName: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  maxUnits: number;
  currentUnits: number;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}
