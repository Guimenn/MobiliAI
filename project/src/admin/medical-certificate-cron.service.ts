import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MedicalCertificateStatus } from '@prisma/client';

@Injectable()
export class MedicalCertificateCronService {
  private readonly logger = new Logger(MedicalCertificateCronService.name);

  constructor(private prisma: PrismaService) {
    // Iniciar verificação periódica (a cada hora)
    this.startPeriodicCheck();
  }

  // Inicia verificação periódica
  private startPeriodicCheck() {
    // Verificar imediatamente ao iniciar
    this.handleReactivation();
    
    // Verificar a cada hora
    setInterval(() => {
      this.handleReactivation();
    }, 60 * 60 * 1000); // 1 hora em milissegundos
  }

  // Método para reativar funcionários com atestados expirados
  async handleReactivation() {
    this.logger.log('Iniciando verificação de atestados expirados...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Buscar atestados aprovados que expiraram hoje ou antes
      const expiredCertificates = await this.prisma.medicalCertificate.findMany({
        where: {
          status: MedicalCertificateStatus.APPROVED,
          endDate: {
            lt: today
          },
          employee: {
            isActive: false
          }
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
            }
          }
        }
      });

      this.logger.log(`Encontrados ${expiredCertificates.length} atestados expirados`);

      // Reativar funcionários
      const reactivatedIds: string[] = [];
      for (const certificate of expiredCertificates) {
        // Verificar se não há outros atestados ativos
        const activeCertificates = await this.prisma.medicalCertificate.findFirst({
          where: {
            employeeId: certificate.employeeId,
            status: MedicalCertificateStatus.APPROVED,
            startDate: {
              lte: today
            },
            endDate: {
              gte: today
            }
          }
        });

        // Se não há atestados ativos, reativar o funcionário
        if (!activeCertificates) {
          await this.prisma.user.update({
            where: { id: certificate.employeeId },
            data: { isActive: true }
          });
          reactivatedIds.push(certificate.employeeId);
          this.logger.log(`Funcionário ${certificate.employee.name} (${certificate.employee.email}) reativado`);
        }
      }

      this.logger.log(`${reactivatedIds.length} funcionário(s) reativado(s) com sucesso`);
      
      return {
        message: `${reactivatedIds.length} funcionário(s) reativado(s)`,
        reactivatedIds
      };
    } catch (error) {
      this.logger.error('Erro ao reativar funcionários com atestados expirados:', error);
      throw error;
    }
  }

  // Método manual para reativar (pode ser chamado via endpoint)
  async reactivateEmployeesWithExpiredCertificates() {
    return this.handleReactivation();
  }
}

