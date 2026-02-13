'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  TableLoading,
} from '@/components/ui/Table';
import { VoteChoiceBadge } from './VoteSelector';
import { votesApi, VoteResponse, ParticipantResponse } from '@/lib/api';

interface VoteHistoryProps {
  assemblyId: string;
  agendaItemId: string;
  participants: ParticipantResponse[];
}

/**
 * VoteHistory - Lista de votos de uma pauta
 */
export function VoteHistory({
  assemblyId,
  agendaItemId,
  participants,
}: VoteHistoryProps) {
  const [votes, setVotes] = useState<VoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVotes = async () => {
      try {
        setLoading(true);
        const data = await votesApi.list(assemblyId, agendaItemId);
        setVotes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar votos');
      } finally {
        setLoading(false);
      }
    };

    loadVotes();
  }, [assemblyId, agendaItemId]);

  // Mapeia participantId para dados do participante
  const getParticipantInfo = (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId);
    return participant
      ? {
          unit: participant.unitIdentifier || '-',
          name: participant.residentName || participant.proxyName || 'Representante',
        }
      : { unit: '-', name: '-' };
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-4 text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historico de Votos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Unidade</TableHead>
              <TableHead>Participante</TableHead>
              <TableHead>Voto</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>Horario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableLoading colSpan={5} />
            ) : votes.length === 0 ? (
              <TableEmpty colSpan={5} message="Nenhum voto registrado" />
            ) : (
              votes.map((vote) => {
                const { unit, name } = getParticipantInfo(vote.participantId);
                return (
                  <TableRow key={vote.id}>
                    <TableCell className="font-medium">{unit}</TableCell>
                    <TableCell>{name}</TableCell>
                    <TableCell>
                      <VoteChoiceBadge choice={vote.choice} />
                    </TableCell>
                    <TableCell>{vote.votingWeight}</TableCell>
                    <TableCell className="text-gray-500">
                      {formatTime(vote.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/**
 * VoteHistoryCompact - Versao compacta do historico
 */
interface VoteHistoryCompactProps {
  votes: VoteResponse[];
  participants: ParticipantResponse[];
  maxItems?: number;
}

export function VoteHistoryCompact({
  votes,
  participants,
  maxItems = 5,
}: VoteHistoryCompactProps) {
  const recentVotes = votes.slice(0, maxItems);

  const getParticipantInfo = (participantId: string) => {
    const participant = participants.find((p) => p.id === participantId);
    return participant?.unitIdentifier || 'Unidade';
  };

  if (recentVotes.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-2">
        Nenhum voto registrado ainda
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentVotes.map((vote) => (
        <div
          key={vote.id}
          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
        >
          <span className="font-medium">{getParticipantInfo(vote.participantId)}</span>
          <VoteChoiceBadge choice={vote.choice} size="sm" />
        </div>
      ))}
      {votes.length > maxItems && (
        <div className="text-center text-gray-500 text-xs">
          +{votes.length - maxItems} votos
        </div>
      )}
    </div>
  );
}
