'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { AgendaItemResponse, VoteSummary } from '@/lib/api';
import { AgendaItemForm } from './AgendaItemForm';
import { VoteResultChart } from './VoteResultChart';

interface AgendaItemsListProps {
  assemblyId: string;
  items: AgendaItemResponse[];
  assemblyStatus: string;
  isSyndic: boolean;
  onCreateItem: (data: { title: string; description?: string; requiresQuorum?: boolean; quorumType?: 'simple' | 'qualified' | 'unanimous' }) => Promise<unknown>;
  onUpdateItem: (id: string, data: { title?: string; description?: string }) => Promise<unknown>;
  onDeleteItem: (id: string) => Promise<void>;
  onStartVoting: (id: string) => Promise<void>;
  onCloseVoting: (id: string) => Promise<void>;
  onGetVoteResult: (id: string) => Promise<VoteSummary>;
}

/**
 * AgendaItemsList - Lista de pautas da assembleia com controles de votacao
 */
export function AgendaItemsList({
  assemblyId,
  items,
  assemblyStatus,
  isSyndic,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onStartVoting,
  onCloseVoting,
  onGetVoteResult,
}: AgendaItemsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItemResponse | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Record<string, VoteSummary>>({});
  const [error, setError] = useState<string | null>(null);

  // Verifica se a assembleia permite edicao de pautas
  const canEditAgenda = assemblyStatus === 'SCHEDULED' || assemblyStatus === 'IN_PROGRESS';
  const canVote = assemblyStatus === 'IN_PROGRESS';

  const handleCreate = async (data: { title: string; description?: string; requiresQuorum?: boolean; quorumType?: 'simple' | 'qualified' | 'unanimous' }) => {
    try {
      setError(null);
      await onCreateItem(data);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pauta');
    }
  };

  const handleUpdate = async (data: { title: string; description?: string }) => {
    if (!editingItem) return;
    try {
      setError(null);
      await onUpdateItem(editingItem.id, data);
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar pauta');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pauta?')) return;
    try {
      setError(null);
      setLoadingId(id);
      await onDeleteItem(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir pauta');
    } finally {
      setLoadingId(null);
    }
  };

  const handleStartVoting = async (id: string) => {
    try {
      setError(null);
      setLoadingId(id);
      await onStartVoting(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar votacao');
    } finally {
      setLoadingId(null);
    }
  };

  const handleCloseVoting = async (id: string) => {
    if (!confirm('Tem certeza que deseja encerrar a votacao desta pauta?')) return;
    try {
      setError(null);
      setLoadingId(id);
      await onCloseVoting(id);
      // Carrega resultado apos encerrar
      const result = await onGetVoteResult(id);
      setExpandedResults((prev) => ({ ...prev, [id]: result }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao encerrar votacao');
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleResult = async (id: string) => {
    if (expandedResults[id]) {
      // Remove do estado para colapsar
      setExpandedResults((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    } else {
      // Carrega resultado
      try {
        const result = await onGetVoteResult(id);
        setExpandedResults((prev) => ({ ...prev, [id]: result }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar resultado');
      }
    }
  };

  // Ordena itens por orderIndex
  const sortedItems = [...items].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pautas da Assembleia</CardTitle>
          {isSyndic && canEditAgenda && (
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancelar' : 'Nova Pauta'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Formulario de nova pauta */}
        {showForm && (
          <div className="mb-6">
            <AgendaItemForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Formulario de edicao */}
        {editingItem && (
          <div className="mb-6">
            <AgendaItemForm
              initialData={editingItem}
              onSubmit={handleUpdate}
              onCancel={() => setEditingItem(null)}
            />
          </div>
        )}

        {/* Lista de pautas */}
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma pauta cadastrada
          </div>
        ) : (
          <div className="space-y-4">
            {sortedItems.map((item, index) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                        {index + 1}
                      </span>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <StatusBadge status={item.status} type="agenda" />
                    </div>
                    {item.description && (
                      <p className="text-gray-600 text-sm ml-9 mb-2">{item.description}</p>
                    )}
                    {item.requiresQuorum && (
                      <div className="ml-9 text-xs text-gray-500">
                        Quorum: {item.quorumType === 'simple' ? 'Simples' : item.quorumType === 'qualified' ? 'Qualificado' : 'Unanime'}
                      </div>
                    )}
                  </div>

                  {/* Botoes de acao */}
                  {isSyndic && (
                    <div className="flex items-center gap-2 ml-4">
                      {/* Pauta pendente - pode editar, excluir ou iniciar votacao */}
                      {item.status === 'PENDING' && canVote && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartVoting(item.id)}
                            loading={loadingId === item.id}
                          >
                            Iniciar Votacao
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(item)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            loading={loadingId === item.id}
                          >
                            Excluir
                          </Button>
                        </>
                      )}

                      {/* Pauta pendente antes da assembleia iniciar */}
                      {item.status === 'PENDING' && !canVote && canEditAgenda && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(item)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            loading={loadingId === item.id}
                          >
                            Excluir
                          </Button>
                        </>
                      )}

                      {/* Pauta em votacao - pode encerrar */}
                      {item.status === 'VOTING' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCloseVoting(item.id)}
                          loading={loadingId === item.id}
                        >
                          Encerrar Votacao
                        </Button>
                      )}

                      {/* Pauta votada/fechada - pode ver resultado */}
                      {item.status === 'CLOSED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleResult(item.id)}
                        >
                          {expandedResults[item.id] ? 'Ocultar Resultado' : 'Ver Resultado'}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Nao-sindicos podem ver resultado de pautas fechadas */}
                  {!isSyndic && item.status === 'CLOSED' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggleResult(item.id)}
                    >
                      {expandedResults[item.id] ? 'Ocultar Resultado' : 'Ver Resultado'}
                    </Button>
                  )}
                </div>

                {/* Indicador de votacao em andamento */}
                {item.status === 'VOTING' && (
                  <div className="mt-3 ml-9 flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
                    <div className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Votacao em andamento
                    {item.votingStartedAt && (
                      <span className="text-gray-500 ml-2">
                        Iniciada em {new Date(item.votingStartedAt).toLocaleTimeString('pt-BR')}
                      </span>
                    )}
                  </div>
                )}

                {/* Resultado da votacao */}
                {expandedResults[item.id] && (
                  <div className="mt-4 ml-9">
                    <VoteResultChart summary={expandedResults[item.id]} />
                  </div>
                )}

                {/* Resultado registrado */}
                {item.result && (
                  <div className="mt-3 ml-9 text-sm">
                    <span className="font-medium text-gray-700">Resultado: </span>
                    <span className="text-gray-600">{item.result}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
