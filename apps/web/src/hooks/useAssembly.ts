'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  assembliesApi,
  agendaItemsApi,
  participantsApi,
  votesApi,
  attendanceApi,
  minutesApi,
  AssemblyDetailResponse,
  AgendaItemResponse,
  ParticipantResponse,
  VoteSummary,
  AttendanceStatus,
  MinutesResponse,
  QrCodeData,
  CreateAgendaItemDto,
  UpdateAgendaItemDto,
  RegisterParticipantDto,
  UpdateMinutesDto,
  VoteChoice,
} from '@/lib/api';

// Tipo de escolha de voto (alias para consistencia)
type VoteChoiceType = 'YES' | 'NO' | 'ABSTENTION';

interface UseAssemblyOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseAssemblyReturn {
  // Estado
  assembly: AssemblyDetailResponse | null;
  agendaItems: AgendaItemResponse[];
  participants: ParticipantResponse[];
  attendance: AttendanceStatus | null;
  minutes: MinutesResponse | null;
  qrCodeData: QrCodeData | null;
  loading: boolean;
  error: string | null;

  // Acoes da assembleia
  refreshAssembly: () => Promise<void>;
  startAssembly: () => Promise<void>;
  finishAssembly: () => Promise<void>;
  cancelAssembly: () => Promise<void>;

  // Acoes de pautas
  createAgendaItem: (data: CreateAgendaItemDto) => Promise<AgendaItemResponse>;
  updateAgendaItem: (id: string, data: UpdateAgendaItemDto) => Promise<AgendaItemResponse>;
  deleteAgendaItem: (id: string) => Promise<void>;
  startVoting: (agendaItemId: string) => Promise<void>;
  closeVoting: (agendaItemId: string) => Promise<void>;
  getVoteResult: (agendaItemId: string) => Promise<VoteSummary>;

  // Acoes de participantes
  registerParticipant: (data: RegisterParticipantDto) => Promise<ParticipantResponse>;
  removeParticipant: (id: string) => Promise<void>;
  markJoined: (participantId: string) => Promise<void>;
  markLeft: (participantId: string) => Promise<void>;
  refreshParticipants: () => Promise<void>;

  // Acoes de votos
  castVote: (agendaItemId: string, participantId: string, choice: VoteChoiceType) => Promise<void>;
  getVoteSummary: (agendaItemId: string) => Promise<VoteSummary>;

  // Acoes de presenca/QR Code
  generateQrCode: () => Promise<QrCodeData>;
  refreshAttendance: () => Promise<void>;

  // Acoes de ata
  generateMinutes: () => Promise<void>;
  updateMinutes: (data: UpdateMinutesDto) => Promise<void>;
  approveMinutes: () => Promise<void>;
  publishMinutes: () => Promise<void>;
  refreshMinutes: () => Promise<void>;
}

/**
 * Hook customizado para gerenciar estado e acoes de uma assembleia
 * Centraliza toda logica de API e estado do modulo de assembleias
 */
