'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthContext } from '@/components/AuthProvider';
import { subscriptionsApi } from '@/lib/api';
import { SubscriptionPlan, SubscriptionStatus } from '@attrio/contracts';
import type { PlanConfig, TenantSubscription } from '@attrio/contracts';

const planOrder: SubscriptionPlan[] = [
  SubscriptionPlan.STARTER,
  SubscriptionPlan.BASIC,
  SubscriptionPlan.PROFESSIONAL,
  SubscriptionPlan.ENTERPRISE,
];

const statusLabels: Record<string, { label: string; color: string }> = {
  [SubscriptionStatus.ACTIVE]: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  [SubscriptionStatus.TRIALING]: { label: 'Periodo de teste', color: 'bg-blue-100 text-blue-800' },
  [SubscriptionStatus.PAST_DUE]: { label: 'Pagamento pendente', color: 'bg-yellow-100 text-yellow-800' },
  [SubscriptionStatus.CANCELED]: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  [SubscriptionStatus.UNPAID]: { label: 'Inadimplente', color: 'bg-red-100 text-red-800' },
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export default function BillingPage() {
  const { isSyndic } = useAuthContext();
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Detectar retorno do Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setSuccessMsg('Assinatura realizada com sucesso! Seu plano foi atualizado.');
      // Limpar query params
      window.history.replaceState({}, '', '/dashboard/billing');
    }
    if (params.get('canceled') === 'true') {
      setError('Checkout cancelado. Nenhuma cobranca foi realizada.');
      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [plansData, subData] = await Promise.all([
        subscriptionsApi.getPlans(),
        subscriptionsApi.getCurrent(),
      ]);
      setPlans(plansData);
      setSubscription(subData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckout = async (plan: SubscriptionPlan) => {
    setCheckingOut(plan);
    try {
      const { url } = await subscriptionsApi.createCheckout(plan);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar checkout');
      setCheckingOut(null);
    }
  };

  const handleOpenPortal = async () => {
    setOpeningPortal(true);
    try {
      const { url } = await subscriptionsApi.createPortal();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao abrir portal');
      setOpeningPortal(false);
    }
  };

  const currentPlanIndex = subscription
    ? planOrder.indexOf(subscription.plan)
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Plano e Cobranca</h1>
        <p className="text-gray-600">Gerencie a assinatura do seu condominio</p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-4 text-green-500 hover:text-green-700">
            Fechar
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
            Fechar
          </button>
        </div>
      )}

      {/* Plano atual */}
      {subscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Plano Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {plans.find((p) => p.key === subscription.plan)?.name || subscription.plan}
                </p>
                <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[subscription.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                  {statusLabels[subscription.status]?.label || subscription.status}
                </span>
              </div>
              <div className="border-l border-gray-200 pl-6">
                <p className="text-sm text-gray-500">Unidades</p>
                <p className="text-lg font-semibold text-gray-900">
                  {subscription.currentUnits} / {subscription.maxUnits}
                </p>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full ${
                      subscription.currentUnits / subscription.maxUnits > 0.8
                        ? 'bg-red-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, (subscription.currentUnits / subscription.maxUnits) * 100)}%` }}
                  />
                </div>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="border-l border-gray-200 pl-6">
                  <p className="text-sm text-gray-500">Proximo vencimento</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {subscription.plan !== SubscriptionPlan.STARTER && (
                <div className="ml-auto">
                  <Button
                    variant="secondary"
                    onClick={handleOpenPortal}
                    loading={openingPortal}
                  >
                    Gerenciar Assinatura
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de planos */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Planos Disponiveis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, idx) => {
          const isCurrent = subscription?.plan === plan.key;
          const isDowngrade = idx < currentPlanIndex;
          const isUpgrade = idx > currentPlanIndex;
          const isPopular = plan.key === SubscriptionPlan.PROFESSIONAL;

          return (
            <div
              key={plan.key}
              className={`relative rounded-xl border-2 p-6 transition-all ${
                isCurrent
                  ? 'border-blue-600 bg-blue-50/50 shadow-lg'
                  : isPopular
                  ? 'border-blue-300 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isPopular && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Plano Atual
                </span>
              )}

              <h3 className="text-lg font-bold text-gray-900 mt-2">{plan.name}</h3>
              <div className="mt-3">
                {plan.priceMonthly === 0 ? (
                  <p className="text-3xl font-bold text-gray-900">Gratis</p>
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatPrice(plan.priceMonthly)}
                    </p>
                    <p className="text-sm text-gray-500">por mes</p>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 mt-2">
                Ate <strong>{plan.maxUnits}</strong> unidades
              </p>

              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Plano atual
                  </Button>
                ) : plan.key === SubscriptionPlan.STARTER ? (
                  <Button variant="secondary" className="w-full" disabled={isDowngrade}>
                    {isDowngrade ? 'Plano gratuito' : 'Plano atual'}
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout(plan.key)}
                    loading={checkingOut === plan.key}
                    disabled={!!checkingOut}
                  >
                    Assinar
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-full" disabled>
                    Downgrade
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
