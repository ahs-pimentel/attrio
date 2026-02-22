// Tipos e contratos compartilhados do Attrio

// Subscription
export {
  SubscriptionPlan,
  SubscriptionStatus,
  type PlanConfig,
  type TenantSubscription,
  type TenantSubscriptionSummary,
} from './subscription';

// ============================================
// Enums
// ============================================

/** Papeis de usuario no sistema */
export enum UserRole {
  /** Administrador do SaaS */
  SAAS_ADMIN = 'SAAS_ADMIN',
  /** Sindico do condominio */
  SYNDIC = 'SYNDIC',
  /** Porteiro */
  DOORMAN = 'DOORMAN',
  /** Morador */
  RESIDENT = 'RESIDENT',
}

/** Status de uma unidade */
export enum UnitStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/** Status de um morador */
export enum ResidentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/** Tipo de morador */
export enum ResidentType {
  OWNER = 'OWNER',
  TENANT = 'TENANT',
}

/** Status de convite */
export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
}

/** Tipo de animal de estimacao */
export enum PetType {
  DOG = 'DOG',
  CAT = 'CAT',
  BIRD = 'BIRD',
  FISH = 'FISH',
  OTHER = 'OTHER',
}

/** Tipo de parentesco */
export enum RelationshipType {
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
  PARENT = 'PARENT',
  SIBLING = 'SIBLING',
  OTHER = 'OTHER',
}

/** Status de uma assembleia */
export enum AssemblyStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

/** Status de uma pauta */
export enum AgendaItemStatus {
  PENDING = 'PENDING',
  VOTING = 'VOTING',
  CLOSED = 'CLOSED',
}

/** Opcoes de voto */
export enum VoteChoice {
  YES = 'YES',
  NO = 'NO',
  ABSTENTION = 'ABSTENTION',
}

/** Tipo de comunicado */
export enum AnnouncementType {
  GENERAL = 'GENERAL',
  ASSEMBLY = 'ASSEMBLY',
}

/** Status de uma ocorrencia */
export enum IssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

/** Prioridade de uma ocorrencia */
export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/** Status de uma reserva */
export enum ReservationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

/** Tipo de transacao financeira */
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

/** Categoria de transacao financeira */
export enum TransactionCategory {
  COMMON_FEES = 'COMMON_FEES',
  MAINTENANCE = 'MAINTENANCE',
  UTILITIES = 'UTILITIES',
  SALARY = 'SALARY',
  INSURANCE = 'INSURANCE',
  RESERVE_FUND = 'RESERVE_FUND',
  OTHER = 'OTHER',
}

/** Status de aprovacao do participante (procuracao) */
export enum ParticipantApprovalStatus {
  /** Participante direto ou aprovado */
  APPROVED = 'APPROVED',
  /** Aguardando aprovacao de procuracao */
  PENDING = 'PENDING',
  /** Procuracao rejeitada */
  REJECTED = 'REJECTED',
}

// ============================================
// Tipos base
// ============================================

/** Codigos de erro padronizados da API */
export enum ErrorCode {
  // Autenticacao e autorizacao
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Recursos
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // Validacao
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Tenant / contexto
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  TENANT_REQUIRED = 'TENANT_REQUIRED',

  // Negocio
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

  // Servidor
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/** Resposta padrao de erro da API */
export interface ApiError {
  code: ErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
  traceId?: string;
}

/** Resposta paginada */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

/** Parametros de paginacao */
export interface PaginationParams {
  page?: number;
  perPage?: number;
}

// ============================================
// DTOs de Health
// ============================================

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  service: string;
  version: string;
}

// ============================================
// DTOs de Tenant
// ============================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DTOs de User
// ============================================

export interface User {
  id: string;
  tenantId: string;
  supabaseUserId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DTOs de Unit
// ============================================

export interface Unit {
  id: string;
  tenantId: string;
  block: string;
  number: string;
  identifier: string;
  status: UnitStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitDto {
  block: string;
  number: string;
  identifier?: string;
}

export interface UpdateUnitDto {
  block?: string;
  number?: string;
  identifier?: string;
  status?: UnitStatus;
}

// ============================================
// DTOs de Resident
// ============================================

export interface Resident {
  id: string;
  tenantId: string;
  unitId: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  status: ResidentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResidentDto {
  unitId: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdateResidentDto {
  unitId?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: ResidentStatus;
}

// ============================================
// DTOs de Assembly
// ============================================

export interface Assembly {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  scheduledAt: string;
  meetingUrl?: string;
  status: AssemblyStatus;
  createdAt: string;
  updatedAt: string;
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

// ============================================
// DTOs de AgendaItem (Pauta)
// ============================================

export interface AgendaItem {
  id: string;
  assemblyId: string;
  title: string;
  description?: string;
  order: number;
  status: AgendaItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgendaItemDto {
  title: string;
  description?: string;
  order?: number;
}

// ============================================
// DTOs de Vote
// ============================================

export interface Vote {
  id: string;
  agendaItemId: string;
  participantId: string;
  choice: VoteChoice;
  createdAt: string;
}

export interface CastVoteDto {
  choice: VoteChoice;
}

export interface VoteResult {
  agendaItemId: string;
  yes: number;
  no: number;
  abstention: number;
  total: number;
}
