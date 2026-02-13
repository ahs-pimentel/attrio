'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import type { MinutesResponse } from '@/lib/api';

interface MinutesActionsProps {
  minutes: MinutesResponse;
  isSyndic: boolean;
  onApprove: () => Promise<void>;
  onPublish: () => Promise<void>;
  onEdit: () => void;
  onGenerate: () => Promise<void>;
}

/**
 * MinutesActions - Acoes de workflow da ata (aprovar/publicar)
 */
export function MinutesActions({
  minutes,
  isSyndic,
  onApprove,
  onPublish,
  onEdit,
  onGenerate,
}: MinutesActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: 'approve' | 'publish' | 'generate') => {
    try {
      setLoading(action);
      setError(null);

      switch (action) {
        case 'approve':
          if (!confirm('Tem certeza que deseja aprovar esta ata?')) return;
          await onApprove();
          break;
        case 'publish':
          if (!confirm('Tem certeza que deseja publicar esta ata? Apos publicada, ela ficara disponivel para todos os moradores.')) return;
          await onPublish();
          break;
        case 'generate':
          if (!confirm('Deseja regenerar a ata? O conteudo atual sera substituido.')) return;
          await onGenerate();
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar acao');
    } finally {
      setLoading(null);
    }
  };

  // Define acoes disponiveis baseado no status
  const getAvailableActions = () => {
    const actions: Array<{
      key: string;
      label: string;
      description: string;
      variant: 'primary' | 'secondary' | 'danger' | 'ghost';
      onClick: () => void;
      disabled?: boolean;
    }> = [];

    if (!isSyndic) return actions;

    switch (minutes.status) {
      case 'DRAFT':
        actions.push({
          key: 'edit',
          label: 'Editar Ata',
          description: 'Modifique o conteudo da ata',
          variant: 'secondary',
          onClick: onEdit,
        });
        actions.push({
          key: 'generate',
          label: 'Regenerar Ata',
          description: 'Gera novamente a ata automaticamente',
          variant: 'ghost',
          onClick: () => handleAction('generate'),
        });
        actions.push({
          key: 'approve',
          label: 'Enviar para Aprovacao',
          description: 'Envia a ata para revisao e aprovacao',
          variant: 'primary',
          onClick: () => handleAction('approve'),
          disabled: !minutes.content,
        });
        break;

      case 'PENDING_REVIEW':
        actions.push({
          key: 'edit',
          label: 'Voltar para Edicao',
          description: 'Retorne a ata para modo de edicao',
          variant: 'secondary',
          onClick: onEdit,
        });
        actions.push({
          key: 'approve',
          label: 'Aprovar Ata',
          description: 'Aprove a ata apos revisao',
          variant: 'primary',
          onClick: () => handleAction('approve'),
        });
        break;

      case 'APPROVED':
        actions.push({
          key: 'publish',
          label: 'Publicar Ata',
          description: 'Publique a ata para todos os moradores',
          variant: 'primary',
          onClick: () => handleAction('publish'),
        });
        break;

      case 'PUBLISHED':
        // Ata publicada - sem acoes disponiveis
        break;
    }

    return actions;
  };

  const actions = getAvailableActions();

  if (!isSyndic && minutes.status !== 'PUBLISHED') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Acoes da Ata</CardTitle>
          <StatusBadge status={minutes.status} type="minutes" />
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Workflow visual */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED'].map((status, index) => (
              <div key={status} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    getStatusOrder(minutes.status) >= index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      getStatusOrder(minutes.status) > index
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                    style={{ width: '60px' }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Rascunho</span>
            <span>Revisao</span>
            <span>Aprovada</span>
            <span>Publicada</span>
          </div>
        </div>

        {/* Descricao do status atual */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">{getStatusDescription(minutes.status)}</p>
        </div>

        {/* Botoes de acao */}
        {actions.length > 0 ? (
          <div className="space-y-3">
            {actions.map((action) => (
              <div
                key={action.key}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">{action.label}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
                <Button
                  variant={action.variant}
                  size="sm"
                  onClick={action.onClick}
                  loading={loading === action.key}
                  disabled={action.disabled}
                >
                  {action.label}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            {minutes.status === 'PUBLISHED'
              ? 'A ata foi publicada e esta disponivel para todos os moradores.'
              : 'Nenhuma acao disponivel.'}
          </div>
        )}

        {/* Informacoes de aprovacao */}
        {minutes.approvedAt && minutes.approvedBy && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
            Aprovada por {minutes.approvedBy} em{' '}
            {new Date(minutes.approvedAt).toLocaleString('pt-BR')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helpers
function getStatusOrder(status: string): number {
  const order: Record<string, number> = {
    DRAFT: 0,
    PENDING_REVIEW: 1,
    APPROVED: 2,
    PUBLISHED: 3,
  };
  return order[status] ?? 0;
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    DRAFT:
      'A ata esta em modo rascunho. Voce pode editar o conteudo antes de enviar para aprovacao.',
    PENDING_REVIEW:
      'A ata esta aguardando revisao e aprovacao. Revise o conteudo antes de aprovar.',
    APPROVED:
      'A ata foi aprovada. Agora voce pode publica-la para que todos os moradores tenham acesso.',
    PUBLISHED:
      'A ata foi publicada e esta disponivel para consulta por todos os moradores do condominio.',
  };
  return descriptions[status] || '';
}
