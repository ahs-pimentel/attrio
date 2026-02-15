import { apiClient } from './client';

export interface IssueCategoryResponse {
  id: string;
  tenantId: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface CreateIssueCategoryDto {
  name: string;
}

export interface UpdateIssueCategoryDto {
  name?: string;
  active?: boolean;
}

export interface IssueResponse {
  id: string;
  tenantId: string;
  unitId: string | null;
  unitIdentifier: string | null;
  categoryId: string | null;
  categoryName: string | null;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdBy: string;
  createdByName: string;
  resolvedBy: string | null;
  resolvedByName: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueDto {
  title: string;
  description: string;
  categoryId?: string;
  unitId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface UpdateIssueDto {
  title?: string;
  description?: string;
  categoryId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolutionNote?: string;
}

export const issueCategoriesApi = {
  list: () => apiClient.get<IssueCategoryResponse[]>('/issue-categories'),
  create: (data: CreateIssueCategoryDto) =>
    apiClient.post<IssueCategoryResponse>('/issue-categories', data),
  update: (id: string, data: UpdateIssueCategoryDto) =>
    apiClient.put<IssueCategoryResponse>(`/issue-categories/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/issue-categories/${id}`),
};

export const issuesApi = {
  list: () => apiClient.get<IssueResponse[]>('/issues'),
  getById: (id: string) => apiClient.get<IssueResponse>(`/issues/${id}`),
  create: (data: CreateIssueDto) => apiClient.post<IssueResponse>('/issues', data),
  update: (id: string, data: UpdateIssueDto) =>
    apiClient.put<IssueResponse>(`/issues/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/issues/${id}`),
};
