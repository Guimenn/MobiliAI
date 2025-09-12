import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Configurar CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Configurar validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
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
