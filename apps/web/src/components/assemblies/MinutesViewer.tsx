'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { MinutesResponse } from '@/lib/api';

interface MinutesViewerProps {
  minutes: MinutesResponse;
  onEdit?: () => void;
  canEdit?: boolean;
}

/**
 * MinutesViewer - Visualizador de ata da assembleia
 */
export function MinutesViewer({ minutes, onEdit, canEdit = false }: MinutesViewerProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Ata da Assembleia</CardTitle>
            <StatusBadge status={minutes.status} type="minutes" />
          </div>
          {canEdit && onEdit && minutes.status === 'DRAFT' && (
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
              </svg>
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumo */}
        {minutes.summary && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Resumo</h4>
            <div className="p-4 bg-blue-50 rounded-lg text-blue-900">
              {minutes.summary}
            </div>
          </div>
        )}

        {/* Conteudo principal */}
        {minutes.content ? (
          <div className="prose prose-sm max-w-none">
            <h4 className="font-medium text-gray-700 mb-2">Conteudo da Ata</h4>
            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-gray-700 border border-gray-200">
              {minutes.content}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Conteudo da ata nao disponivel</p>
          </div>
        )}

        {/* Resumo de votacoes */}
        {minutes.voteSummary && Object.keys(minutes.voteSummary).length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700 mb-2">Resumo das Votacoes</h4>
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-600 overflow-x-auto">
                {JSON.stringify(minutes.voteSummary, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Resumo de presenca */}
        {minutes.attendanceSummary && Object.keys(minutes.attendanceSummary).length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700 mb-2">Resumo de Presenca</h4>
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-600 overflow-x-auto">
                {JSON.stringify(minutes.attendanceSummary, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Metadados */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Criada em:</span>
              <span className="ml-2 text-gray-700">{formatDate(minutes.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-500">Atualizada em:</span>
              <span className="ml-2 text-gray-700">{formatDate(minutes.updatedAt)}</span>
            </div>
            {minutes.approvedAt && (
              <div>
                <span className="text-gray-500">Aprovada em:</span>
                <span className="ml-2 text-gray-700">{formatDate(minutes.approvedAt)}</span>
              </div>
            )}
            {minutes.pdfUrl && (
              <div>
                <a
                  href={minutes.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                  Baixar PDF
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * MinutesEmpty - Componente para quando nao ha ata
 */
interface MinutesEmptyProps {
  assemblyStatus: string;
  onGenerate?: () => void;
  generating?: boolean;
  canGenerate?: boolean;
}

export function MinutesEmpty({
  assemblyStatus,
  onGenerate,
  generating = false,
  canGenerate = false,
}: MinutesEmptyProps) {
  const canGenerateNow = assemblyStatus === 'FINISHED' && canGenerate;

  return (
    <Card>
      <CardContent>
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ata nao disponivel
          </h3>
          <p className="text-gray-500 mb-6">
            {assemblyStatus === 'FINISHED'
              ? 'A ata ainda nao foi gerada para esta assembleia.'
              : 'A ata sera disponibilizada apos o encerramento da assembleia.'}
          </p>
          {canGenerateNow && onGenerate && (
            <Button onClick={onGenerate} loading={generating}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                />
              </svg>
              Gerar Ata Automaticamente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
