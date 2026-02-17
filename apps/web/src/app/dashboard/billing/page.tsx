'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { subscriptionsApi } from '@/lib/api';
import { SubscriptionPlan, SubscriptionStatus } from '@attrio/contracts';
import type { PlanConfig, TenantSubscriptionSummary } from '@attrio/contracts';

const statusLabels: Record<string, { label: string; color: string }> = {
  [SubscriptionStatus.ACTIVE]: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  [SubscriptionStatus.TRIALING]: { label: 'Teste', color: 'bg-blue-100 text-blue-800' },
  [SubscriptionStatus.PAST_DUE]: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
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
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [tenants, setTenants] = useState<TenantSubscriptionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [upgradeTenant, setUpgradeTenant] = useState<TenantSubscriptionSummary | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setSuccessMsg('Assinatura realizada com sucesso! O plano foi atualizado.');
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
      const [plansData, tenantsData] = await Promise.all([
        subscriptionsApi.getPlans(),
        subscriptionsApi.getTenants(),
      ]);
      setPlans(plansData);
      setTenants(tenantsData);
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

  const handleCheckout = async (tenantId: string, plan: SubscriptionPlan) => {
    setCheckingOut(`${tenantId}-${plan}`);
    try {
      const { url } = await subscriptionsApi.createCheckout(tenantId, plan);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar checkout');
      setCheckingOut(null);
    }
  };

  const handleOpenPortal = async (tenantId: string) => {
    setOpeningPortal(tenantId);
    try {
      const { url } = await subscriptionsApi.createPortal(tenantId);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao abrir portal');
      setOpeningPortal(null);
    }
  };

  const getPlanName = (key: string) => plans.find((p) => p.key === key)?.name || key;

  // Stats
  const totalTenants = tenants.length;
  const activePaid = tenants.filter(
    (t) => t.plan !== SubscriptionPlan.STARTER && t.status === SubscriptionStatus.ACTIVE,
  ).length;
  const freeTenants = tenants.filter((t) => t.plan === SubscriptionPlan.STARTER).length;

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
        <h1 className="text-2xl font-bold text-gray-900">Planos e Assinaturas</h1>
        <p className="text-gray-600">Gerencie os planos de todos os condominios</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total de Condominios</p>
            <p className="text-3xl font-bold text-gray-900">{totalTenants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Assinaturas Pagas</p>
            <p className="text-3xl font-bold text-green-600">{activePaid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Plano Gratuito</p>
            <p className="text-3xl font-bold text-gray-400">{freeTenants}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de condominios */}
      <Card>
        <CardHeader>
          <CardTitle>Condominios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Condominio</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Plano</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Unidades</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Vencimento</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => {
                  const usagePercent = tenant.maxUnits > 0
                    ? Math.min(100, (tenant.currentUnits / tenant.maxUnits) * 100)
                    : 0;
                  const isHighUsage = usagePercent > 80;

                  return (
                    <tr key={tenant.tenantId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{tenant.tenantName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{getPlanName(tenant.plan)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusLabels[tenant.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[tenant.status]?.label || tenant.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${isHighUsage ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                            {tenant.currentUnits}/{tenant.maxUnits}
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${isHighUsage ? 'bg-red-500' : 'bg-blue-600'}`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {tenant.currentPeriodEnd
                          ? new Date(tenant.currentPeriodEnd).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tenant.plan !== SubscriptionPlan.STARTER && tenant.stripeCustomerId && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenPortal(tenant.tenantId)}
                              loading={openingPortal === tenant.tenantId}
                            >
                              Gerenciar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => setUpgradeTenant(tenant)}
                          >
                            Alterar Plano
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Nenhum condominio cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de upgrade */}
      {upgradeTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Alterar Plano</h2>
                <p className="text-gray-600">{upgradeTenant.tenantName}</p>
              </div>
              <button
                onClick={() => setUpgradeTenant(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const isCurrent = upgradeTenant.plan === plan.key;
                const isStarter = plan.key === SubscriptionPlan.STARTER;

                return (
                  <div
                    key={plan.key}
                    className={`relative rounded-xl border-2 p-4 transition-all ${
                      isCurrent
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        Atual
                      </span>
                    )}
                    <h3 className="text-base font-bold text-gray-900 mt-1">{plan.name}</h3>
                    <div className="mt-2">
                      {plan.priceMonthly === 0 ? (
                        <p className="text-2xl font-bold text-gray-900">Gratis</p>
                      ) : (
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{formatPrice(plan.priceMonthly)}</p>
                          <p className="text-xs text-gray-500">por mes</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Ate <strong>{plan.maxUnits}</strong> unidades
                    </p>
                    <div className="mt-4">
                      {isCurrent ? (
                        <Button variant="secondary" className="w-full" size="sm" disabled>
                          Plano atual
                        </Button>
                      ) : isStarter ? (
                        <Button variant="secondary" className="w-full" size="sm" disabled>
                          Gratuito
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => handleCheckout(upgradeTenant.tenantId, plan.key)}
                          loading={checkingOut === `${upgradeTenant.tenantId}-${plan.key}`}
                          disabled={!!checkingOut}
                        >
                          Assinar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
