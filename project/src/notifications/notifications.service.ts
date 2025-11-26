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
    try {
      // Verificar se o usuário existe e está ativo
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, isActive: true, role: true },
      });

      if (!user) {
        console.error(`[NOTIFICATIONS] Usuário ${userId} não encontrado. Não é possível criar notificação.`);
        return null;
      }

      if (!user.isActive) {
        console.warn(`[NOTIFICATIONS] Usuário ${user.name} (${userId}) está inativo. Notificação não será criada.`);
        return null;
      }

      console.log(`[NOTIFICATIONS] Criando notificação para usuário ${user.name} (${userId}) - ${title}`);

      const notification = await this.prisma.notification.create({
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

      console.log(`[NOTIFICATIONS] ✅ Notificação criada com sucesso: ${notification.id} para ${user.name} (${userId})`);
      return notification;
    } catch (error) {
      console.error(`[NOTIFICATIONS] ❌ Erro ao criar notificação para usuário ${userId}:`, error);
      // Não lançar erro para não quebrar o fluxo principal
      return null;
    }
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

  // ==================== NOTIFICAÇÕES PARA ADMINS ====================

  /**
   * Notifica todos os administradores
   */
  async notifyAllAdmins(
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
    actionUrl?: string,
  ) {
    try {
      // Buscar todos os usuários admin ativos
      const admins = await this.prisma.user.findMany({
        where: {
          role: 'ADMIN',
          isActive: true,
        },
        select: { id: true, name: true },
      });

      console.log(`[NOTIFICATIONS] Encontrados ${admins.length} admin(s) para notificar sobre: ${title}`);

      if (admins.length === 0) {
        console.warn(`[NOTIFICATIONS] ⚠️ Nenhum admin ativo encontrado. Notificação não será criada.`);
        return [];
      }

      // Criar notificação para cada admin
      const notifications = await Promise.all(
        admins.map(async (admin) => {
          const notification = await this.createNotification(admin.id, type, title, message, metadata, actionUrl);
          return notification;
        }),
      );

      const successfulNotifications = notifications.filter(n => n !== null);
      console.log(`[NOTIFICATIONS] ✅ ${successfulNotifications.length} de ${admins.length} notificações para admins criadas com sucesso`);

      return successfulNotifications;
    } catch (error) {
      console.error('[NOTIFICATIONS] ❌ Erro ao notificar admins:', error);
      // Não lançar erro para não quebrar o fluxo principal
      return [];
    }
  }

  /**
   * Notifica admins sobre nova venda
   */
  async notifyAdminsNewSale(saleId: string, saleNumber: string, totalAmount: number, storeName?: string, customerName?: string) {
    // Verificar se alertas de vendas estão habilitados
    const salesAlertsEnabled = await this.getSalesAlertsEnabled();
    if (!salesAlertsEnabled) {
      console.log('[NOTIFICATIONS] Alertas de vendas desabilitados. Notificação não será criada.');
      return null;
    }

    return this.notifyAllAdmins(
      NotificationType.ADMIN_NEW_SALE,
      'Nova Venda Realizada',
      `Nova venda #${saleNumber}${storeName ? ` na loja ${storeName}` : ''}${customerName ? ` para ${customerName}` : ''}. Valor: R$ ${totalAmount.toFixed(2)}`,
      { saleId, saleNumber, totalAmount, storeName, customerName },
      `/admin/sales`,
    );
  }

  /**
   * Notifica admins sobre novo usuário
   */
  async notifyAdminsNewUser(userId: string, userName: string, userRole: string, storeName?: string) {
    return this.notifyAllAdmins(
      NotificationType.ADMIN_NEW_USER,
      'Novo Usuário Criado',
      `Novo usuário ${userName} (${userRole})${storeName ? ` na loja ${storeName}` : ''} foi criado`,
      { userId, userName, userRole, storeName },
      `/admin/users`,
    );
  }

  /**
   * Notifica admins sobre nova loja
   */
  async notifyAdminsNewStore(storeId: string, storeName: string, city: string, state: string) {
    return this.notifyAllAdmins(
      NotificationType.ADMIN_NEW_STORE,
      'Nova Loja Criada',
      `Nova loja ${storeName} foi criada em ${city}, ${state}`,
      { storeId, storeName, city, state },
      `/admin/stores/${storeId}`,
    );
  }

  /**
   * Notifica admins sobre novo produto
   */
  async notifyAdminsNewProduct(productId: string, productName: string, storeName?: string) {
    return this.notifyAllAdmins(
      NotificationType.ADMIN_NEW_PRODUCT,
      'Novo Produto Criado',
      `Novo produto ${productName}${storeName ? ` na loja ${storeName}` : ''} foi criado`,
      { productId, productName, storeName },
      `/admin/products`,
    );
  }

  /**
   * Notifica admins sobre estoque baixo
   */
  async notifyAdminsLowStock(productId: string, productName: string, stock: number, minStock: number, storeName?: string) {
    // Verificar se alertas de estoque baixo estão habilitados
    const lowStockAlertsEnabled = await this.getLowStockAlertsEnabled();
    if (!lowStockAlertsEnabled) {
      console.log('[NOTIFICATIONS] Alertas de estoque baixo desabilitados. Notificação não será criada.');
      return null;
    }

    return this.notifyAllAdmins(
      NotificationType.ADMIN_LOW_STOCK,
      'Estoque Baixo',
      `Produto ${productName}${storeName ? ` na loja ${storeName}` : ''} está com estoque baixo (${stock} unidades, mínimo: ${minStock})`,
      { productId, productName, stock, minStock, storeName },
      `/admin/products`,
    );
  }

  /**
   * Notifica admins sobre produto sem estoque
   */
  async notifyAdminsOutOfStock(productId: string, productName: string, storeName?: string) {
    // Verificar se alertas de estoque baixo estão habilitados (também se aplica a estoque zerado)
    const lowStockAlertsEnabled = await this.getLowStockAlertsEnabled();
    if (!lowStockAlertsEnabled) {
      console.log('[NOTIFICATIONS] Alertas de estoque baixo desabilitados. Notificação de estoque zerado não será criada.');
      return null;
    }

    return this.notifyAllAdmins(
      NotificationType.ADMIN_OUT_OF_STOCK,
      'Produto Sem Estoque',
      `Produto ${productName}${storeName ? ` na loja ${storeName}` : ''} está sem estoque`,
      { productId, productName, storeName },
      `/admin/products`,
    );
  }

  /**
   * Notifica admins sobre novo pedido online
   */
  async notifyAdminsNewOrderOnline(orderId: string, orderNumber: string, totalAmount: number, customerName?: string) {
    return this.notifyAllAdmins(
      NotificationType.ADMIN_NEW_ORDER_ONLINE,
      'Novo Pedido Online',
      `Novo pedido online #${orderNumber}${customerName ? ` de ${customerName}` : ''}. Valor: R$ ${totalAmount.toFixed(2)}`,
      { orderId, orderNumber, totalAmount, customerName },
      `/admin/orders-online`,
    );
  }

  /**
   * Notifica admins sobre erro no sistema
   */
  async notifyAdminsSystemError(errorMessage: string, errorDetails?: any) {
    return this.notifyAllAdmins(
      NotificationType.ADMIN_SYSTEM_ERROR,
      'Erro no Sistema',
      `Erro detectado: ${errorMessage}`,
      { errorMessage, errorDetails },
      `/admin/settings`,
    );
  }

  /**
   * Notifica admins sobre atualização de loja
   */
  async notifyAdminsStoreUpdate(storeId: string, storeName: string, changes: string[]) {
    return this.notifyAllAdmins(
      NotificationType.ADMIN_STORE_UPDATE,
      'Loja Atualizada',
      `A loja ${storeName} foi atualizada. Mudanças: ${changes.join(', ')}`,
      { storeId, storeName, changes },
      `/admin/stores/${storeId}`,
    );
  }

  /**
   * Notifica admins sobre atualização de usuário
   */
  async notifyAdminsUserUpdate(userId: string, userName: string, changes: string[]) {
    return this.notifyAllAdmins(
      NotificationType.ADMIN_USER_UPDATE,
      'Usuário Atualizado',
      `O usuário ${userName} foi atualizado. Mudanças: ${changes.join(', ')}`,
      { userId, userName, changes },
      `/admin/users`,
    );
  }

  // ==================== NOTIFICAÇÕES PARA GERENTES ====================

  /**
   * Notifica gerentes de uma loja específica
   */
  async notifyStoreManagers(
    storeId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
    actionUrl?: string,
  ) {
    try {
      // Buscar todos os gerentes da loja ativos
      const managers = await this.prisma.user.findMany({
        where: {
          role: 'STORE_MANAGER',
          storeId: storeId,
          isActive: true,
        },
        select: { id: true, name: true },
      });

      console.log(`[NOTIFICATIONS] Notificando ${managers.length} gerente(s) da loja ${storeId} sobre: ${title}`);

      // Criar notificação para cada gerente
      const notifications = await Promise.all(
        managers.map(async (manager) => {
          try {
            const notification = await this.createNotification(manager.id, type, title, message, metadata, actionUrl);
            console.log(`[NOTIFICATIONS] Notificação criada para gerente ${manager.name} (${manager.id}): ${notification.id}`);
            return notification;
          } catch (error) {
            console.error(`[NOTIFICATIONS] Erro ao criar notificação para gerente ${manager.id}:`, error);
            return null;
          }
        }),
      );

      const successfulNotifications = notifications.filter(n => n !== null);
      console.log(`[NOTIFICATIONS] ${successfulNotifications.length} de ${managers.length} notificações para gerentes criadas com sucesso`);

      return successfulNotifications;
    } catch (error) {
      console.error('[NOTIFICATIONS] Erro ao notificar gerentes:', error);
      return [];
    }
  }

  /**
   * Notifica gerentes sobre nova venda na loja
   */
  async notifyManagersNewSale(storeId: string, saleId: string, saleNumber: string, totalAmount: number, customerName?: string) {
    return this.notifyStoreManagers(
      storeId,
      NotificationType.MANAGER_NEW_SALE,
      'Nova Venda Realizada',
      `Nova venda #${saleNumber}${customerName ? ` para ${customerName}` : ''}. Valor: R$ ${totalAmount.toFixed(2)}`,
      { saleId, saleNumber, totalAmount, customerName, storeId },
      `/admin/sales`,
    );
  }

  /**
   * Notifica gerentes sobre novo funcionário na loja
   */
  async notifyManagersNewEmployee(storeId: string, employeeId: string, employeeName: string) {
    return this.notifyStoreManagers(
      storeId,
      NotificationType.MANAGER_NEW_EMPLOYEE,
      'Novo Funcionário',
      `Novo funcionário ${employeeName} foi adicionado à loja`,
      { employeeId, employeeName, storeId },
      `/admin/users`,
    );
  }

  /**
   * Notifica gerentes sobre estoque baixo na loja
   */
  async notifyManagersLowStock(storeId: string, productId: string, productName: string, stock: number, minStock: number) {
    return this.notifyStoreManagers(
      storeId,
      NotificationType.MANAGER_LOW_STOCK,
      'Estoque Baixo',
      `Produto ${productName} está com estoque baixo (${stock} unidades, mínimo: ${minStock})`,
      { productId, productName, stock, minStock, storeId },
      `/admin/products`,
    );
  }

  /**
   * Notifica gerentes sobre produto sem estoque na loja
   */
  async notifyManagersOutOfStock(storeId: string, productId: string, productName: string) {
    return this.notifyStoreManagers(
      storeId,
      NotificationType.MANAGER_OUT_OF_STOCK,
      'Produto Sem Estoque',
      `Produto ${productName} está sem estoque`,
      { productId, productName, storeId },
      `/admin/products`,
    );
  }

  /**
   * Notifica gerentes sobre novo pedido online na loja
   */
  async notifyManagersNewOrderOnline(storeId: string, orderId: string, orderNumber: string, totalAmount: number, customerName?: string) {
    return this.notifyStoreManagers(
      storeId,
      NotificationType.MANAGER_NEW_ORDER_ONLINE,
      'Novo Pedido Online',
      `Novo pedido online #${orderNumber}${customerName ? ` de ${customerName}` : ''}. Valor: R$ ${totalAmount.toFixed(2)}`,
      { orderId, orderNumber, totalAmount, customerName, storeId },
      `/admin/orders-online`,
    );
  }

  /**
   * Notifica gerentes sobre atualização da loja
   */
  async notifyManagersStoreUpdate(storeId: string, storeName: string, changes: string[]) {
    return this.notifyStoreManagers(
      storeId,
      NotificationType.MANAGER_STORE_UPDATE,
      'Loja Atualizada',
      `A loja ${storeName} foi atualizada. Mudanças: ${changes.join(', ')}`,
      { storeId, storeName, changes },
      `/admin/stores/${storeId}`,
    );
  }

  /**
   * Notifica gerentes sobre atualização de funcionário
   */
  async notifyManagersEmployeeUpdate(storeId: string, employeeId: string, employeeName: string, changes: string[]) {
    return this.notifyStoreManagers(
      storeId,
      NotificationType.MANAGER_EMPLOYEE_UPDATE,
      'Funcionário Atualizado',
      `O funcionário ${employeeName} foi atualizado. Mudanças: ${changes.join(', ')}`,
      { employeeId, employeeName, changes, storeId },
      `/admin/users`,
    );
  }

  // ==================== NOTIFICAÇÕES PARA FUNCIONÁRIOS ====================

  /**
   * Notifica um funcionário específico
   */
  async notifyEmployee(
    employeeId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
    actionUrl?: string,
  ) {
    try {
      return await this.createNotification(employeeId, type, title, message, metadata, actionUrl);
    } catch (error) {
      console.error('Erro ao notificar funcionário:', error);
      return null;
    }
  }

  /**
   * Notifica funcionário sobre nova atribuição
   */
  async notifyEmployeeNewAssignment(employeeId: string, assignmentType: string, assignmentDetails: string) {
    return this.notifyEmployee(
      employeeId,
      NotificationType.EMPLOYEE_NEW_ASSIGNMENT,
      'Nova Atribuição',
      `Você recebeu uma nova atribuição: ${assignmentDetails}`,
      { assignmentType, assignmentDetails },
      `/admin/assignments`,
    );
  }

  /**
   * Notifica funcionário sobre atualização do perfil
   */
  async notifyEmployeeProfileUpdate(employeeId: string, changes: string[]) {
    return this.notifyEmployee(
      employeeId,
      NotificationType.EMPLOYEE_PROFILE_UPDATE,
      'Perfil Atualizado',
      `Seu perfil foi atualizado. Mudanças: ${changes.join(', ')}`,
      { changes },
      `/admin/profile`,
    );
  }

  /**
   * Notifica funcionário sobre venda criada por ele
   */
  async notifyEmployeeSaleCreated(employeeId: string, saleId: string, saleNumber: string, totalAmount: number) {
    return this.notifyEmployee(
      employeeId,
      NotificationType.EMPLOYEE_SALE_CREATED,
      'Venda Criada',
      `Venda #${saleNumber} criada com sucesso. Valor: R$ ${totalAmount.toFixed(2)}`,
      { saleId, saleNumber, totalAmount },
      `/admin/sales`,
    );
  }

  // ==================== NOTIFICAÇÕES INTELIGENTES BASEADAS EM PAPEL ====================

  /**
   * Notifica usuários relevantes sobre nova venda
   * - ADMINs: todas as vendas
   * - MANAGERs: vendas da loja deles
   * - EMPLOYEEs: vendas criadas por eles
   */
  async notifyRelevantUsersNewSale(
    saleId: string,
    saleNumber: string,
    totalAmount: number,
    storeId: string,
    employeeId: string,
    customerName?: string,
    storeName?: string,
  ) {
    try {
      // Buscar informações da venda e loja
      const [sale, store] = await Promise.all([
        this.prisma.sale.findUnique({
          where: { id: saleId },
          include: { store: { select: { name: true } } },
        }),
        this.prisma.store.findUnique({
          where: { id: storeId },
          select: { name: true },
        }),
      ]);

      const finalStoreName = storeName || store?.name || 'loja';

      console.log(`[NOTIFICATIONS] Notificando usuários relevantes sobre nova venda #${saleNumber} na loja ${storeId}`);

      // Notificar todos os ADMINs
      await this.notifyAdminsNewSale(saleId, saleNumber, totalAmount, finalStoreName, customerName);

      // Notificar gerentes da loja
      await this.notifyManagersNewSale(storeId, saleId, saleNumber, totalAmount, customerName);

      // Notificar o funcionário que criou a venda
      await this.notifyEmployeeSaleCreated(employeeId, saleId, saleNumber, totalAmount);

      console.log(`[NOTIFICATIONS] ✅ Notificações sobre nova venda #${saleNumber} concluídas`);
    } catch (error) {
      console.error('[NOTIFICATIONS] ❌ Erro ao notificar usuários relevantes sobre nova venda:', error);
    }
  }

  /**
   * Notifica usuários relevantes sobre estoque baixo
   * - ADMINs: todos os produtos
   * - MANAGERs: produtos da loja deles
   */
  async notifyRelevantUsersLowStock(
    productId: string,
    productName: string,
    stock: number,
    minStock: number,
    storeId: string,
    storeName?: string,
  ) {
    try {
      const finalStoreName = storeName;

      // Notificar todos os ADMINs
      await this.notifyAdminsLowStock(productId, productName, stock, minStock, finalStoreName);

      // Notificar gerentes da loja
      await this.notifyManagersLowStock(storeId, productId, productName, stock, minStock);
    } catch (error) {
      console.error('Erro ao notificar usuários relevantes sobre estoque baixo:', error);
    }
  }

  /**
   * Notifica usuários relevantes sobre produto sem estoque
   * - ADMINs: todos os produtos
   * - MANAGERs: produtos da loja deles
   */
  async notifyRelevantUsersOutOfStock(
    productId: string,
    productName: string,
    storeId: string,
    storeName?: string,
  ) {
    try {
      const finalStoreName = storeName;

      // Notificar todos os ADMINs
      await this.notifyAdminsOutOfStock(productId, productName, finalStoreName);

      // Notificar gerentes da loja
      await this.notifyManagersOutOfStock(storeId, productId, productName);
    } catch (error) {
      console.error('Erro ao notificar usuários relevantes sobre produto sem estoque:', error);
    }
  }

  /**
   * Notifica usuários relevantes sobre novo pedido online
   * - ADMINs: todos os pedidos
   * - MANAGERs: pedidos da loja deles
   */
  async notifyRelevantUsersNewOrderOnline(
    orderId: string,
    orderNumber: string,
    totalAmount: number,
    storeId: string,
    customerName?: string,
    storeName?: string,
  ) {
    try {
      const finalStoreName = storeName;

      // Notificar todos os ADMINs
      await this.notifyAdminsNewOrderOnline(orderId, orderNumber, totalAmount, customerName);

      // Notificar gerentes da loja
      await this.notifyManagersNewOrderOnline(storeId, orderId, orderNumber, totalAmount, customerName);
    } catch (error) {
      console.error('Erro ao notificar usuários relevantes sobre novo pedido online:', error);
    }
  }

  /**
   * Notifica usuários relevantes sobre novo usuário
   * - ADMINs: todos os usuários
   * - MANAGERs: funcionários da loja deles
   */
  async notifyRelevantUsersNewUser(
    userId: string,
    userName: string,
    userRole: string,
    storeId?: string,
    storeName?: string,
  ) {
    try {
      // Notificar todos os ADMINs
      await this.notifyAdminsNewUser(userId, userName, userRole, storeName);

      // Se for funcionário ou gerente e tiver loja, notificar gerentes da loja
      if ((userRole === 'EMPLOYEE' || userRole === 'STORE_MANAGER') && storeId) {
        await this.notifyManagersNewEmployee(storeId, userId, userName);
      }
    } catch (error) {
      console.error('Erro ao notificar usuários relevantes sobre novo usuário:', error);
    }
  }

  /**
   * Verifica se alertas de vendas estão habilitados
   */
  private async getSalesAlertsEnabled(): Promise<boolean> {
    try {
      const settings = await this.prisma.systemSettings.findUnique({
        where: { key: 'system_settings' }
      });
      
      if (settings && settings.value) {
        const value = settings.value as any;
        return value?.notifications?.salesAlerts ?? true; // Padrão: true
      }
      return true; // Padrão: habilitado
    } catch (error) {
      console.error('Erro ao verificar alertas de vendas:', error);
      return true; // Em caso de erro, habilitar por padrão
    }
  }

  /**
   * Verifica se alertas de estoque baixo estão habilitados
   */
  private async getLowStockAlertsEnabled(): Promise<boolean> {
    try {
      const settings = await this.prisma.systemSettings.findUnique({
        where: { key: 'system_settings' }
      });
      
      if (settings && settings.value) {
        const value = settings.value as any;
        return value?.notifications?.lowStockAlerts ?? true; // Padrão: true
      }
      return true; // Padrão: habilitado
    } catch (error) {
      console.error('Erro ao verificar alertas de estoque baixo:', error);
      return true; // Em caso de erro, habilitar por padrão
    }
  }
}

