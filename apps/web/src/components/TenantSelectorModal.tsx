'use client';

import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
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
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  if (!showTenantSelector || availableTenants.length <= 1) return null;

  const handleSelect = async () => {
    if (!selectedTenantId) return;
    await switchTenant(selectedTenantId);
  };

  // Pode fechar se ja tem tenant ativo
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
            onClick={() => setSelectedTenantId(tenant.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedTenantId === tenant.id
                ? 'border-blue-600 bg-blue-50'
                : tenant.id === profile?.tenantId
                ? 'border-green-300 bg-green-50/50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            disabled={switchingTenant}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{tenant.name}</p>
                <p className="text-sm text-gray-500">{tenant.slug}</p>
              </div>
              {tenant.id === profile?.tenantId && (
                <span className="text-xs px-2 py-1 bg-green-600 text-white rounded-full">
                  Ativo
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <ModalFooter>
        {canDismiss && (
          <Button
            variant="secondary"
            onClick={() => setShowTenantSelector(false)}
            disabled={switchingTenant}
          >
            Cancelar
          </Button>
        )}
        <Button
          onClick={handleSelect}
          disabled={!selectedTenantId || switchingTenant}
          loading={switchingTenant}
        >
          Acessar Condominio
        </Button>
      </ModalFooter>
    </Modal>
  );
}
