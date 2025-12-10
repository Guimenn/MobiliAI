import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TransformUserDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    if (request.body) {
      // Transformar storeId de número para string se necessário
      if (request.body.storeId && typeof request.body.storeId === 'number') {
        request.body.storeId = String(request.body.storeId);
      }
      
      // Converter strings vazias em undefined para campos opcionais
      // Isso garante que @IsOptional() funcione corretamente com @IsUUID()
      if (request.body.storeId === '' || request.body.storeId === null) {
        request.body.storeId = undefined;
      }
    }
    
    return next.handle();
  }
}
