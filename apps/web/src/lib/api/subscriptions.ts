import { apiClient } from './client';
import type { PlanConfig, TenantSubscription, SubscriptionPlan } from '@attrio/contracts';

export type { PlanConfig, TenantSubscription };

export const subscriptionsApi = {
  getPlans: () => apiClient.get<PlanConfig[]>('/subscriptions/plans'),

  getCurrent: () => apiClient.get<TenantSubscription>('/subscriptions/current'),

  createCheckout: (plan: SubscriptionPlan) =>
    apiClient.post<{ url: string }>('/subscriptions/checkout', { plan }),

  createPortal: () =>
    apiClient.post<{ url: string }>('/subscriptions/portal', {}),
};
