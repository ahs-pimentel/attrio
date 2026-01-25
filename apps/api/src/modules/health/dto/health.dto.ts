import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckDto {
  @ApiProperty({
    example: 'ok',
    description: 'Status geral da API',
    enum: ['ok', 'degraded', 'error'],
  })
  status: 'ok' | 'degraded' | 'error';

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Timestamp da verificacao',
  })
  timestamp: string;

  @ApiProperty({
    example: 'attrio-api',
    description: 'Nome do servico',
  })
  service: string;

  @ApiProperty({
    example: '0.1.0',
    description: 'Versao da API',
  })
  version: string;
}

export class ServiceStatus {
  @ApiProperty({
    example: 'healthy',
    description: 'Status do servico',
    enum: ['healthy', 'unhealthy'],
  })
  status: 'healthy' | 'unhealthy';

  @ApiProperty({
    example: 10,
    description: 'Tempo de resposta em ms',
    required: false,
  })
  responseTime?: number;

  @ApiProperty({
    example: 'Conexao estabelecida',
    description: 'Mensagem descritiva',
    required: false,
  })
  message?: string;
}

export class HealthChecks {
  @ApiProperty({
    description: 'Status do banco de dados',
    type: ServiceStatus,
  })
  database: ServiceStatus;
}

export class DetailedHealthCheckDto extends HealthCheckDto {
  @ApiProperty({
    example: 3600,
    description: 'Tempo de atividade em segundos',
  })
  uptime: number;

  @ApiProperty({
    description: 'Status detalhado de cada servico',
    type: HealthChecks,
  })
  checks: HealthChecks;
}
