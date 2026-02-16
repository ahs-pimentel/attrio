import { apiClient } from './client';

export interface AnnouncementResponse {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  type: 'GENERAL' | 'ASSEMBLY';
  assemblyId: string | null;
  published: boolean;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  likedByMe: boolean;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  type?: 'GENERAL' | 'ASSEMBLY';
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  published?: boolean;
}

export const announcementsApi = {
  list: () => apiClient.get<AnnouncementResponse[]>('/announcements'),

  getById: (id: string) => apiClient.get<AnnouncementResponse>(`/announcements/${id}`),

  create: (data: CreateAnnouncementDto) =>
    apiClient.post<AnnouncementResponse>('/announcements', data),

  update: (id: string, data: UpdateAnnouncementDto) =>
    apiClient.put<AnnouncementResponse>(`/announcements/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/announcements/${id}`),

  recordView: (id: string) => apiClient.post<void>(`/announcements/${id}/view`),

  toggleLike: (id: string) =>
    apiClient.post<{ liked: boolean }>(`/announcements/${id}/like`),
};
