import { apiClient } from './client';
import type { Unit, CreateUnitDto, UpdateUnitDto, UnitStatus } from '@attrio/contracts';

export interface UnitResponse extends Omit<Unit, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export const unitsApi = {
  /**
   * Lista todas as unidades do condomínio
   */
  list: () => apiClient.get<UnitResponse[]>('/units'),

  /**
   * Busca unidade por ID
   */
  getById: (id: string) => apiClient.get<UnitResponse>(`/units/${id}`),

  /**
   * Cria nova unidade
   */
  create: (data: CreateUnitDto) => apiClient.post<UnitResponse>('/units', data),

  /**
   * Atualiza unidade
   */
  update: (id: string, data: UpdateUnitDto) => apiClient.put<UnitResponse>(`/units/${id}`, data),

  /**
   * Remove unidade
   */
  delete: (id: string) => apiClient.delete<void>(`/units/${id}`),

  /**
   * Desativa unidade
   */
  deactivate: (id: string) => apiClient.post<UnitResponse>(`/units/${id}/deactivate`),

  /**
   * Ativa unidade
   */
  activate: (id: string) => apiClient.post<UnitResponse>(`/units/${id}/activate`),
};
