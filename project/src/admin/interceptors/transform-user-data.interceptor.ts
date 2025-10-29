import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TransformUserDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Transformar storeId de número para string se necessário
    if (request.body && request.body.storeId && typeof request.body.storeId === 'number') {
      request.body.storeId = String(request.body.storeId);
    }
    
    return next.handle();
  }
}
