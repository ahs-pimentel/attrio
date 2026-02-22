import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '@attrio/contracts';

interface NestValidationError {
  property: string;
  constraints?: Record<string, string>;
  children?: NestValidationError[];
}

function mapStatusToCode(status: number): ErrorCode {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ErrorCode.CONFLICT;
    case HttpStatus.UNPROCESSABLE_ENTITY:
    case HttpStatus.BAD_REQUEST:
      return ErrorCode.VALIDATION_ERROR;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const traceId = request.headers['x-trace-id'] as string | undefined;

    // Erros HTTP conhecidos do NestJS
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      // Erros de validacao do class-validator vem como array de messages
      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const raw = exceptionResponse as Record<string, unknown>;
        const isValidationError = Array.isArray(raw.message);

        const code = isValidationError
          ? ErrorCode.VALIDATION_ERROR
          : mapStatusToCode(status);

        const message = isValidationError
          ? 'Dados inválidos'
          : (raw.message as string) || exception.message;

        const details = isValidationError
          ? { errors: raw.message as NestValidationError[] }
          : undefined;

        return response.status(status).json({
          code,
          message,
          ...(details && { details }),
          ...(traceId && { traceId }),
        });
      }

      // Resposta simples de string
      return response.status(status).json({
        code: mapStatusToCode(status),
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exception.message,
        ...(traceId && { traceId }),
      });
    }

    // Erros inesperados (500)
    this.logger.error(
      `Unhandled error on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Erro interno do servidor',
      ...(traceId && { traceId }),
    });
  }
}
