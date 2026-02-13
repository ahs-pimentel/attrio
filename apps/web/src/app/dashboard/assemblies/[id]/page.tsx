'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useAuthContext } from '@/components/AuthProvider';
import { useAssembly } from '@/hooks/useAssembly';

// Componentes de assembleia
import {
  AgendaItemsList,
  ParticipantsList,
  ActiveVotingPanel,
  QRCodeGenerator,
  CheckinMonitor,
  MinutesViewer,
  MinutesEmpty,
  MinutesEditor,
  MinutesActions,
  type VoteChoice,
} from '@/components/assemblies';

/**
 * Pagina de detalhe da assembleia
 * Exibe informacoes completas, pautas, participantes, votacao e ata
 */
export default function AssemblyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assemblyId = params.id as string;
  const { isSyndic } = useAuthContext();

  // Estado para modo de edicao da ata
  const [editingMinutes, setEditingMinutes] = useState(false);

  // Hook que gerencia todo o estado e acoes da assembleia
  const {
    assembly,
    agendaItems,
    participants,
    attendance,
    minutes,
    qrCodeData,
    loading,
    error,
    // Acoes da assembleia
    refreshAssembly,
    startAssembly,
    finishAssembly,
    cancelAssembly,
    // Acoes de pautas
    createAgendaItem,
    updateAgendaItem,
    deleteAgendaItem,
    startVoting,
    closeVoting,
    getVoteResult,
    // Acoes de participantes
    registerParticipant,
    removeParticipant,
    markJoined,
    markLeft,
    refreshParticipants,
    // Acoes de votos
    castVote,
    getVoteSummary,
    // Acoes de QR Code
    generateQrCode,
    refreshAttendance,
    // Acoes de ata
    generateMinutes,
    updateMinutes,
    approveMinutes,
    publishMinutes,
    refreshMinutes,
  } = useAssembly(assemblyId, { autoRefresh: true, refreshInterval: 15000 });

  // Estados de loading para acoes
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Handlers de acoes da assembleia
  const handleStart = async () => {
    if (!confirm('Tem certeza que deseja iniciar esta assembleia?')) return;
    try {
      setActionLoading('start');
      setActionError(null);
      await startAssembly();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao iniciar assembleia');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinish = async () => {
    if (!confirm('Tem certeza que deseja encerrar esta assembleia? Esta acao nao pode ser desfeita.')) return;
    try {
      setActionLoading('finish');
      setActionError(null);
      await finishAssembly();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao encerrar assembleia');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar esta assembleia?')) return;
    try {
      setActionLoading('cancel');
      setActionError(null);
      await cancelAssembly();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao cancelar assembleia');
    } finally {
      setActionLoading(null);
    }
  };

  // Handler de voto
  const handleCastVote = async (participantId: string, choice: VoteChoice) => {
    const activeVoting = agendaItems.find((item) => item.status === 'VOTING');
    if (!activeVoting) return;
    await castVote(activeVoting.id, participantId, choice);
  };

  // Handler para pegar resumo de votos da pauta em votacao
  const handleGetVoteSummary = async () => {
    const activeVoting = agendaItems.find((item) => item.status === 'VOTING');
    if (!activeVoting) throw new Error('Nenhuma pauta em votacao');
    return getVoteSummary(activeVoting.id);
  };

  // Handler para encerrar votacao da pauta ativa
  const handleCloseActiveVoting = async () => {
    const activeVoting = agendaItems.find((item) => item.status === 'VOTING');
    if (!activeVoting) return;
    await closeVoting(activeVoting.id);
  };

  // Handler para gerar ata
  const handleGenerateMinutes = async () => {
    try {
      setActionLoading('generate-minutes');
      setActionError(null);
      await generateMinutes();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao gerar ata');
    } finally {
      setActionLoading(null);
    }
  };

  // Formatacao de data/hora
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando assembleia...</p>
        </div>
      </div>
    );
  }

  // Erro
  if (error || !assembly) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Erro ao carregar assembleia
        </h2>
        <p className="text-gray-500 mb-4">{error || 'Assembleia nao encontrada'}</p>
        <Button onClick={() => router.push('/dashboard/assemblies')}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  // Pauta em votacao ativa
  const activeVotingItem = agendaItems.find((item) => item.status === 'VOTING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => router.push('/dashboard/assemblies')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{assembly.title}</h1>
            <StatusBadge status={assembly.status} type="assembly" />
          </div>
          {assembly.description && (
            <p className="text-gray-600 mb-2">{assembly.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
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
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
              {formatDateTime(assembly.scheduledAt)}
            </span>
            {assembly.meetingUrl && (
              <a
                href={assembly.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
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
                    d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
                Acessar reuniao
              </a>
            )}
          </div>
        </div>

        {/* Acoes do sindico */}
        {isSyndic && (
          <div className="flex items-center gap-2">
            {assembly.status === 'SCHEDULED' && (
              <>
                <Button
                  variant="primary"
                  onClick={handleStart}
                  loading={actionLoading === 'start'}
                >
                  Iniciar Assembleia
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  loading={actionLoading === 'cancel'}
                >
                  Cancelar
                </Button>
              </>
            )}
            {assembly.status === 'IN_PROGRESS' && (
              <Button
                variant="danger"
                onClick={handleFinish}
                loading={actionLoading === 'finish'}
              >
                Encerrar Assembleia
              </Button>
            )}
            <Button variant="ghost" onClick={refreshAssembly}>
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
        )}
      </div>

      {/* Erro de acao */}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {actionError}
        </div>
      )}

      {/* Painel de votacao ativa (sempre visivel quando ha votacao) */}
      {activeVotingItem && assembly.status === 'IN_PROGRESS' && (
        <ActiveVotingPanel
          agendaItem={activeVotingItem}
          participants={participants}
          isSyndic={isSyndic}
          onCastVote={handleCastVote}
          onGetSummary={handleGetVoteSummary}
          onCloseVoting={handleCloseActiveVoting}
        />
      )}

      {/* Tabs de conteudo */}
      <Tabs defaultValue="agenda">
        <TabsList>
          <TabsTrigger value="agenda">
            Pautas ({agendaItems.length})
          </TabsTrigger>
          <TabsTrigger value="participants">
            Participantes ({participants.length})
          </TabsTrigger>
          {(assembly.status === 'IN_PROGRESS' || assembly.status === 'SCHEDULED') &&
            isSyndic && <TabsTrigger value="checkin">Check-in</TabsTrigger>}
          {(assembly.status === 'FINISHED' || minutes) && (
            <TabsTrigger value="minutes">Ata</TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Pautas */}
        <TabsContent value="agenda">
          <AgendaItemsList
            assemblyId={assemblyId}
            items={agendaItems}
            assemblyStatus={assembly.status}
            isSyndic={isSyndic}
            onCreateItem={createAgendaItem}
            onUpdateItem={updateAgendaItem}
            onDeleteItem={deleteAgendaItem}
            onStartVoting={startVoting}
            onCloseVoting={closeVoting}
            onGetVoteResult={getVoteResult}
          />
        </TabsContent>

        {/* Tab: Participantes */}
        <TabsContent value="participants">
          <ParticipantsList
            assemblyId={assemblyId}
            participants={participants}
            attendance={attendance}
            assemblyStatus={assembly.status}
            isSyndic={isSyndic}
            onRegister={registerParticipant}
            onRemove={removeParticipant}
            onMarkJoined={markJoined}
            onMarkLeft={markLeft}
            onRefresh={refreshParticipants}
          />
        </TabsContent>

        {/* Tab: Check-in (QR Code) */}
        {(assembly.status === 'IN_PROGRESS' || assembly.status === 'SCHEDULED') &&
          isSyndic && (
            <TabsContent value="checkin">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <QRCodeGenerator
                  assemblyId={assemblyId}
                  assemblyTitle={assembly.title}
                  qrCodeData={qrCodeData}
                  onGenerate={generateQrCode}
                />
                <CheckinMonitor
                  participants={participants}
                  totalUnits={attendance?.totalUnits || 0}
                  onRefresh={refreshParticipants}
                  autoRefreshInterval={10000}
                />
              </div>
            </TabsContent>
          )}

        {/* Tab: Ata */}
        {(assembly.status === 'FINISHED' || minutes) && (
          <TabsContent value="minutes">
            <div className="space-y-6">
              {editingMinutes && minutes ? (
                <MinutesEditor
                  minutes={minutes}
                  onSave={async (data) => {
                    await updateMinutes(data);
                    setEditingMinutes(false);
                  }}
                  onCancel={() => setEditingMinutes(false)}
                />
              ) : minutes ? (
                <>
                  <MinutesViewer
                    minutes={minutes}
                    onEdit={() => setEditingMinutes(true)}
                    canEdit={isSyndic && minutes.status === 'DRAFT'}
                  />
                  {isSyndic && (
                    <MinutesActions
                      minutes={minutes}
                      isSyndic={isSyndic}
                      onApprove={approveMinutes}
                      onPublish={publishMinutes}
                      onEdit={() => setEditingMinutes(true)}
                      onGenerate={generateMinutes}
                    />
                  )}
                </>
              ) : (
                <MinutesEmpty
                  assemblyStatus={assembly.status}
                  onGenerate={handleGenerateMinutes}
                  generating={actionLoading === 'generate-minutes'}
                  canGenerate={isSyndic}
                />
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
