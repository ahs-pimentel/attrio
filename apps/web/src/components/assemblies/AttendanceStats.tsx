'use client';

import { Card } from '@/components/ui/Card';
import type { AttendanceStatus } from '@/lib/api';

interface AttendanceStatsProps {
  attendance: AttendanceStatus;
}

/**
 * AttendanceStats - Estatisticas de presenca da assembleia
 */
export function AttendanceStats({ attendance }: AttendanceStatsProps) {
  const {
    totalUnits = 0,
    registeredParticipants = 0,
    checkedIn = 0,
    currentlyPresent = 0,
    quorumPercentage = 0,
    totalVotingWeight = 0,
    presentVotingWeight = 0,
  } = attendance || {};

  // Calcula percentual de presenca
  const presencePercentage =
    totalUnits > 0 ? ((currentlyPresent / totalUnits) * 100).toFixed(1) : '0';

  // Determina cor do quorum
  const getQuorumColor = (percentage: number) => {
    if (percentage >= 50) return 'text-green-600';
    if (percentage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total de unidades */}
      <Card className="text-center" padding="sm">
        <div className="text-2xl font-bold text-gray-900">{totalUnits}</div>
        <div className="text-sm text-gray-500">Total de Unidades</div>
      </Card>

      {/* Participantes registrados */}
      <Card className="text-center" padding="sm">
        <div className="text-2xl font-bold text-blue-600">{registeredParticipants}</div>
        <div className="text-sm text-gray-500">Registrados</div>
      </Card>

      {/* Presentes */}
      <Card className="text-center" padding="sm">
        <div className="text-2xl font-bold text-green-600">{currentlyPresent}</div>
        <div className="text-sm text-gray-500">Presentes Agora</div>
        <div className="text-xs text-gray-400 mt-1">
          ({checkedIn} check-ins)
        </div>
      </Card>

      {/* Quorum */}
      <Card className="text-center" padding="sm">
        <div className={`text-2xl font-bold ${getQuorumColor(quorumPercentage || 0)}`}>
          {(quorumPercentage || 0).toFixed(1)}%
        </div>
        <div className="text-sm text-gray-500">Quorum</div>
        <div className="text-xs text-gray-400 mt-1">
          Peso: {presentVotingWeight}/{totalVotingWeight}
        </div>
      </Card>
    </div>
  );
}

/**
 * AttendanceProgressBar - Barra de progresso do quorum
 */
interface AttendanceProgressBarProps {
  current: number;
  total: number;
  threshold?: number;
  label?: string;
}

export function AttendanceProgressBar({
  current,
  total,
  threshold = 50,
  label = 'Presenca',
}: AttendanceProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const reachedThreshold = percentage >= threshold;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {current}/{total} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        {/* Marcador do threshold */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-500 z-10"
          style={{ left: `${threshold}%` }}
        />
        {/* Barra de progresso */}
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            reachedThreshold ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>0%</span>
        <span className={reachedThreshold ? 'text-green-600 font-medium' : ''}>
          Quorum: {threshold}%
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}
