import { request } from './client';

export type UserRole = 'SAAS_ADMIN' | 'SYNDIC' | 'DOORMAN' | 'RESIDENT';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

export interface ProfileResponse {
  id: string;
  email?: string;
  phone?: string;
  isAnonymous: boolean;
  userId?: string;
  tenantId?: string | null;
  role?: UserRole;
  availableTenants?: TenantInfo[];
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
}

export interface UpdateProfileResponse {
  id: string;
  name: string;
  email: string;
}

export const authApi = {
  /**
   * Obtem o perfil do usuario autenticado
   */
  getProfile: () => request<ProfileResponse>('/auth/profile'),

  /**
   * Atualiza o perfil do usuario autenticado
   */
  updateProfile: (data: UpdateProfileDto) =>
    request<UpdateProfileResponse>('/auth/profile', {
      method: 'PUT',
      body: data,
    }),

  /**
   * Lista condominios do usuario autenticado
   */
  getUserTenants: () => request<TenantInfo[]>('/auth/tenants'),

  /**
   * Troca o condominio ativo
   */
  switchTenant: (tenantId: string) =>
    request<{ tenantId: string }>('/auth/switch-tenant', {
      method: 'POST',
      body: { tenantId },
    }),
};
