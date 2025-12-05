import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentExpirationCronService {
  private readonly logger = new Logger(PaymentExpirationCronService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    // Iniciar verificação periódica (a cada 5 minutos)
    this.startPeriodicCheck();
  }

  // Inicia verificação periódica
  private startPeriodicCheck() {
    // Verificar imediatamente ao iniciar
    this.handleExpiredPayments();
    
    // Verificar a cada 5 minutos
    setInterval(() => {
      this.handleExpiredPayments();
    }, 5 * 60 * 1000); // 5 minutos em milissegundos
  }

  // Método para cancelar pedidos PENDING expirados e enviar notificações
  async handleExpiredPayments() {
    this.logger.log('Iniciando verificação de pagamentos expirados...');
    
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hora atrás
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutos atrás
      const fiftyMinutesAgo = new Date(now.getTime() - 50 * 60 * 1000); // 50 minutos atrás

      // Buscar pedidos PENDING criados há mais de 1 hora
      const expiredOrders = await this.prisma.sale.findMany({
        where: {
          status: 'PENDING',
          createdAt: {
            lte: oneHourAgo,
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Encontrados ${expiredOrders.length} pedidos expirados`);

      // Cancelar pedidos expirados e restaurar estoque
      const cancelledIds: string[] = [];
      for (const order of expiredOrders) {
        try {
          // Atualizar status para CANCELLED
          await this.prisma.sale.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              notes: order.notes 
                ? `${order.notes}\nCancelado automaticamente por falta de pagamento após 1 hora.`
                : 'Cancelado automaticamente por falta de pagamento após 1 hora.',
            },
          });

          // Restaurar estoque dos produtos
          for (const item of order.items) {
            await this.prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
              },
            });
          }

          // Enviar notificação de cancelamento ao cliente
          if (order.customerId) {
            await this.notificationsService.notifyPaymentExpired(
              order.customerId,
              order.id,
              order.saleNumber,
            );
          }

          cancelledIds.push(order.id);
          this.logger.log(`Pedido #${order.saleNumber} (${order.id}) cancelado por falta de pagamento`);
        } catch (error) {
          this.logger.error(`Erro ao cancelar pedido ${order.id}:`, error);
        }
      }

      // Buscar pedidos que estão próximos de expirar (30 minutos restantes)
      const warningOrders = await this.prisma.sale.findMany({
        where: {
          status: 'PENDING',
          createdAt: {
            gte: fiftyMinutesAgo,
            lte: thirtyMinutesAgo,
          },
        },
        include: {
          customer: {
            select: {
              id: true,
            },
          },
        },
      });

      // Enviar notificações de aviso para pedidos próximos de expirar
      for (const order of warningOrders) {
        if (order.customerId) {
          // Verificar se já foi enviada notificação de aviso (evitar spam)
          // Buscar notificações do tipo PAYMENT_WARNING para este pedido
          const existingNotifications = await this.prisma.notification.findMany({
            where: {
              userId: order.customerId,
              type: 'PAYMENT_WARNING',
            },
          });

          // Verificar se alguma notificação tem o saleId correto no metadata
          const hasExistingNotification = existingNotifications.some(notif => {
            try {
              const metadata = notif.metadata as any;
              return metadata?.saleId === order.id;
            } catch {
              return false;
            }
          });

          if (!hasExistingNotification) {
            await this.notificationsService.notifyPaymentWarning(
              order.customerId,
              order.id,
              order.saleNumber,
              30, // 30 minutos restantes
            );
            this.logger.log(`Notificação de aviso enviada para pedido #${order.saleNumber}`);
          }
        }
      }

      this.logger.log(`${cancelledIds.length} pedido(s) cancelado(s) com sucesso`);
      
      return {
        message: `${cancelledIds.length} pedido(s) cancelado(s)`,
        cancelledIds,
      };
    } catch (error: any) {
      this.logger.error('Erro ao processar pagamentos expirados:', error);
      throw error;
    }
  }

  // Método manual para processar (pode ser chamado via endpoint)
  async processExpiredPayments() {
    return this.handleExpiredPayments();
  }
}
