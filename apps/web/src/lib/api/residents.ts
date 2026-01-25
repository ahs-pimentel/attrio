import { apiClient } from './client';
import type { ResidentStatus, ResidentType, InviteStatus, PetType, RelationshipType } from '@attrio/contracts';

// Types para Moradores
export interface ResidentResponse {
  id: string;
  tenantId: string;
  unitId: string;
  userId?: string | null;
  type: ResidentType;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  rg?: string | null;
  cpf?: string | null;
  moveInDate?: string | null;
  landlordName?: string | null;
  landlordPhone?: string | null;
  landlordEmail?: string | null;
  dataConsent: boolean;
  dataConsentAt?: string | null;
  status: ResidentStatus;
  createdAt: string;
  updatedAt: string;
  emergencyContacts?: EmergencyContact[];
  householdMembers?: HouseholdMember[];
  employees?: UnitEmployee[];
  vehicles?: Vehicle[];
  pets?: Pet[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  isWhatsApp: boolean;
}

export interface HouseholdMember {
  id: string;
  name: string;
  email?: string | null;
  document?: string | null;
  relationship: RelationshipType;
}

export interface UnitEmployee {
  id: string;
  name: string;
  document?: string | null;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  color: string;
  plate: string;
}

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  breed?: string | null;
  color?: string | null;
}

export interface UpdateResidentDto {
  type?: ResidentType;
  fullName?: string;
  email?: string;
  phone?: string;
  rg?: string;
  cpf?: string;
  moveInDate?: string;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  status?: ResidentStatus;
}

// Types para Convites
export interface InviteResponse {
  id: string;
  tenantId: string;
  unitId: string;
  name: string;
  email: string;
  phone: string;
  token: string;
  status: InviteStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}

export interface CreateInviteDto {
  unitId: string;
  name: string;
  email: string;
  phone: string;
}

export interface ValidateInviteResponse {
  valid: boolean;
  invite?: {
    name: string;
    email: string;
    phone: string;
    unitIdentifier: string;
    tenantName: string;
  };
  error?: string;
}

export interface CompleteRegistrationDto {
  inviteToken: string;
  type: ResidentType;
  fullName: string;
  rg?: string;
  cpf?: string;
  moveInDate?: string;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    isWhatsApp: boolean;
  }>;
  householdMembers?: Array<{
    name: string;
    email?: string;
    document?: string;
    relationship: RelationshipType;
  }>;
  employees?: Array<{
    name: string;
    document?: string;
  }>;
  vehicles?: Array<{
    brand: string;
    model: string;
    color: string;
    plate: string;
  }>;
  pets?: Array<{
    name: string;
    type: PetType;
    breed?: string;
    color?: string;
  }>;
  dataConsent: boolean;
  password: string;
}

export const residentsApi = {
  /**
   * Lista todos os moradores do condomínio
   */
  list: () => apiClient.get<ResidentResponse[]>('/residents'),

  /**
   * Busca morador por ID
   */
  getById: (id: string) => apiClient.get<ResidentResponse>(`/residents/${id}`),

  /**
   * Busca moradores por unidade
   */
  getByUnit: (unitId: string) => apiClient.get<ResidentResponse[]>(`/residents/unit/${unitId}`),

  /**
   * Busca morador do usuário logado
   */
  getMe: () => apiClient.get<ResidentResponse>('/residents/me'),

  /**
   * Atualiza morador
   */
  update: (id: string, data: UpdateResidentDto) =>
    apiClient.put<ResidentResponse>(`/residents/${id}`, data),

  /**
   * Desativa morador
   */
  deactivate: (id: string) => apiClient.post<ResidentResponse>(`/residents/${id}/deactivate`),

  /**
   * Ativa morador
   */
  activate: (id: string) => apiClient.post<ResidentResponse>(`/residents/${id}/activate`),

  /**
   * Remove morador
   */
  delete: (id: string) => apiClient.delete<void>(`/residents/${id}`),
};

export const invitesApi = {
  /**
   * Lista convites do condomínio
   */
  list: () => apiClient.get<InviteResponse[]>('/invites'),

  /**
   * Cria convite para novo morador
   */
  create: (data: CreateInviteDto) => apiClient.post<InviteResponse>('/invites', data),

  /**
   * Reenvia convite
   */
  resend: (id: string) => apiClient.post<InviteResponse>(`/invites/${id}/resend`),

  /**
   * Cancela convite
   */
  cancel: (id: string) => apiClient.delete<void>(`/invites/${id}`),

  /**
   * Valida token de convite (público)
   */
  validate: (token: string) =>
    apiClient.get<ValidateInviteResponse>(`/invites/validate/${token}`, { authenticated: false }),

  /**
   * Completa registro de morador (público)
   */
  completeRegistration: (data: CompleteRegistrationDto) =>
    apiClient.post<ResidentResponse>('/invites/complete-registration', data, { authenticated: false }),
};
