import { ApiClientConfig, ApiClientError, RequestOptions } from './types';

/**
 * Cliente HTTP base para a API do Attrio
 * Encapsula fetch com tratamento de erros e autenticacao
 */
export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * Monta a URL completa com query params
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(path, this.config.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Monta os headers da requisicao
   */
  private async buildHeaders(options?: RequestOptions): Promise<Headers> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...options?.headers,
    });

    // Adiciona token de autenticacao se disponivel
    if (this.config.getToken) {
      const token = await this.config.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  /**
   * Processa a resposta da API
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let error: ApiClientError;

      if (isJson) {
        const body = await response.json();
        error = {
          code: body.code || 'UNKNOWN_ERROR',
          message: body.message || 'Erro desconhecido',
          status: response.status,
          details: body.details,
          traceId: body.traceId,
        };
      } else {
        error = {
          code: 'HTTP_ERROR',
          message: `Erro HTTP: ${response.status} ${response.statusText}`,
          status: response.status,
        };
      }

      throw error;
    }

    if (isJson) {
      return response.json();
    }

    return {} as T;
  }

  /**
   * Requisicao GET
   */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const headers = await this.buildHeaders(options);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Requisicao POST
   */
  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const headers = await this.buildHeaders(options);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Requisicao PUT
   */
  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const headers = await this.buildHeaders(options);

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Requisicao PATCH
   */
  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const headers = await this.buildHeaders(options);

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Requisicao DELETE
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const headers = await this.buildHeaders(options);

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    return this.handleResponse<T>(response);
  }
}

// Instancia global (sera configurada pelo app)
let apiClientInstance: ApiClient | null = null;

/**
 * Cria e configura a instancia global do cliente
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  apiClientInstance = new ApiClient(config);
  return apiClientInstance;
}

/**
 * Retorna a instancia global do cliente
 * Lanca erro se nao estiver configurada
 */
export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    throw new Error(
      'ApiClient nao configurado. Chame createApiClient() antes de usar.',
    );
  }
  return apiClientInstance;
}
