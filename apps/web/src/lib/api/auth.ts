import { request } from './client';

export type UserRole = 'SAAS_ADMIN' | 'SYNDIC' | 'DOORMAN' | 'RESIDENT';

export interface ProfileResponse {
  id: string;
  email?: string;
  phone?: string;
  isAnonymous: boolean;
  userId?: string;
  tenantId?: string | null;
  role?: UserRole;
}

export const authApi = {
  /**
   * Obtém o perfil do usuário autenticado
   */
  getProfile: () => request<ProfileResponse>('/auth/profile'),
};
