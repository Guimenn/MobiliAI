import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error', 'warn'],
      errorFormat: 'minimal',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Prisma conectado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao conectar Prisma:', error);
      // Não falha a aplicação se não conseguir conectar
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
