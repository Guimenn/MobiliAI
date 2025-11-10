import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

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

    // Interceptar erros de conexão
    this.$on('error' as never, (e: any) => {
      this.logger.error('Erro do Prisma:', e);
    });

    // Configurar pool de conexões para evitar timeouts
    // O Prisma gerencia o pool automaticamente, mas podemos adicionar tratamento
  }

  // Método para verificar e garantir conexão
  async ensureConnection() {
    try {
      // Testar conexão
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error: any) {
      const errorMessage = error.message || '';
      const errorCode = error.code || '';
      
      if (
        errorCode === 'P1017' || 
        errorMessage.includes('Server has closed the connection') ||
        errorMessage.includes('Engine is not yet connected') ||
        errorMessage.includes('not connected') ||
        errorMessage.includes('not yet connected')
      ) {
        this.logger.warn('Conexão perdida, reconectando...', { errorCode, errorMessage });
        
        // Tentar reconectar
        try {
          await this.$disconnect().catch(() => {
            // Ignorar erros ao desconectar
          });
          await this.$connect();
          this.logger.log('✅ Reconexão bem-sucedida!');
          
          // Testar novamente
          await this.$queryRaw`SELECT 1`;
          return true;
        } catch (reconnectError: any) {
          this.logger.error('Falha ao reconectar:', reconnectError);
          // Tentar usar o método de reconexão completo
          await this.handleReconnect();
          await this.$queryRaw`SELECT 1`;
          return true;
        }
      }
      throw error;
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Prisma conectado com sucesso!');
      this.reconnectAttempts = 0;
    } catch (error) {
      this.logger.error('❌ Erro ao conectar Prisma:', error);
      await this.handleReconnect();
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Prisma desconectado');
    } catch (error) {
      this.logger.error('Erro ao desconectar Prisma:', error);
    }
  }

  private async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Número máximo de tentativas de reconexão atingido');
      return;
    }

    this.reconnectAttempts++;
    this.logger.log(`Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    try {
      // Desconectar se já estiver conectado
      try {
        await this.$disconnect();
      } catch (e) {
        // Ignorar erros ao desconectar
      }

      // Aguardar um pouco antes de reconectar
      await new Promise(resolve => setTimeout(resolve, 1000 * this.reconnectAttempts));

      // Reconectar
      await this.$connect();
      this.logger.log('✅ Reconexão bem-sucedida!');
      this.reconnectAttempts = 0;
    } catch (error) {
      this.logger.error(`Erro na tentativa ${this.reconnectAttempts}:`, error);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        // Tentar novamente
        await this.handleReconnect();
      }
    }
  }

  // Método auxiliar para executar queries com retry
  async executeWithRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        if (error.code === 'P1017' || error.message?.includes('Server has closed the connection')) {
          if (i < retries - 1) {
            this.logger.warn(`Tentativa ${i + 1} falhou, tentando novamente...`);
            await this.handleReconnect();
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
        }
        throw error;
      }
    }
    throw new Error('Todas as tentativas falharam');
  }
}
