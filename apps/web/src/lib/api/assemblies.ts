import { apiClient } from './client';
import type { AssemblyStatus, AgendaItemStatus, VoteChoice, ParticipantApprovalStatus } from '@attrio/contracts';

// ==================== Types ====================

export interface AssemblyResponse {
  id: string;
  tenantId: string;
  title: string;
  description?: string | null;
  scheduledAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  meetingUrl?: string | null;
  status: AssemblyStatus;
  createdAt: string;
  updatedAt: string;
  participantsCount?: number;
  agendaItemsCount?: number;
}

export interface AssemblyDetailResponse extends AssemblyResponse {
  agendaItems?: AgendaItemResponse[];
  participants?: ParticipantResponse[];
}

export interface CreateAssemblyDto {
  title: string;
  description?: string;
  scheduledAt: string;
  meetingUrl?: string;
}

export interface UpdateAssemblyDto {
  title?: string;
  description?: string;
  scheduledAt?: string;
  meetingUrl?: string;
  status?: AssemblyStatus;
}

export interface AgendaItemResponse {
  id: string;
  assemblyId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  status: AgendaItemStatus;
  requiresQuorum: boolean;
  quorumType: string;
  votingStartedAt?: string | null;
  votingEndedAt?: string | null;
  result?: string | null;
  createdAt: string;
}

export interface CreateAgendaItemDto {
  title: string;
  description?: string;
  orderIndex?: number;
  requiresQuorum?: boolean;
  quorumType?: 'simple' | 'qualified' | 'unanimous';
}

export interface UpdateAgendaItemDto {
  title?: string;
  description?: string;
  orderIndex?: number;
  requiresQuorum?: boolean;
  quorumType?: string;
  status?: AgendaItemStatus;
  result?: string;
}

export interface ParticipantResponse {
  id: string;
  assemblyId: string;
  unitId: string;
  residentId?: string | null;
  proxyName?: string | null;
  joinedAt?: string | null;
  leftAt?: string | null;
  votingWeight: number;
  createdAt: string;
  unitIdentifier?: string;
  residentName?: string;
}

export interface RegisterParticipantDto {
  unitId: string;
  residentId?: string;
  proxyName?: string;
  proxyDocument?: string;
  votingWeight?: number;
}

export interface VoteResponse {
  id: string;
  agendaItemId: string;
  participantId: string;
  choice: VoteChoice;
  votingWeight: number;
  createdAt: string;
}

export interface CastVoteDto {
  choice: VoteChoice;
}

export interface VoteSummary {
  yes: number;
  no: number;
  abstention: number;
  total: number;
  weightedYes: number;
  weightedNo: number;
  weightedAbstention: number;
  weightedTotal: number;
  yesPercentage: number;
  noPercentage: number;
  abstentionPercentage: number;
}

export interface AttendanceStatus {
  assemblyId: string;
  assemblyTitle: string;
  status: string;
  totalUnits: number;
  registeredParticipants: number;
  checkedIn: number;
  checkedOut: number;
  currentlyPresent: number;
  quorumPercentage: number;
  totalVotingWeight: number;
  presentVotingWeight: number;
}

export interface CheckinRequest {
  checkinToken: string;
  otp: string;
  unitIdentifier: string;
  residentId?: string;
  proxyName?: string;
  proxyDocument?: string;
}

export interface CheckinResponse {
  success: boolean;
  participantId: string;
  assemblyId: string;
  assemblyTitle: string;
  unitIdentifier: string;
  checkinTime: string;
  sessionToken: string;
  approvalStatus: ParticipantApprovalStatus;
  isProxy: boolean;
  message?: string;
}

export interface QrCodeData {
  checkinToken: string;
  checkinUrl: string;
  assemblyId: string;
  assemblyTitle: string;
}

