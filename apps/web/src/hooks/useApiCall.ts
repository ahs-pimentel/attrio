import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ApiClientError } from '@/lib/api/client';
import { ErrorCode } from '@attrio/contracts';

interface ApiCallOptions {
  /** Mensagem de sucesso exibida no toast. Se omitida, nenhum toast de sucesso é mostrado. */
  successMessage?: string;
  /** Mensagem de erro customizada. Se omitida, usa a mensagem da API. */
  errorMessage?: string;
  /** Se true, não exibe toast de erro (útil quando o componente trata o erro visualmente). */
  silentError?: boolean;
}

interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para abstrair chamadas à API com feedback visual automático via toast.
 *
 * @example
 * const { execute, loading, error } = useApiCall();
 *
 * async function handleSave() {
 *   const result = await execute(
 *     () => apiClient.post('/units', body),
 *     { successMessage: 'Unidade criada com sucesso!' }
 *   );
 *   if (result) router.push('/dashboard/units');
 * }
 */
export function useApiCall<T = unknown>() {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      fn: () => Promise<T>,
      options: ApiCallOptions = {}
    ): Promise<T | null> => {
      const { successMessage, errorMessage, silentError = false } = options;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await fn();

        setState({ data: result, loading: false, error: null });

        if (successMessage) {
          toast.success(successMessage);
        }

        return result;
      } catch (err) {
        let message = errorMessage;

        if (!message) {
          if (err instanceof ApiClientError) {
            // Erros de validação: lista os campos com erro
            if (
              err.error?.code === ErrorCode.VALIDATION_ERROR &&
              Array.isArray(err.error?.details?.errors)
            ) {
              const errors = err.error.details.errors as Array<{
                property: string;
                constraints?: Record<string, string>;
              }>;
              message = errors
                .map((e) =>
                  e.constraints ? Object.values(e.constraints).join(', ') : e.property
                )
                .join('; ');
            } else {
              message = err.error?.message || err.message;
            }

            // Sessão expirada — força reload para redirecionar ao login
            if (err.statusCode === 401) {
              message = 'Sessão expirada. Faça login novamente.';
            }
          } else if (err instanceof Error) {
            message = err.message;
          } else {
            message = 'Ocorreu um erro inesperado';
          }
        }

        setState({ data: null, loading: false, error: message ?? null });

        if (!silentError) {
          toast.error(message);
        }

        return null;
      }
    },
    []
  );

  return {
    ...state,
    execute,
  };
}
