'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { sessionApi } from '@/lib/api';
import { ParticipantApprovalStatus, AgendaItemStatus, AssemblyStatus, VoteChoice } from '@attrio/contracts';

interface SessionData {
  participantId: string;
  assemblyId: string;
  assemblyTitle: string;
  assemblyStatus: AssemblyStatus;
  unitIdentifier: string;
  proxyName: string | null;
  approvalStatus: ParticipantApprovalStatus;
  rejectionReason: string | null;
  checkinTime: string;
  canVote: boolean;
}

interface AgendaItem {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  status: AgendaItemStatus;
  hasVoted: boolean;
  votingOtpRequired: boolean;
}

export default function ParticipantPage() {
  const params = useParams();
  const sessionToken = params.sessionToken as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [votingOtp, setVotingOtp] = useState('');
  const [voting, setVoting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Valida sessao
      const sessionData = await sessionApi.validate(sessionToken);
      setSession(sessionData as SessionData);

      // Busca pautas
      try {
        const agendaData = await sessionApi.getAgenda(sessionToken);
        setAgendaItems(agendaData as AgendaItem[]);
      } catch {
        // Ignora erro de pautas
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sessao invalida ou expirada');
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    fetchData();

    // Atualiza a cada 10 segundos
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleVote = async (choice: VoteChoice) => {
    if (!selectedItem || !session) return;

    if (selectedItem.votingOtpRequired && votingOtp.length !== 6) {
      setError('Informe o codigo OTP de 6 digitos');
      return;
    }

    setVoting(true);
    setError(null);

    try {
      await sessionApi.castVote(sessionToken, selectedItem.id, votingOtp, choice);

      setVoteSuccess(true);
      setSelectedItem(null);
      setVotingOtp('');

      // Recarrega dados
      await fetchData();

      setTimeout(() => setVoteSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar voto');
    } finally {
      setVoting(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const getStatusColor = (status: AgendaItemStatus) => {
    switch (status) {
      case AgendaItemStatus.PENDING:
        return 'bg-gray-100 text-gray-700';
      case AgendaItemStatus.VOTING:
        return 'bg-green-100 text-green-700';
      case AgendaItemStatus.CLOSED:
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: AgendaItemStatus) => {
    switch (status) {
      case AgendaItemStatus.PENDING:
        return 'Aguardando';
      case AgendaItemStatus.VOTING:
        return 'Em Votacao';
      case AgendaItemStatus.CLOSED:
        return 'Encerrada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sessao Invalida</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de aguardando aprovacao
  if (session?.approvalStatus === ParticipantApprovalStatus.PENDING) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Aguardando Aprovacao</h2>
            <p className="text-gray-600 mb-4">
              Sua procuracao esta sendo analisada pelo sindico. Aguarde a aprovacao para participar da votacao.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Assembleia:</span>
                <span className="font-medium">{session.assemblyTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unidade:</span>
                <span className="font-medium">{session.unitIdentifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Procurador:</span>
                <span className="font-medium">{session.proxyName}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Esta pagina atualiza automaticamente...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de procuracao rejeitada
  if (session?.approvalStatus === ParticipantApprovalStatus.REJECTED) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Procuracao Rejeitada</h2>
            <p className="text-gray-600 mb-4">
              Infelizmente sua procuracao foi rejeitada pelo sindico.
            </p>
            {session.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left mb-4">
                <span className="text-red-700 font-medium">Motivo: </span>
                <span className="text-red-600">{session.rejectionReason}</span>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Assembleia:</span>
                <span className="font-medium">{session.assemblyTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unidade:</span>
                <span className="font-medium">{session.unitIdentifier}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela principal - Area de votacao
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-semibold text-gray-900">{session?.assemblyTitle}</h1>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                session?.assemblyStatus === AssemblyStatus.IN_PROGRESS
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {session?.assemblyStatus === AssemblyStatus.IN_PROGRESS ? 'Em Andamento' : 'Aguardando'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Unidade: <span className="font-medium">{session?.unitIdentifier}</span>
              {session?.proxyName && (
                <> | Procurador: <span className="font-medium">{session.proxyName}</span></>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mensagens */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {voteSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            Voto registrado com sucesso!
          </div>
        )}

        {/* Modal de votacao */}
        {selectedItem && (
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="text-lg">Votar: {selectedItem.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedItem.description && (
                <p className="text-sm text-gray-600">{selectedItem.description}</p>
              )}

              {selectedItem.votingOtpRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Codigo OTP da Votacao
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={votingOtp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVotingOtp(value);
                    }}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-widest"
                    placeholder="000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o codigo exibido na tela da assembleia
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => handleVote(VoteChoice.YES)}
                  loading={voting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  SIM
                </Button>
                <Button
                  onClick={() => handleVote(VoteChoice.NO)}
                  loading={voting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  NAO
                </Button>
                <Button
                  onClick={() => handleVote(VoteChoice.ABSTENTION)}
                  loading={voting}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  ABSTER
                </Button>
              </div>

              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedItem(null);
                  setVotingOtp('');
                  setError(null);
                }}
                className="w-full"
              >
                Cancelar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de pautas */}
        <Card>
          <CardHeader>
            <CardTitle>Pautas da Assembleia</CardTitle>
          </CardHeader>
          <CardContent>
            {agendaItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma pauta cadastrada
              </p>
            ) : (
              <div className="space-y-3">
                {agendaItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${
                      item.status === AgendaItemStatus.VOTING && !item.hasVoted && session?.canVote
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">
                            #{item.orderIndex + 1}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                          {item.hasVoted && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              Votado
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>

                      {item.status === AgendaItemStatus.VOTING && !item.hasVoted && session?.canVote && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                          className="ml-4"
                        >
                          Votar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center">
          Check-in: {session?.checkinTime && formatDateTime(session.checkinTime)}
        </p>
      </div>
    </div>
  );
}
