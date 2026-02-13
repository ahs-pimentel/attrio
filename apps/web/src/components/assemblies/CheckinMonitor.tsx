'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ParticipantResponse } from '@/lib/api';
import { AttendanceProgressBar } from './AttendanceStats';

interface CheckinMonitorProps {
  participants: ParticipantResponse[];
  totalUnits: number;
  onRefresh: () => Promise<void>;
  autoRefreshInterval?: number;
}

/**
 * CheckinMonitor - Monitor de check-ins em tempo real
 */
export function CheckinMonitor({
  participants,
  totalUnits,
  onRefresh,
  autoRefreshInterval = 10000,
}: CheckinMonitorProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      await onRefresh();
      setLastRefresh(new Date());
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [onRefresh, autoRefreshInterval]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } finally {
      setRefreshing(false);
    }
  };

  // Ordena participantes por horario de entrada (mais recentes primeiro)
  const sortedParticipants = [...participants]
    .filter((p) => p.joinedAt)
    .sort((a, b) => {
      const dateA = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
      const dateB = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
      return dateB - dateA;
    });

  // Participantes presentes (entraram mas nao sairam)
  const presentParticipants = participants.filter((p) => p.joinedAt && !p.leftAt);

  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `ha ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `ha ${hours}h${minutes % 60}min`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <CardTitle>Monitor de Check-ins</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              Atualizado: {formatTime(lastRefresh.toISOString())}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              loading={refreshing}
            >
              <svg
                className="w-4 h-4"
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
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Barra de progresso */}
        <div className="mb-6">
          <AttendanceProgressBar
            current={presentParticipants.length}
            total={totalUnits}
            threshold={50}
            label="Presenca"
          />
        </div>

        {/* Estatisticas rapidas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {presentParticipants.length}
            </div>
            <div className="text-sm text-gray-600">Presentes</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {sortedParticipants.length}
            </div>
            <div className="text-sm text-gray-600">Check-ins</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {participants.filter((p) => p.leftAt).length}
            </div>
            <div className="text-sm text-gray-600">Sairam</div>
          </div>
        </div>

        {/* Lista de check-ins recentes */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Check-ins Recentes</h4>
          {sortedParticipants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
              </svg>
              <p>Aguardando check-ins...</p>
              <p className="text-sm mt-1">
                Os participantes aparecerao aqui ao fazer check-in
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sortedParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    participant.leftAt
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        participant.leftAt
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-green-200 text-green-700'
                      }`}
                    >
                      {participant.unitIdentifier?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {participant.unitIdentifier || 'Unidade'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {participant.residentName ||
                          participant.proxyName ||
                          'Representante'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={participant.leftAt ? 'secondary' : 'success'}
                      size="sm"
                    >
                      {participant.leftAt ? 'Saiu' : 'Presente'}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {participant.joinedAt && getTimeSince(participant.joinedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
