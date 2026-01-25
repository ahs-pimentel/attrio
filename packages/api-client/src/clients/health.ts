import { HealthCheckResponse } from '@attrio/contracts';
import { getApiClient } from '../client';

/**
 * Cliente para endpoints de health check
 */
export const healthClient = {
  /**
   * Verificacao simples de saude
   */
  async check(): Promise<HealthCheckResponse> {
    return getApiClient().get<HealthCheckResponse>('/health');
  },

  /**
   * Verificacao detalhada de saude
   */
  async detailedCheck(): Promise<HealthCheckResponse & { uptime: number; checks: unknown }> {
    return getApiClient().get('/health/detailed');
  },
};
