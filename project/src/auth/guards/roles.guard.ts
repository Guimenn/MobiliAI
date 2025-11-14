import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Pegar roles do handler (método) primeiro, depois da classe
    // getAllAndOverride retorna o valor do handler se existir, senão da classe
    const handlerRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    const classRoles = this.reflector.get<UserRole[]>('roles', context.getClass());
    
    // Se o handler tem roles, usar essas. Senão, usar as da classe.
    const requiredRoles = handlerRoles || classRoles;

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      console.log('❌ [RolesGuard] Usuário não autenticado');
      return false;
    }

    const hasRole = requiredRoles.some((role) => {
      // Normalizar roles para comparação (pode ser string ou enum)
      const userRole = (user.role as string)?.toUpperCase();
      const requiredRole = (role as string)?.toUpperCase();
      return userRole === requiredRole;
    });

    if (!hasRole) {
      console.log('❌ [RolesGuard] Usuário não tem role necessária:', {
        userRole: user.role,
        requiredRoles
      });
    }

    return hasRole;
  }
}
