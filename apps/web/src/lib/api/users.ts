import { apiClient } from './client';
import { UserRole } from '@attrio/contracts';

export interface UserResponse {
  id: string;
  supabaseUserId: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
  tenant: { id: string; name: string; slug: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: UserRole;
  tenantId?: string | null;
}

export const usersApi = {
  list: () => apiClient.get<UserResponse[]>('/users'),
  getById: (id: string) => apiClient.get<UserResponse>(`/users/${id}`),
  update: (id: string, data: UpdateUserDto) =>
    apiClient.put<UserResponse>(`/users/${id}`, data),
  resetPassword: (id: string, password: string) =>
    apiClient.post<{ message: string }>(`/users/${id}/reset-password`, { password }),
};
