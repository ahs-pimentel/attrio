import { request } from './client';

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
}

export interface UpdateTenantDto {
  name?: string;
  slug?: string;
  active?: boolean;
}

export const tenantsApi = {
  list: () => request<TenantResponse[]>('/tenants'),

  getById: (id: string) => request<TenantResponse>(`/tenants/${id}`),

  getBySlug: (slug: string) => request<TenantResponse>(`/tenants/slug/${slug}`),

  create: (data: CreateTenantDto) =>
    request<TenantResponse>('/tenants', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateTenantDto) =>
    request<TenantResponse>(`/tenants/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    request<void>(`/tenants/${id}`, {
      method: 'DELETE',
    }),

  activate: (id: string) =>
    request<TenantResponse>(`/tenants/${id}/activate`, {
      method: 'POST',
    }),

  deactivate: (id: string) =>
    request<TenantResponse>(`/tenants/${id}/deactivate`, {
      method: 'POST',
    }),
};
