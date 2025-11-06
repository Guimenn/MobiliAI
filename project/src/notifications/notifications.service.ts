import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
    actionUrl?: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId: userId,
        type: type,
        title: title,
        message: message,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        actionUrl: actionUrl || null,
        isRead: false,
      },
    });
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string) {
    try {
      // Tentar garantir conexão antes de fazer query
      await this.prisma.$connect();
      
      return await this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });
    } catch (error: any) {
      // Em caso de erro de conexão, tentar reconectar e tentar novamente
      if (error.code === 'P1017' || error.message?.includes('Server has closed the connection')) {
        try {
          console.warn('Erro de conexão ao buscar notificações, tentando reconectar...');
          await this.prisma.$disconnect();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.prisma.$connect();
          
          return await this.prisma.notification.count({
            where: {
              userId,
              isRead: false,
            },
          });
        } catch (retryError) {
          console.error('Erro ao reconectar:', retryError);
          // Retornar 0 em vez de lançar erro para evitar quebrar o frontend
          return 0;
        }
      }
      
      // Em caso de outros erros, retornar 0 em vez de lançar erro
      console.error('Erro ao buscar contagem de notificações:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notificação não encontrada');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notificação não encontrada');
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  // Métodos auxiliares para criar notificações específicas

  async notifyCartAdded(userId: string, productId: string, productName: string) {
    return this.createNotification(
      userId,
      NotificationType.CART_ADDED,
      'Produto adicionado ao carrinho',
      `${productName} foi adicionado ao seu carrinho`,
      { productId },
      `/products/${productId}`,
    );
  }

  async notifyFavoriteAdded(userId: string, productId: string, productName: string) {
    return this.createNotification(
      userId,
      NotificationType.FAVORITE_ADDED,
      'Produto favoritado',
      `Você favoritou ${productName}`,
      { productId },
      `/products/${productId}`,
    );
  }

  async notifyOrderCreated(userId: string, saleId: string, saleNumber: string, totalAmount: number) {
    return this.createNotification(
      userId,
      NotificationType.ORDER_CREATED,
      'Pedido criado com sucesso',
      `Seu pedido #${saleNumber} foi criado. Valor total: R$ ${totalAmount.toFixed(2)}`,
      { saleId, saleNumber },
      `/orders/${saleId}`,
    );
  }

  async notifyOrderStatusChanged(
    userId: string,
    saleId: string,
    saleNumber: string,
    status: string,
  ) {
    const statusMessages: Record<string, string> = {
      PENDING: 'está pendente',
      COMPLETED: 'foi concluído',
      CANCELLED: 'foi cancelado',
      DELIVERED: 'foi entregue',
    };

    const message = statusMessages[status] || 'teve o status alterado';

    return this.createNotification(
      userId,
      NotificationType.ORDER_STATUS_CHANGED,
      'Status do pedido atualizado',
      `Seu pedido #${saleNumber} ${message}`,
      { saleId, saleNumber, status },
      `/orders/${saleId}`,
    );
  }

  async notifyProductPromotion(
    userId: string,
    productId: string,
    productName: string,
    discountPercentage: number,
  ) {
    return this.createNotification(
      userId,
      NotificationType.PRODUCT_PROMOTION,
      'Promoção em produto favorito',
      `${productName} está com ${discountPercentage}% de desconto!`,
      { productId, discountPercentage },
      `/products/${productId}`,
    );
  }

  async notifyCouponExpiring(
    userId: string,
    couponCode: string,
    daysLeft: number,
  ) {
    return this.createNotification(
      userId,
      NotificationType.COUPON_EXPIRING,
      'Cupom prestes a expirar',
      `Seu cupom ${couponCode} expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`,
      { couponCode, daysLeft },
      '/coupons',
    );
  }

  async notifyOrderPreparing(userId: string, saleId: string, saleNumber: string) {
    return this.createNotification(
      userId,
      NotificationType.ORDER_PREPARING,
      'Pedido em preparação',
      `Seu pedido #${saleNumber} está sendo preparado`,
      { saleId, saleNumber },
      `/orders/${saleId}`,
    );
  }

  async notifyOrderShipped(userId: string, saleId: string, saleNumber: string, trackingCode?: string) {
    return this.createNotification(
      userId,
      NotificationType.ORDER_SHIPPED,
      'Pedido enviado',
      `Seu pedido #${saleNumber} foi enviado${trackingCode ? `. Código de rastreamento: ${trackingCode}` : ''}`,
      { saleId, saleNumber, trackingCode },
      `/orders/${saleId}`,
    );
  }

  async notifyOrderDelivered(userId: string, saleId: string, saleNumber: string) {
    return this.createNotification(
      userId,
      NotificationType.ORDER_DELIVERED,
      'Pedido entregue',
      `Seu pedido #${saleNumber} foi entregue!`,
      { saleId, saleNumber },
      `/orders/${saleId}`,
    );
  }
}

