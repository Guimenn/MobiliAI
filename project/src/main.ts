import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Aumentar limite de tamanho do body parser para permitir uploads de imagens
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Configurar CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Configurar validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Mudado para false para permitir campos extras temporariamente
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Converter tipos automaticamente
      },
      exceptionFactory: (errors) => {
        const errorMessages = errors.map(e => {
          const constraints = Object.values(e.constraints || {}).join(', ');
          return `${e.property}: ${constraints}`;
        }).join('; ');
        console.log('❌ Erro de validação:', JSON.stringify(errors, null, 2));
        const error = new BadRequestException(`Dados inválidos: ${errorMessages}`);
        return error;
      },
    }),
  );

  // Configurar prefixo global
  app.setGlobalPrefix('api');

  // Configurar arquivos estáticos para servir imagens processadas
  app.useStaticAssets(join(process.cwd(), 'temp'), {
    prefix: '/temp/',
  });

  const port = configService.get('PORT', 3001);
  await app.listen(port);
  
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📱 API disponível em http://localhost:${port}/api`);
}
bootstrap();
