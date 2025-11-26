import { Injectable, CanActivate, ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { AdminSystemService } from '../admin-system.service';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(private adminSystemService: AdminSystemService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verificar se está em modo de manutenção
    const maintenanceMode = await this.adminSystemService.getMaintenanceMode();

    if (maintenanceMode) {
      // Permitir apenas admins durante manutenção
      if (!user || user.role !== 'ADMIN') {
        throw new ServiceUnavailableException(
          'O sistema está em modo de manutenção. Tente novamente mais tarde.'
        );
      }
    }

    return true;
  }
}

