import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    
    // Pegar roles do handler (método) primeiro, depois da classe
    // getAllAndOverride retorna o valor do handler se existir, senão da classe
    const handlerRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    const classRoles = this.reflector.get<UserRole[]>('roles', context.getClass());
    
    // Se o handler tem roles, usar essas. Senão, usar as da classe.
    const requiredRoles = handlerRoles || classRoles;

    if (!requiredRoles) {
      return true;
    }

    const { user } = request;
    
    console.log('🔐 [RolesGuard] Verificando permissões:', {
      method,
      url,
      userRole: user?.role,
      requiredRoles,
      hasUser: !!user
    });
    
    if (!user) {
      console.error('❌ [RolesGuard] Usuário não autenticado');
      throw new ForbiddenException('Usuário não autenticado');
    }

    const hasRole = requiredRoles.some((role) => {
      // Normalizar roles para comparação (pode ser string ou enum)
      const userRole = (user.role as string)?.toUpperCase();
      const requiredRole = (role as string)?.toUpperCase();
      const matches = userRole === requiredRole;
      
      console.log('🔍 [RolesGuard] Comparando roles:', {
        userRole,
        requiredRole,
        matches
      });
      
      return matches;
    });

    if (!hasRole) {
      console.error('❌ [RolesGuard] Usuário não tem role necessária:', {
        userRole: user.role,
        requiredRoles,
        method,
        url
      });
      throw new ForbiddenException(`Acesso negado. Role necessária: ${requiredRoles.join(' ou ')}`);
    }

    console.log('✅ [RolesGuard] Permissão concedida');
    return true;
  }
}
