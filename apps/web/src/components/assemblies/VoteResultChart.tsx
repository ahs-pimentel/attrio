'use client';

import { VoteSummary } from '@/lib/api';

interface VoteResultChartProps {
  summary: VoteSummary;
  showWeighted?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * VoteResultChart - Grafico de resultados de votacao
 */
export function VoteResultChart({
  summary,
  showWeighted = false,
  size = 'md',
}: VoteResultChartProps) {
  const {
    yes = 0,
    no = 0,
    abstention = 0,
    total = 0,
    weightedYes = 0,
    weightedNo = 0,
    weightedAbstention = 0,
    weightedTotal = 0,
    yesPercentage = 0,
    noPercentage = 0,
    abstentionPercentage = 0,
  } = summary || {};

  // Usa valores ponderados se showWeighted for true
  const displayValues = showWeighted
    ? {
        yes: weightedYes,
        no: weightedNo,
        abstention: weightedAbstention,
        total: weightedTotal,
      }
    : { yes, no, abstention, total };

  const sizeClasses = {
    sm: {
      bar: 'h-4',
      text: 'text-sm',
      value: 'text-lg',
    },
    md: {
      bar: 'h-6',
      text: 'text-base',
      value: 'text-2xl',
    },
    lg: {
      bar: 'h-8',
      text: 'text-lg',
      value: 'text-3xl',
    },
  };

  const classes = sizeClasses[size];

  // Determina o vencedor
  const getWinner = () => {
    if (yesPercentage > noPercentage && yesPercentage > abstentionPercentage) {
      return 'yes';
    }
    if (noPercentage > yesPercentage && noPercentage > abstentionPercentage) {
      return 'no';
    }
    return null;
  };

  const winner = getWinner();

  return (
    <div className="space-y-4">
      {/* Barra de resultado visual */}
      <div className={`w-full ${classes.bar} flex rounded-full overflow-hidden bg-gray-200`}>
        {yesPercentage > 0 && (
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${yesPercentage}%` }}
            title={`Sim: ${yesPercentage.toFixed(1)}%`}
          />
        )}
        {noPercentage > 0 && (
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${noPercentage}%` }}
            title={`Nao: ${noPercentage.toFixed(1)}%`}
          />
        )}
        {abstentionPercentage > 0 && (
          <div
            className="bg-gray-400 transition-all duration-500"
            style={{ width: `${abstentionPercentage}%` }}
            title={`Abstencao: ${abstentionPercentage.toFixed(1)}%`}
          />
        )}
      </div>

      {/* Legenda com valores */}
      <div className="grid grid-cols-3 gap-4">
        {/* Sim */}
        <div
          className={`text-center p-3 rounded-lg ${
            winner === 'yes' ? 'bg-green-100 ring-2 ring-green-500' : 'bg-gray-50'
          }`}
        >
          <div className={`${classes.value} font-bold text-green-600`}>
            {displayValues.yes}
          </div>
          <div className={`${classes.text} text-gray-600`}>Sim</div>
          <div className="text-xs text-gray-500">{yesPercentage.toFixed(1)}%</div>
        </div>

        {/* Nao */}
        <div
          className={`text-center p-3 rounded-lg ${
            winner === 'no' ? 'bg-red-100 ring-2 ring-red-500' : 'bg-gray-50'
          }`}
        >
          <div className={`${classes.value} font-bold text-red-600`}>
            {displayValues.no}
          </div>
          <div className={`${classes.text} text-gray-600`}>Nao</div>
          <div className="text-xs text-gray-500">{noPercentage.toFixed(1)}%</div>
        </div>

        {/* Abstencao */}
        <div className="text-center p-3 rounded-lg bg-gray-50">
          <div className={`${classes.value} font-bold text-gray-600`}>
            {displayValues.abstention}
          </div>
          <div className={`${classes.text} text-gray-600`}>Abstencao</div>
          <div className="text-xs text-gray-500">{abstentionPercentage.toFixed(1)}%</div>
        </div>
      </div>

      {/* Total de votos */}
      <div className="text-center text-sm text-gray-500">
        Total: {displayValues.total} {showWeighted ? 'votos (ponderados)' : 'votos'}
        {showWeighted && total !== weightedTotal && (
          <span className="ml-2">({total} participantes)</span>
        )}
      </div>

      {/* Indicador de resultado */}
      {winner && (
        <div
          className={`text-center py-2 rounded-lg font-medium ${
            winner === 'yes'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {winner === 'yes' ? 'Aprovado' : 'Rejeitado'}
        </div>
      )}
    </div>
  );
}

/**
 * VoteResultMini - Versao compacta do resultado
 */
interface VoteResultMiniProps {
  summary: VoteSummary;
}

export function VoteResultMini({ summary }: VoteResultMiniProps) {
  const { yesPercentage = 0, noPercentage = 0, abstentionPercentage = 0, total = 0 } = summary || {};

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-green-500"></span>
        <span>{yesPercentage.toFixed(0)}%</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-red-500"></span>
        <span>{noPercentage.toFixed(0)}%</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-gray-400"></span>
        <span>{abstentionPercentage.toFixed(0)}%</span>
      </div>
      <span className="text-gray-400">({total} votos)</span>
    </div>
  );
}
