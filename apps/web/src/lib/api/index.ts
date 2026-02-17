// Core client
export { apiClient, request, ApiClientError, type ApiError } from './client';

// Re-export types from contracts
export { VoteChoice } from '@attrio/contracts';

// Auth
export { authApi, type ProfileResponse, type UserRole, type TenantInfo } from './auth';

// Users
export { usersApi, type UserResponse, type UpdateUserDto } from './users';

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
  sessionApi,
  otpApi,
  proxyApi,
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

export {
  announcementsApi,
  type AnnouncementResponse,
  type CreateAnnouncementDto as CreateAnnouncementInput,
  type UpdateAnnouncementDto as UpdateAnnouncementInput,
} from './announcements';

export {
  issueCategoriesApi,
  issuesApi,
  type IssueCategoryResponse,
  type CreateIssueCategoryDto,
  type UpdateIssueCategoryDto,
  type IssueResponse,
  type CreateIssueDto,
  type UpdateIssueDto,
} from './issues';

export {
  commonAreasApi,
  reservationsApi,
  type CommonAreaResponse,
  type CreateCommonAreaDto,
  type UpdateCommonAreaDto,
  type ReservationResponse,
  type CreateReservationDto,
  type UpdateReservationStatusDto,
} from './reservations';

export {
  subscriptionsApi,
  type PlanConfig,
  type TenantSubscription,
} from './subscriptions';
