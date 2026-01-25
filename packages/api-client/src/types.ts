/** Configuracao do cliente da API */
export interface ApiClientConfig {
  /** URL base da API (ex: http://localhost:3001/api) */
  baseUrl: string;
  /** Funcao para obter o token de autenticacao */
  getToken?: () => Promise<string | null>;
  /** Headers adicionais */
  headers?: Record<string, string>;
}

/** Resposta padronizada da API */
export interface ApiResponse<T> {
  data: T;
  status: number;
}

/** Erro da API */
export interface ApiClientError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
  traceId?: string;
}

/** Opcoes de requisicao */
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
}