export function useAssembly(
  assemblyId: string | undefined,
  options: UseAssemblyOptions = {}
): UseAssemblyReturn {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  // Estados principais
  const [assembly, setAssembly] = useState<AssemblyDetailResponse | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItemResponse[]>([]);
  const [participants, setParticipants] = useState<ParticipantResponse[]>([]);
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [minutes, setMinutes] = useState<MinutesResponse | null>(null);
  const [qrCodeData, setQrCodeData] = useState<QrCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== Funcoes de carregamento ====================

  const loadAssembly = useCallback(async () => {
    if (!assemblyId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await assembliesApi.getById(assemblyId);
      setAssembly(data);

      // Carrega dados relacionados em paralelo
      const [items, parts, attend, mins] = await Promise.all([
        agendaItemsApi.list(assemblyId).catch(() => []),
        participantsApi.list(assemblyId).catch(() => []),
        participantsApi.getAttendance(assemblyId).catch(() => null),
        minutesApi.get(assemblyId).catch(() => null),
      ]);

      setAgendaItems(items);
      setParticipants(parts);
      setAttendance(attend);
      setMinutes(mins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar assembleia');
    } finally {
      setLoading(false);
    }
  }, [assemblyId]);

  const refreshAssembly = useCallback(async () => {
    await loadAssembly();
  }, [loadAssembly]);

  const refreshParticipants = useCallback(async () => {
    if (!assemblyId) return;
    try {
      const [parts, attend] = await Promise.all([
        participantsApi.list(assemblyId),
        participantsApi.getAttendance(assemblyId).catch(() => null),
      ]);
      setParticipants(parts);
      setAttendance(attend);
    } catch (err) {
      console.error('Erro ao atualizar participantes:', err);
    }
  }, [assemblyId]);

  const refreshAttendance = useCallback(async () => {
    if (!assemblyId) return;
    try {
      const attend = await participantsApi.getAttendance(assemblyId);
      setAttendance(attend);
    } catch (err) {
      console.error('Erro ao atualizar presenca:', err);
    }
  }, [assemblyId]);

  const refreshMinutes = useCallback(async () => {
    if (!assemblyId) return;
    try {
      const mins = await minutesApi.get(assemblyId);
      setMinutes(mins);
    } catch (err) {
      console.error('Erro ao atualizar ata:', err);
    }
  }, [assemblyId]);

  // ==================== Efeitos ====================

  // Carrega dados iniciais
  useEffect(() => {
    loadAssembly();
  }, [loadAssembly]);

  // Auto-refresh quando assembleia esta em andamento
  useEffect(() => {
    if (!autoRefresh || !assembly || assembly.status !== 'IN_PROGRESS') return;

    const interval = setInterval(() => {
      refreshParticipants();
      refreshAttendance();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, assembly, refreshInterval, refreshParticipants, refreshAttendance]);

  // ==================== Acoes da assembleia ====================

  const startAssembly = useCallback(async () => {
    if (!assemblyId) return;
    try {
      const updated = await assembliesApi.start(assemblyId);
      setAssembly(updated);
    } catch (err) {
      throw err;
    }
  }, [assemblyId]);

  const finishAssembly = useCallback(async () => {
    if (!assemblyId) return;
    try {
      const updated = await assembliesApi.finish(assemblyId);
      setAssembly(updated);
    } catch (err) {
      throw err;
    }
  }, [assemblyId]);

  const cancelAssembly = useCallback(async () => {
    if (!assemblyId) return;
    try {
      const updated = await assembliesApi.cancel(assemblyId);
      setAssembly(updated);
    } catch (err) {
      throw err;
    }
  }, [assemblyId]);

  // ==================== Acoes de pautas ====================

  const createAgendaItem = useCallback(
    async (data: CreateAgendaItemDto) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      const item = await agendaItemsApi.create(assemblyId, data);
      setAgendaItems((prev) => [...prev, item]);
      return item;
    },
    [assemblyId]
  );

  const updateAgendaItem = useCallback(
    async (id: string, data: UpdateAgendaItemDto) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      const item = await agendaItemsApi.update(assemblyId, id, data);
      setAgendaItems((prev) => prev.map((i) => (i.id === id ? item : i)));
      return item;
    },
    [assemblyId]
  );

  const deleteAgendaItem = useCallback(
    async (id: string) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      await agendaItemsApi.delete(assemblyId, id);
      setAgendaItems((prev) => prev.filter((i) => i.id !== id));
    },
    [assemblyId]
  );

  const startVoting = useCallback(
    async (agendaItemId: string) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      const item = await agendaItemsApi.startVoting(assemblyId, agendaItemId);
      setAgendaItems((prev) => prev.map((i) => (i.id === agendaItemId ? item : i)));
    },
    [assemblyId]
  );

  const closeVoting = useCallback(
    async (agendaItemId: string) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      const item = await agendaItemsApi.closeVoting(assemblyId, agendaItemId);
      setAgendaItems((prev) => prev.map((i) => (i.id === agendaItemId ? item : i)));
    },
    [assemblyId]
  );

  const getVoteResult = useCallback(
    async (agendaItemId: string) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      return agendaItemsApi.getVoteResult(assemblyId, agendaItemId);
    },
    [assemblyId]
  );

  // ==================== Acoes de participantes ====================

  const registerParticipant = useCallback(
    async (data: RegisterParticipantDto) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      const participant = await participantsApi.register(assemblyId, data);
      setParticipants((prev) => [...prev, participant]);
      await refreshAttendance();
      return participant;
    },
    [assemblyId, refreshAttendance]
  );

  const removeParticipant = useCallback(
    async (id: string) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      await participantsApi.remove(assemblyId, id);
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      await refreshAttendance();
    },
    [assemblyId, refreshAttendance]
  );

  const markJoined = useCallback(
    async (participantId: string) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      const updated = await participantsApi.markJoined(assemblyId, participantId);
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? updated : p))
      );
      await refreshAttendance();
    },
    [assemblyId, refreshAttendance]
  );

  const markLeft = useCallback(
    async (participantId: string) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      const updated = await participantsApi.markLeft(assemblyId, participantId);
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? updated : p))
      );
      await refreshAttendance();
    },
    [assemblyId, refreshAttendance]
  );

  // ==================== Acoes de votos ====================

  const castVote = useCallback(
    async (agendaItemId: string, participantId: string, choice: VoteChoiceType) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      // Converte string para o enum VoteChoice
      await votesApi.cast(assemblyId, agendaItemId, participantId, { choice: VoteChoice[choice] });
    },
    [assemblyId]
  );

  const getVoteSummary = useCallback(
    async (agendaItemId: string) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      return votesApi.getSummary(assemblyId, agendaItemId);
    },
    [assemblyId]
  );

  // ==================== Acoes de QR Code/Presenca ====================

  const generateQrCode = useCallback(async () => {
    if (!assemblyId) throw new Error('Assembly ID nao definido');
    const data = await attendanceApi.generateToken(assemblyId);

    // Corrige a URL para apontar para o frontend
    // O backend retorna /api/assemblies/checkin/{token}, mas precisamos /checkin/{token}
    const token = data.checkinUrl.split('/').pop();
    const frontendUrl = `${window.location.origin}/checkin/${token}`;

    const correctedData = {
      ...data,
      checkinUrl: frontendUrl,
    };

    setQrCodeData(correctedData);
    return correctedData;
  }, [assemblyId]);

  // ==================== Acoes de ata ====================

  const generateMinutes = useCallback(async () => {
    if (!assemblyId) throw new Error('Assembly ID nao definido');
    await minutesApi.generate(assemblyId);
    await refreshMinutes();
  }, [assemblyId, refreshMinutes]);

  const updateMinutes = useCallback(
    async (data: UpdateMinutesDto) => {
      if (!assemblyId) throw new Error('Assembly ID nao definido');
      const updated = await minutesApi.update(assemblyId, data);
      setMinutes(updated);
    },
    [assemblyId]
  );

  const approveMinutes = useCallback(async () => {
    if (!assemblyId) throw new Error('Assembly ID nao definido');
    const updated = await minutesApi.approve(assemblyId);
    setMinutes(updated);
  }, [assemblyId]);

  const publishMinutes = useCallback(async () => {
    if (!assemblyId) throw new Error('Assembly ID nao definido');
    const updated = await minutesApi.publish(assemblyId);
    setMinutes(updated);
  }, [assemblyId]);

  return {
    // Estado
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

    // Acoes de presenca/QR Code
    generateQrCode,
    refreshAttendance,

    // Acoes de ata
    generateMinutes,
    updateMinutes,
    approveMinutes,
    publishMinutes,
    refreshMinutes,
  };
}
