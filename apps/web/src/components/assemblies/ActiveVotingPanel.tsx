'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AgendaItemResponse, ParticipantResponse, VoteSummary } from '@/lib/api';
import { VoteSelector, VoteChoice } from './VoteSelector';
import { VoteResultChart } from './VoteResultChart';

interface ActiveVotingPanelProps {
  agendaItem: AgendaItemResponse;
  participants: ParticipantResponse[];
  isSyndic: boolean;
  onCastVote: (participantId: string, choice: VoteChoice) => Promise<void>;
  onGetSummary: () => Promise<VoteSummary>;
  onCloseVoting: () => Promise<void>;
}

/**
 * ActiveVotingPanel - Painel de votacao ativa para uma pauta
 * Exibe interface para votar e acompanhar resultados em tempo real
 */
export function ActiveVotingPanel({
  agendaItem,
  participants,
  isSyndic,
  onCastVote,
  onGetSummary,
  onCloseVoting,
}: ActiveVotingPanelProps) {
  const [summary, setSummary] = useState<VoteSummary | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [votingParticipant, setVotingParticipant] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  // Participantes presentes que podem votar
  const eligibleParticipants = participants.filter(
    (p) => p.joinedAt && !p.leftAt
  );

  // Carrega resumo de votos periodicamente
  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await onGetSummary();
        setSummary(data);
      } catch (err) {
        console.error('Erro ao carregar resumo:', err);
      }
    };

    loadSummary();
    const interval = setInterval(loadSummary, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(interval);
  }, [onGetSummary]);

  const handleVote = async (choice: VoteChoice) => {
    if (!selectedParticipant) {
      setError('Selecione um participante');
      return;
    }

    try {
      setError(null);
      setVotingParticipant(selectedParticipant);
      await onCastVote(selectedParticipant, choice);
      setSelectedParticipant('');
      // Atualiza resumo apos votar
      const data = await onGetSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar voto');
    } finally {
      setVotingParticipant(null);
    }
  };

  const handleCloseVoting = async () => {
    if (!confirm('Tem certeza que deseja encerrar a votacao?')) return;

    try {
      setClosing(true);
      await onCloseVoting();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao encerrar votacao');
    } finally {
      setClosing(false);
    }
  };

  return (
    <Card className="border-yellow-300 bg-yellow-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="animate-pulse w-3 h-3 bg-yellow-500 rounded-full"></div>
            <CardTitle>Votacao em Andamento</CardTitle>
          </div>
          {isSyndic && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleCloseVoting}
              loading={closing}
            >
              Encerrar Votacao
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Informacoes da pauta */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-gray-900 mb-1">{agendaItem.title}</h4>
          {agendaItem.description && (
            <p className="text-gray-600 text-sm">{agendaItem.description}</p>
          )}
          {agendaItem.votingStartedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Iniciada em{' '}
              {new Date(agendaItem.votingStartedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interface de votacao */}
          {isSyndic && (
            <div className="space-y-4">
              <h5 className="font-medium text-gray-700">Registrar Voto</h5>

              {/* Selecao de participante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Participante
                </label>
                <select
                  value={selectedParticipant}
                  onChange={(e) => setSelectedParticipant(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione o participante</option>
                  {eligibleParticipants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.unitIdentifier} - {p.residentName || p.proxyName || 'Representante'}
                      {p.votingWeight > 1 && ` (Peso: ${p.votingWeight})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botoes de voto */}
              <VoteSelector
                onVote={handleVote}
                disabled={!selectedParticipant}
                loading={votingParticipant !== null}
              />

              {eligibleParticipants.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum participante presente para votar
                </p>
              )}
            </div>
          )}

          {/* Resultado parcial */}
          <div>
            <h5 className="font-medium text-gray-700 mb-4">Resultado Parcial</h5>
            {summary ? (
              <VoteResultChart summary={summary} showWeighted />
            ) : (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Info de participantes */}
        <div className="mt-6 pt-4 border-t border-yellow-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Participantes presentes: <strong>{eligibleParticipants.length}</strong>
            </span>
            {summary && (
              <span>
                Votos registrados: <strong>{summary.total}</strong>
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
