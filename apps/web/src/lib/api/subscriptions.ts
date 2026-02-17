import { apiClient } from './client';
import type { PlanConfig, TenantSubscriptionSummary, SubscriptionPlan } from '@attrio/contracts';

export type { PlanConfig, TenantSubscriptionSummary };

export const subscriptionsApi = {
  getPlans: () => apiClient.get<PlanConfig[]>('/subscriptions/plans'),

  getTenants: () => apiClient.get<TenantSubscriptionSummary[]>('/subscriptions/tenants'),

  createCheckout: (tenantId: string, plan: SubscriptionPlan) =>
    apiClient.post<{ url: string }>('/subscriptions/checkout', { tenantId, plan }),

  createPortal: (tenantId: string) =>
    apiClient.post<{ url: string }>('/subscriptions/portal', { tenantId }),
};
