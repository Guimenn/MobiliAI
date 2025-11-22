import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers } = request;
    
    // Log para debug
    const authHeader = headers.authorization;
    const hasToken = !!authHeader && authHeader.startsWith('Bearer ');
    
    console.log('🔑 [JwtAuthGuard] Verificando autenticação:', {
      method,
      url,
      hasToken,
      tokenPreview: hasToken ? `${authHeader.substring(7, 27)}...` : 'none'
    });
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    
    if (err || !user) {
      console.error('❌ [JwtAuthGuard] Falha na autenticação:', {
        method,
        url,
        error: err?.message,
        info: info?.message,
        hasUser: !!user
      });
      throw err || new UnauthorizedException('Token inválido ou expirado');
    }
    
    console.log('✅ [JwtAuthGuard] Autenticação bem-sucedida:', {
      method,
      url,
      userId: user.id,
      userRole: user.role
    });
    
    return user;
  }
}
