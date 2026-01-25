import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthCheckDto, DetailedHealthCheckDto, ServiceStatus } from './dto/health.dto';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  check(): HealthCheckDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'attrio-api',
      version: '0.1.0',
    };
  }

  async detailedCheck(): Promise<DetailedHealthCheckDto> {
    const dbStatus = await this.checkDatabase();
    const uptime = process.uptime();

    const allHealthy = dbStatus.status === 'healthy';

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'attrio-api',
      version: '0.1.0',
      uptime: Math.floor(uptime),
      checks: {
        database: dbStatus,
      },
    };
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    try {
      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        message: 'Conexao com PostgreSQL estabelecida',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Erro na conexao com PostgreSQL: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }
}