export interface MinutesResponse {
  id: string;
  assemblyId: string;
  content?: string | null;
  summary?: string | null;
  transcription?: string | null;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED';
  pdfUrl?: string | null;
  voteSummary?: Record<string, unknown> | null;
  attendanceSummary?: Record<string, unknown> | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMinutesDto {
  content?: string;
  summary?: string;
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED';
}

// ==================== API Clients ====================

export const assembliesApi = {
  /**
   * Lista todas as assembleias
   */
  list: () => apiClient.get<AssemblyResponse[]>('/assemblies'),

  /**
   * Lista próximas assembleias
   */
  listUpcoming: () => apiClient.get<AssemblyResponse[]>('/assemblies/upcoming'),

  /**
   * Busca assembleia por ID
   */
  getById: (id: string) => apiClient.get<AssemblyDetailResponse>(`/assemblies/${id}`),

  /**
   * Obtém estatísticas da assembleia
   */
  getStats: (id: string) =>
    apiClient.get<{
      participantsCount: number;
      agendaItemsCount: number;
      votedItemsCount: number;
      totalVotingWeight: number;
    }>(`/assemblies/${id}/stats`),

  /**
   * Cria nova assembleia
   */
  create: (data: CreateAssemblyDto) => apiClient.post<AssemblyResponse>('/assemblies', data),

  /**
   * Atualiza assembleia
   */
  update: (id: string, data: UpdateAssemblyDto) =>
    apiClient.put<AssemblyResponse>(`/assemblies/${id}`, data),

  /**
   * Remove assembleia
   */
  delete: (id: string) => apiClient.delete<void>(`/assemblies/${id}`),

  /**
   * Inicia assembleia
   */
  start: (id: string) => apiClient.post<AssemblyResponse>(`/assemblies/${id}/start`),

  /**
   * Finaliza assembleia
   */
  finish: (id: string) => apiClient.post<AssemblyResponse>(`/assemblies/${id}/finish`),

  /**
   * Cancela assembleia
   */
  cancel: (id: string) => apiClient.post<AssemblyResponse>(`/assemblies/${id}/cancel`),
};

export const agendaItemsApi = {
  /**
   * Lista pautas de uma assembleia
   */
  list: (assemblyId: string) =>
    apiClient.get<AgendaItemResponse[]>(`/assemblies/${assemblyId}/agenda-items`),

  /**
   * Busca pauta por ID
   */
  getById: (assemblyId: string, id: string) =>
    apiClient.get<AgendaItemResponse>(`/assemblies/${assemblyId}/agenda-items/${id}`),

  /**
   * Obtém resultado da votação
   */
  getVoteResult: (assemblyId: string, id: string) =>
    apiClient.get<VoteSummary>(`/assemblies/${assemblyId}/agenda-items/${id}/result`),

  /**
   * Cria nova pauta
   */
  create: (assemblyId: string, data: CreateAgendaItemDto) =>
    apiClient.post<AgendaItemResponse>(`/assemblies/${assemblyId}/agenda-items`, data),

  /**
   * Atualiza pauta
   */
  update: (assemblyId: string, id: string, data: UpdateAgendaItemDto) =>
    apiClient.put<AgendaItemResponse>(`/assemblies/${assemblyId}/agenda-items/${id}`, data),

  /**
   * Remove pauta
   */
  delete: (assemblyId: string, id: string) =>
    apiClient.delete<void>(`/assemblies/${assemblyId}/agenda-items/${id}`),

  /**
   * Inicia votação
   */
  startVoting: (assemblyId: string, id: string) =>
    apiClient.post<AgendaItemResponse>(`/assemblies/${assemblyId}/agenda-items/${id}/start-voting`),

  /**
   * Encerra votação
   */
  closeVoting: (assemblyId: string, id: string) =>
    apiClient.post<AgendaItemResponse>(`/assemblies/${assemblyId}/agenda-items/${id}/close-voting`),
};

export const participantsApi = {
  /**
   * Lista participantes de uma assembleia
   */
  list: (assemblyId: string) =>
    apiClient.get<ParticipantResponse[]>(`/assemblies/${assemblyId}/participants`),

  /**
   * Obtém estatísticas de presença
   */
  getAttendance: (assemblyId: string) =>
    apiClient.get<AttendanceStatus>(`/assemblies/${assemblyId}/participants/attendance`),

  /**
   * Busca participante por ID
   */
  getById: (assemblyId: string, id: string) =>
    apiClient.get<ParticipantResponse>(`/assemblies/${assemblyId}/participants/${id}`),

  /**
   * Registra participante
   */
  register: (assemblyId: string, data: RegisterParticipantDto) =>
    apiClient.post<ParticipantResponse>(`/assemblies/${assemblyId}/participants`, data),

  /**
   * Atualiza participante
   */
  update: (assemblyId: string, id: string, data: Partial<RegisterParticipantDto>) =>
    apiClient.put<ParticipantResponse>(`/assemblies/${assemblyId}/participants/${id}`, data),

  /**
   * Remove participante
   */
  remove: (assemblyId: string, id: string) =>
    apiClient.delete<void>(`/assemblies/${assemblyId}/participants/${id}`),

  /**
   * Marca entrada do participante
   */
  markJoined: (assemblyId: string, id: string) =>
    apiClient.post<ParticipantResponse>(`/assemblies/${assemblyId}/participants/${id}/join`),

  /**
   * Marca saída do participante
   */
  markLeft: (assemblyId: string, id: string) =>
    apiClient.post<ParticipantResponse>(`/assemblies/${assemblyId}/participants/${id}/leave`),
};

export const votesApi = {
  /**
   * Lista votos de uma pauta
   */
  list: (assemblyId: string, agendaItemId: string) =>
    apiClient.get<VoteResponse[]>(
      `/assemblies/${assemblyId}/agenda-items/${agendaItemId}/votes`
    ),

  /**
   * Obtém resumo dos votos
   */
  getSummary: (assemblyId: string, agendaItemId: string) =>
    apiClient.get<VoteSummary>(
      `/assemblies/${assemblyId}/agenda-items/${agendaItemId}/votes/summary`
    ),

  /**
   * Registra voto
   */
  cast: (assemblyId: string, agendaItemId: string, participantId: string, data: CastVoteDto) =>
    apiClient.post<VoteResponse>(
      `/assemblies/${assemblyId}/agenda-items/${agendaItemId}/votes/${participantId}`,
      data
    ),

  /**
   * Verifica se participante já votou
   */
  check: (assemblyId: string, agendaItemId: string, participantId: string) =>
    apiClient.get<{ hasVoted: boolean; vote?: VoteResponse }>(
      `/assemblies/${assemblyId}/agenda-items/${agendaItemId}/votes/check/${participantId}`
    ),
};

export const attendanceApi = {
  /**
   * Realiza check-in (público)
   */
  checkin: (data: CheckinRequest) =>
    apiClient.post<CheckinResponse>('/assemblies/checkin', data, { authenticated: false }),

  /**
   * Realiza checkout (público)
   */
  checkout: (data: { checkinToken: string; participantId: string }) =>
    apiClient.post<{ success: boolean; checkoutTime: string }>('/assemblies/checkout', data, {
      authenticated: false,
    }),

  /**
   * Valida token de check-in (público)
   */
  validateToken: (token: string) =>
    apiClient.get<{
      valid: boolean;
      requiresOtp: boolean;
      assembly?: {
        id: string;
        title: string;
        status: AssemblyStatus;
        scheduledAt: string;
        tenantName: string;
      };
    }>(`/assemblies/checkin/validate/${token}`, { authenticated: false }),

  /**
   * Valida OTP pelo token de check-in (público)
   */
  validateOtp: (checkinToken: string, otp: string) =>
    apiClient.post<{ valid: boolean; assemblyId?: string }>(
      `/assemblies/checkin/validate-otp/${checkinToken}`,
      { otp },
      { authenticated: false }
    ),

  /**
   * Gera token de check-in para QR Code
   */
  generateToken: (assemblyId: string) =>
    apiClient.post<QrCodeData>(`/assemblies/${assemblyId}/generate-checkin-token`),

  /**
   * Obtém status de presença
   */
  getStatus: (assemblyId: string) =>
    apiClient.get<AttendanceStatus>(`/assemblies/${assemblyId}/attendance`),

  /**
   * Lista participantes com status de presença
   */
  getParticipants: (assemblyId: string) =>
    apiClient.get<ParticipantResponse[]>(`/assemblies/${assemblyId}/attendance/participants`),
};

export const sessionApi = {
  /**
   * Valida sessao e obtem dados do participante
   */
  validate: (sessionToken: string) =>
    apiClient.get<{
      participantId: string;
      assemblyId: string;
      assemblyTitle: string;
      assemblyStatus: string;
      unitIdentifier: string;
      proxyName: string | null;
      approvalStatus: ParticipantApprovalStatus;
      rejectionReason: string | null;
      checkinTime: string;
      canVote: boolean;
    }>(`/assemblies/session/${sessionToken}`, { authenticated: false }),

  /**
   * Lista pautas da assembleia para o participante
   */
  getAgenda: (sessionToken: string) =>
    apiClient.get<{
      id: string;
      title: string;
      description: string | null;
      orderIndex: number;
      status: string;
      hasVoted: boolean;
      votingOtpRequired: boolean;
    }[]>(`/assemblies/session/${sessionToken}/agenda`, { authenticated: false }),

  /**
   * Obtem status do participante
   */
  getStatus: (sessionToken: string) =>
    apiClient.get<{
      isPresent: boolean;
      approvalStatus: ParticipantApprovalStatus;
      canVote: boolean;
      message: string;
    }>(`/assemblies/session/${sessionToken}/status`, { authenticated: false }),

  /**
   * Registra voto em uma pauta
   */
  castVote: (sessionToken: string, agendaItemId: string, otp: string, choice: string) =>
    apiClient.post<{
      success: boolean;
      voteId: string;
      choice: string;
      votedAt: string;
    }>(`/assemblies/session/${sessionToken}/vote`, { agendaItemId, otp, choice }, { authenticated: false }),
};

export const otpApi = {
  /**
   * Gera OTP para check-in da assembleia (Sindico)
   */
  generateCheckinOtp: (assemblyId: string) =>
    apiClient.post<{
      otp: string;
      expiresAt: string;
      remainingSeconds: number;
    }>(`/assemblies/${assemblyId}/otp/generate`),

  /**
   * Obtem OTP atual da assembleia (Sindico)
   */
  getCheckinOtp: (assemblyId: string) =>
    apiClient.get<{
      otp: string;
      expiresAt: string;
      remainingSeconds: number;
    } | null>(`/assemblies/${assemblyId}/otp`),

  /**
   * Gera OTP para votacao de pauta (Sindico)
   */
  generateVotingOtp: (assemblyId: string, agendaItemId: string) =>
    apiClient.post<{
      otp: string;
      expiresAt: string;
      remainingSeconds: number;
    }>(`/assemblies/${assemblyId}/agenda-items/${agendaItemId}/otp/generate`),

  /**
   * Obtem OTP atual da pauta (Sindico)
   */
  getVotingOtp: (assemblyId: string, agendaItemId: string) =>
    apiClient.get<{
      otp: string;
      expiresAt: string;
      remainingSeconds: number;
    } | null>(`/assemblies/${assemblyId}/agenda-items/${agendaItemId}/otp`),
};

export const proxyApi = {
  /**
   * Upload de arquivo de procuracao (via session token)
   */
  upload: (sessionToken: string, participantId: string, file: File) => {
    const formData = new FormData();
    formData.append('participantId', participantId);
    formData.append('file', file);

    return apiClient.post<{
      participantId: string;
      fileName: string;
      fileUrl: string;
      uploadedAt: string;
    }>('/assemblies/session/proxy/upload', formData, {
      authenticated: false,
      headers: {
        'x-session-token': sessionToken,
      },
    });
  },

  /**
   * Lista procuracoes pendentes de aprovacao
   */
  getPending: (assemblyId: string) =>
    apiClient.get<{
      participantId: string;
      unitIdentifier: string;
      proxyName: string;
      proxyDocument: string | null;
      fileName: string | null;
      fileUrl: string | null;
      checkinTime: string;
    }[]>(`/assemblies/${assemblyId}/pending-proxies`),

  /**
   * Aprova procuracao
   */
  approve: (assemblyId: string, participantId: string) =>
    apiClient.post<{
      participantId: string;
      unitIdentifier: string;
      approvalStatus: ParticipantApprovalStatus;
      approvedAt?: string;
    }>(`/assemblies/${assemblyId}/participants/${participantId}/approve`),

  /**
   * Rejeita procuracao
   */
  reject: (assemblyId: string, participantId: string, reason: string) =>
    apiClient.post<{
      participantId: string;
      unitIdentifier: string;
      approvalStatus: ParticipantApprovalStatus;
      approvedAt?: string;
      rejectionReason?: string;
    }>(`/assemblies/${assemblyId}/participants/${participantId}/reject`, { reason }),

  /**
   * Download do arquivo de procuracao
   */
  downloadUrl: (assemblyId: string, participantId: string) =>
    `/api/assemblies/${assemblyId}/participants/${participantId}/proxy`,
};

export const minutesApi = {
  /**
   * Busca ata da assembleia
   */
  get: (assemblyId: string) =>
    apiClient.get<MinutesResponse | null>(`/assemblies/${assemblyId}/minutes`),

  /**
   * Gera ata automaticamente
   */
  generate: (assemblyId: string) =>
    apiClient.post<{
      success: boolean;
      minutesId: string;
      content: string;
      summary: string;
      voteSummary: Record<string, unknown>;
      attendanceSummary: Record<string, unknown>;
    }>(`/assemblies/${assemblyId}/minutes/generate`),

  /**
   * Atualiza ata
   */
  update: (assemblyId: string, data: UpdateMinutesDto) =>
    apiClient.put<MinutesResponse>(`/assemblies/${assemblyId}/minutes`, data),

  /**
   * Aprova ata
   */
  approve: (assemblyId: string) =>
    apiClient.post<MinutesResponse>(`/assemblies/${assemblyId}/minutes/approve`),

  /**
   * Publica ata
   */
  publish: (assemblyId: string) =>
    apiClient.post<MinutesResponse>(`/assemblies/${assemblyId}/minutes/publish`),
};
