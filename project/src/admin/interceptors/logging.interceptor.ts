import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (data) => {
        // Log de sucesso
        await this.logSuccess(request, response, startTime, data);
      }),
      catchError(async (error) => {
        // Log de erro
        await this.logError(request, response, startTime, error);
        return throwError(() => error);
      })
    );
  }

  private async logSuccess(request: any, response: any, startTime: number, data: any) {
    try {
      const duration = Date.now() - startTime;
      const action = this.getActionFromRequest(request);
      const message = `Ação ${action} executada com sucesso`;

      await this.prisma.systemLog.create({
        data: {
          level: 'INFO',
          message,
          action,
          userId: request.user?.id,
          metadata: {
            method: request.method,
            url: request.url,
            statusCode: response.statusCode,
            duration,
            dataSize: JSON.stringify(data).length
          }
        }
      });
    } catch (error) {
      console.error('Erro ao registrar log de sucesso:', error);
    }
  }

  private async logError(request: any, response: any, startTime: number, error: any) {
    try {
      const duration = Date.now() - startTime;
      const action = this.getActionFromRequest(request);
      const message = `Erro na ação ${action}: ${error.message}`;

      await this.prisma.systemLog.create({
        data: {
          level: 'ERROR',
          message,
          action,
          userId: request.user?.id,
          metadata: {
            method: request.method,
            url: request.url,
            statusCode: response.statusCode,
            duration,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            }
          }
        }
      });
    } catch (logError) {
      console.error('Erro ao registrar log de erro:', logError);
    }
  }

  private getActionFromRequest(request: any): string {
    const method = request.method;
    const url = request.url.split('?')[0];
    
    // Mapear rotas para ações
    const routeMap: Record<string, string> = {
      'GET /admin/dashboard': 'VIEW_DASHBOARD',
      'GET /admin/users': 'LIST_USERS',
      'POST /admin/users': 'CREATE_USER',
      'PUT /admin/users': 'UPDATE_USER',
      'DELETE /admin/users': 'DELETE_USER',
      'GET /admin/stores': 'LIST_STORES',
      'POST /admin/stores': 'CREATE_STORE',
      'PUT /admin/stores': 'UPDATE_STORE',
      'DELETE /admin/stores': 'DELETE_STORE',
      'GET /admin/products': 'LIST_PRODUCTS',
      'POST /admin/products': 'CREATE_PRODUCT',
      'PUT /admin/products': 'UPDATE_PRODUCT',
      'DELETE /admin/products': 'DELETE_PRODUCT',
      'GET /admin/reports': 'VIEW_REPORTS',
      'POST /admin/system/backup': 'CREATE_BACKUP',
      'POST /admin/system/cleanup': 'CLEANUP_SYSTEM'
    };

    const key = `${method} ${url}`;
    return routeMap[key] || `${method}_${url.split('/').pop()}`.toUpperCase();
  }
}
