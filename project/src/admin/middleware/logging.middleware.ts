import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const originalSend = res.send;

    // Capturar dados da requisição
    const requestData = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id,
      body: req.method !== 'GET' ? req.body : undefined
    };

    // Interceptar resposta
    res.send = function(body) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Log da ação (assíncrono para não bloquear a resposta)
      setImmediate(async () => {
        try {
          await this.logAction(requestData, res.statusCode, duration);
        } catch (error) {
          console.error('Erro ao registrar log:', error);
        }
      });

      return originalSend.call(this, body);
    }.bind(res);

    next();
  }

  private async logAction(requestData: any, statusCode: number, duration: number) {
    const level = this.getLogLevel(statusCode);
    const action = this.getActionFromUrl(requestData.url, requestData.method);
    const message = this.getLogMessage(requestData, statusCode, duration);

    await this.prisma.systemLog.create({
      data: {
        level,
        message,
        action,
        userId: requestData.userId,
        metadata: {
          method: requestData.method,
          url: requestData.url,
          statusCode,
          duration,
          userAgent: requestData.userAgent,
          ip: requestData.ip
        }
      }
    });
  }

  private getLogLevel(statusCode: number): string {
    if (statusCode >= 500) return 'ERROR';
    if (statusCode >= 400) return 'WARN';
    return 'INFO';
  }

  private getActionFromUrl(url: string, method: string): string {
    // Mapear URLs para ações legíveis
    const actionMap: Record<string, string> = {
      'POST /admin/users': 'CREATE_USER',
      'PUT /admin/users': 'UPDATE_USER',
      'DELETE /admin/users': 'DELETE_USER',
      'POST /admin/stores': 'CREATE_STORE',
      'PUT /admin/stores': 'UPDATE_STORE',
      'DELETE /admin/stores': 'DELETE_STORE',
      'POST /admin/products': 'CREATE_PRODUCT',
      'PUT /admin/products': 'UPDATE_PRODUCT',
      'DELETE /admin/products': 'DELETE_PRODUCT',
      'GET /admin/dashboard': 'VIEW_DASHBOARD',
      'GET /admin/reports': 'VIEW_REPORTS',
      'POST /admin/system/backup': 'CREATE_BACKUP',
      'POST /admin/system/cleanup': 'CLEANUP_SYSTEM'
    };

    const key = `${method} ${url.split('?')[0]}`;
    return actionMap[key] || `${method}_${url.split('/').pop()}`.toUpperCase();
  }

  private getLogMessage(requestData: any, statusCode: number, duration: number): string {
    const action = this.getActionFromUrl(requestData.url, requestData.method);
    const status = statusCode >= 400 ? 'falhou' : 'bem-sucedida';
    
    return `Ação ${action} ${status} em ${duration}ms`;
  }
}
