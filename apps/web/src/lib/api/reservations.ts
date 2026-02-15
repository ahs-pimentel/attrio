import { apiClient } from './client';

export interface CommonAreaResponse {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  rules: string | null;
  maxCapacity: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommonAreaDto {
  name: string;
  description?: string;
  rules?: string;
  maxCapacity?: number;
}

export interface UpdateCommonAreaDto {
  name?: string;
  description?: string;
  rules?: string;
  maxCapacity?: number;
  active?: boolean;
}

export interface ReservationResponse {
  id: string;
  tenantId: string;
  commonAreaId: string;
  commonAreaName: string;
  reservedBy: string;
  reservedByName: string;
  reservationDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  notes: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationDto {
  commonAreaId: string;
  reservationDate: string;
  notes?: string;
}

export interface UpdateReservationStatusDto {
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
}

export const commonAreasApi = {
  list: () => apiClient.get<CommonAreaResponse[]>('/common-areas'),
  getById: (id: string) => apiClient.get<CommonAreaResponse>(`/common-areas/${id}`),
  create: (data: CreateCommonAreaDto) =>
    apiClient.post<CommonAreaResponse>('/common-areas', data),
  update: (id: string, data: UpdateCommonAreaDto) =>
    apiClient.put<CommonAreaResponse>(`/common-areas/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/common-areas/${id}`),
};

export const reservationsApi = {
  list: () => apiClient.get<ReservationResponse[]>('/reservations'),
  getByArea: (areaId: string, month?: string) =>
    apiClient.get<ReservationResponse[]>(
      `/reservations/area/${areaId}${month ? `?month=${month}` : ''}`,
    ),
  getById: (id: string) => apiClient.get<ReservationResponse>(`/reservations/${id}`),
  create: (data: CreateReservationDto) =>
    apiClient.post<ReservationResponse>('/reservations', data),
  updateStatus: (id: string, data: UpdateReservationStatusDto) =>
    apiClient.patch<ReservationResponse>(`/reservations/${id}/status`, data),
  delete: (id: string) => apiClient.delete<void>(`/reservations/${id}`),
};
