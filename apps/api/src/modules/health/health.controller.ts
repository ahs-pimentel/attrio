import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckDto, DetailedHealthCheckDto } from './dto/health.dto';
import { Public } from '../auth/decorators';

@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Verificacao simples de saude',
    description: 'Retorna o status basico da API',
  })
  @ApiResponse({
    status: 200,
    description: 'API esta funcionando',
    type: HealthCheckDto,
  })
  check(): HealthCheckDto {
    return this.healthService.check();
  }

  @Get('detailed')
  @ApiOperation({
    summary: 'Verificacao detalhada de saude',
    description: 'Retorna o status detalhado da API incluindo conexoes com banco de dados',
  })
  @ApiResponse({
    status: 200,
    description: 'Status detalhado da API',
    type: DetailedHealthCheckDto,
  })
  async detailedCheck(): Promise<DetailedHealthCheckDto> {
    return this.healthService.detailedCheck();
  }
}
