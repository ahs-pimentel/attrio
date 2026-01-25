// Core client
export { apiClient, request, ApiClientError, type ApiError } from './client';

// Domain-specific clients
export { unitsApi, type UnitResponse } from './units';

export {
  tenantsApi,
  type TenantResponse,
  type CreateTenantDto,
  type UpdateTenantDto,
} from './tenants';

export {
  residentsApi,
  invitesApi,
  type ResidentResponse,
  type EmergencyContact,
  type HouseholdMember,
  type UnitEmployee,
  type Vehicle,
  type Pet,
  type UpdateResidentDto,
  type InviteResponse,
  type CreateInviteDto,
  type ValidateInviteResponse,
  type CompleteRegistrationDto,
} from './residents';

export {
  assembliesApi,
  agendaItemsApi,
  participantsApi,
  votesApi,
  attendanceApi,
  minutesApi,
  type AssemblyResponse,
  type AssemblyDetailResponse,
  type CreateAssemblyDto,
  type UpdateAssemblyDto,
  type AgendaItemResponse,
  type CreateAgendaItemDto,
  type UpdateAgendaItemDto,
  type ParticipantResponse,
  type RegisterParticipantDto,
  type VoteResponse,
  type CastVoteDto,
  type VoteSummary,
  type AttendanceStatus,
  type CheckinRequest,
  type CheckinResponse,
  type QrCodeData,
  type MinutesResponse,
  type UpdateMinutesDto,
} from './assemblies';
