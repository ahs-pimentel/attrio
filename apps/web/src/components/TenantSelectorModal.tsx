'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useAuthContext } from './AuthProvider';

export function TenantSelectorModal() {
  const {
    showTenantSelector,
    setShowTenantSelector,
    availableTenants,
    switchTenant,
    switchingTenant,
    profile,
  } = useAuthContext();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  if (!showTenantSelector || availableTenants.length <= 1) return null;

  const handleSelect = async (tenantId: string) => {
    if (switchingTenant) return;
    setSwitchingId(tenantId);
    await switchTenant(tenantId);
  };

  const canDismiss = !!profile?.tenantId;

  return (
    <Modal
      isOpen={showTenantSelector}
      onClose={() => canDismiss && setShowTenantSelector(false)}
      title="Selecione o Condominio"
      size="md"
      showCloseButton={canDismiss}
    >
      <p className="text-sm text-gray-600 mb-4">
        Voce gerencia mais de um condominio. Selecione qual deseja acessar:
      </p>

      <div className="space-y-2">
        {availableTenants.map((tenant) => (
          <button
            key={tenant.id}
            onClick={() => handleSelect(tenant.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              tenant.id === profile?.tenantId
                ? 'border-green-300 bg-green-50/50'
                : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
            }`}
            disabled={switchingTenant}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{tenant.name}</p>
                <p className="text-sm text-gray-500">{tenant.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                {switchingId === tenant.id && (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                )}
                {tenant.id === profile?.tenantId && !switchingTenant && (
                  <span className="text-xs px-2 py-1 bg-green-600 text-white rounded-full">
                    Ativo
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
