import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Prefixo global da API
  app.setGlobalPrefix('api');

  // Validacao global com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Configuracao do Swagger (OpenAPI)
  const config = new DocumentBuilder()
    .setTitle('Attrio API')
    .setDescription(
      'API da plataforma Attrio - Sistema de gerenciamento de condominios. ' +
        'Esta API fornece endpoints para gerenciar unidades, moradores, assembleias e votacoes.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT do Supabase Auth',
      },
      'supabase-auth',
    )
    .addTag('Health', 'Endpoints de verificacao de saude da API')
    .addTag('Tenants', 'Gerenciamento de condominios (tenants)')
    .addTag('Units', 'Gerenciamento de unidades')
    .addTag('Residents', 'Gerenciamento de moradores')
    .addTag('Assemblies', 'Gerenciamento de assembleias')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI padrao em /api/docs
  SwaggerModule.setup('api/docs', app, document);

  // Scalar UI em /api/reference (interface moderna)
  app.use(
    '/api/reference',
    apiReference({
      spec: {
        content: document,
      },
      theme: 'kepler',
      layout: 'modern',
      darkMode: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`Aplicacao rodando em: http://localhost:${port}`);
  logger.log(`Swagger UI: http://localhost:${port}/api/docs`);
  logger.log(`Scalar UI: http://localhost:${port}/api/reference`);
}

bootstrap();
