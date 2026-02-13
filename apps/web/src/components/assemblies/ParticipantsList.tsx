'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/Table';
import { ParticipantResponse, RegisterParticipantDto } from '@/lib/api';
import { RegisterParticipantForm } from './RegisterParticipantForm';
import { AttendanceStats } from './AttendanceStats';
import type { AttendanceStatus } from '@/lib/api';

interface ParticipantsListProps {
  assemblyId: string;
  participants: ParticipantResponse[];
  attendance: AttendanceStatus | null;
  assemblyStatus: string;
  isSyndic: boolean;
  onRegister: (data: RegisterParticipantDto) => Promise<unknown>;
  onRemove: (id: string) => Promise<void>;
  onMarkJoined: (id: string) => Promise<void>;
  onMarkLeft: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

/**
 * ParticipantsList - Lista de participantes com controle de presenca
 */
export function ParticipantsList({
  assemblyId,
  participants,
  attendance,
  assemblyStatus,
  isSyndic,
  onRegister,
  onRemove,
  onMarkJoined,
  onMarkLeft,
  onRefresh,
}: ParticipantsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManageParticipants = assemblyStatus === 'SCHEDULED' || assemblyStatus === 'IN_PROGRESS';
  const canMarkPresence = assemblyStatus === 'IN_PROGRESS';

  const handleRegister = async (data: RegisterParticipantDto) => {
    try {
      setError(null);
      await onRegister(data);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar participante');
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este participante?')) return;
    try {
      setError(null);
      setLoadingId(id);
      await onRemove(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover participante');
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkJoined = async (id: string) => {
    try {
      setError(null);
      setLoadingId(id);
      await onMarkJoined(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar entrada');
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkLeft = async (id: string) => {
    try {
      setError(null);
      setLoadingId(id);
      await onMarkLeft(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar saida');
    } finally {
      setLoadingId(null);
    }
  };

  // Determina status de presenca do participante
  const getPresenceStatus = (participant: ParticipantResponse) => {
    if (participant.leftAt) return { label: 'Saiu', variant: 'secondary' as const };
    if (participant.joinedAt) return { label: 'Presente', variant: 'success' as const };
    return { label: 'Aguardando', variant: 'default' as const };
  };

  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Estatisticas de presenca */}
      {attendance && <AttendanceStats attendance={attendance} />}

      {/* Lista de participantes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Participantes</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Atualizar
              </Button>
              {isSyndic && canManageParticipants && (
                <Button size="sm" onClick={() => setShowForm(!showForm)}>
                  {showForm ? 'Cancelar' : 'Registrar Participante'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Formulario de registro */}
          {showForm && (
            <div className="mb-6">
              <RegisterParticipantForm
                assemblyId={assemblyId}
                onSubmit={handleRegister}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* Tabela de participantes */}
          <Table>
            <TableHeader>
              <TableRow hoverable={false}>
                <TableHead>Unidade</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Procurador</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saida</TableHead>
                <TableHead>Peso</TableHead>
                {isSyndic && canManageParticipants && <TableHead>Acoes</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.length === 0 ? (
                <TableEmpty
                  colSpan={isSyndic && canManageParticipants ? 8 : 7}
                  message="Nenhum participante registrado"
                />
              ) : (
                participants.map((participant) => {
                  const presenceStatus = getPresenceStatus(participant);
                  return (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">
                        {participant.unitIdentifier || '-'}
                      </TableCell>
                      <TableCell>{participant.residentName || '-'}</TableCell>
                      <TableCell>
                        {participant.proxyName || (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={presenceStatus.variant}>
                          {presenceStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTime(participant.joinedAt)}</TableCell>
                      <TableCell>{formatTime(participant.leftAt)}</TableCell>
                      <TableCell>{participant.votingWeight}</TableCell>
                      {isSyndic && canManageParticipants && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {/* Botao marcar entrada */}
                            {canMarkPresence && !participant.joinedAt && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkJoined(participant.id)}
                                loading={loadingId === participant.id}
                                title="Marcar entrada"
                              >
                                <svg
                                  className="w-4 h-4 text-green-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                                  />
                                </svg>
                              </Button>
                            )}

                            {/* Botao marcar saida */}
                            {canMarkPresence && participant.joinedAt && !participant.leftAt && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkLeft(participant.id)}
                                loading={loadingId === participant.id}
                                title="Marcar saida"
                              >
                                <svg
                                  className="w-4 h-4 text-orange-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
                                  />
                                </svg>
                              </Button>
                            )}

                            {/* Botao remover */}
                            {!participant.joinedAt && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemove(participant.id)}
                                loading={loadingId === participant.id}
                                title="Remover participante"
                              >
                                <svg
                                  className="w-4 h-4 text-red-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                  />
                                </svg>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
