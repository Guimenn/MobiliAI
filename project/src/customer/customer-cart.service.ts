import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CustomerCartService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  // ==================== CARRINHO DE COMPRAS ====================

  async addToCart(customerId: string, productId: string, quantity: number = 1) {
    // Verificar se o produto existe e está disponível
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (!product.isAvailable) {
      throw new BadRequestException('Produto não está disponível');
    }

    // Verificar se o produto já está no carrinho
    const existingCartItem = await this.prisma.cartItem.findFirst({
      where: {
        customerId,
        productId
      }
    });

    let cartItem;
    if (existingCartItem) {
      // Atualizar quantidade (sem verificação de estoque)
      const newQuantity = existingCartItem.quantity + quantity;

      cartItem = await this.prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrls: true,
              stock: true
            }
          }
        }
      });
    } else {
      // Adicionar novo item ao carrinho
      cartItem = await this.prisma.cartItem.create({
        data: {
          customerId,
          productId,
          quantity
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrls: true,
              stock: true
            }
          }
        }
      });
    }

    // Criar notificação apenas quando for um novo item (não quando atualizar quantidade)
    if (!existingCartItem) {
      try {
        await this.notificationsService.notifyCartAdded(
          customerId,
          product.id,
          product.name,
        );
      } catch (error) {
        console.error('Erro ao criar notificação de carrinho:', error);
        // Não falhar a operação se a notificação falhar
      }
    }

    return cartItem;
  }

  async getCart(customerId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { customerId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrls: true,
            stock: true,
            category: true,
            brand: true,
            colorName: true,
            colorHex: true,
            storeId: true,
            store: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

    return {
      items: cartItems,
      summary: {
        totalItems,
        totalPrice,
        itemCount: cartItems.length
      }
    };
  }

  async updateCartItem(customerId: string, cartItemId: string, quantity: number) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        customerId
      },
      include: { product: true }
    });

    if (!cartItem) {
      throw new NotFoundException('Item do carrinho não encontrado');
    }

    if (quantity <= 0) {
      // Remover item do carrinho
      await this.prisma.cartItem.delete({
        where: { id: cartItemId }
      });
      return { message: 'Item removido do carrinho' };
    }

    // Permitir qualquer quantidade sem verificar estoque
    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrls: true,
            stock: true
          }
        }
      }
    });
  }

  async removeFromCart(customerId: string, cartItemId: string) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        customerId
      }
    });

    if (!cartItem) {
      throw new NotFoundException('Item do carrinho não encontrado');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItemId }
    });

    return { message: 'Item removido do carrinho' };
  }

  async clearCart(customerId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { customerId }
    });

    return { message: 'Carrinho limpo' };
  }

  // ==================== VALIDAÇÃO DO CARRINHO ====================

  async validateCart(customerId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { customerId },
      include: { product: true }
    });

    const issues = [];
    const validItems = [];

    for (const item of cartItems) {
      if (!item.product.isAvailable) {
        issues.push({
          itemId: item.id,
          productName: item.product.name,
          issue: 'Produto não está mais disponível'
        });
      } else {
        // Não verificar estoque - permitir qualquer quantidade
        validItems.push(item);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      validItems,
      totalItems: validItems.length,
      totalPrice: validItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0)
    };
  }

  // ==================== FINALIZAÇÃO DO CARRINHO ====================

  async checkout(
    customerId: string, 
    storeId: string,
    shippingInfo?: {
      address: string;
      city: string;
      state: string;
      zipCode: string;
      phone?: string;
    },
    additionalCosts?: {
      shippingCost?: number;
      insuranceCost?: number;
      tax?: number;
      discount?: number;
      notes?: string;
    }
  ) {
    // Garantir conexão com o banco antes de processar checkout
    await this.prisma.ensureConnection();

    // Verificar se há itens no carrinho antes de validar (com retry)
    const cartCount = await this.prisma.executeWithRetry(async () => {
      return await this.prisma.cartItem.count({
        where: { customerId }
      });
    });

    if (cartCount === 0) {
      throw new BadRequestException('Carrinho está vazio. Adicione produtos ao carrinho antes de finalizar o pedido.');
    }

    // Validar carrinho
    const validation = await this.validateCart(customerId);
    
    if (!validation.valid) {
      const issuesText = validation.issues.map(i => `${i.productName}: ${i.issue}`).join(', ');
      throw new BadRequestException(`Carrinho contém itens inválidos: ${issuesText}`);
    }

    if (validation.validItems.length === 0) {
      throw new BadRequestException('Carrinho está vazio. Adicione produtos ao carrinho antes de finalizar o pedido.');
    }

    // Validar se a loja existe
    let validStoreId = storeId;
    if (!storeId || storeId === 'default') {
      // Buscar a primeira loja ativa
      const firstStore = await this.prisma.store.findFirst({
        where: { isActive: true },
        select: { id: true }
      });
      
      if (!firstStore) {
        throw new BadRequestException('Nenhuma loja disponível. Entre em contato com o suporte.');
      }
      
      validStoreId = firstStore.id;
    } else {
      // Verificar se a loja existe e está ativa
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { id: true, isActive: true }
      });
      
      if (!store) {
        throw new BadRequestException(`Loja com ID ${storeId} não encontrada`);
      }
      
      if (!store.isActive) {
        throw new BadRequestException(`Loja com ID ${storeId} está inativa`);
      }
    }

    // Calcular total incluindo custos adicionais
    const subtotal = validation.totalPrice;
    const shippingCost = additionalCosts?.shippingCost || 0;
    const insuranceCost = additionalCosts?.insuranceCost || 0;
    const tax = additionalCosts?.tax || 0;
    const discount = additionalCosts?.discount || 0;
    const totalAmount = subtotal + shippingCost + insuranceCost + tax - discount;
    
    const isOnlineOrder = !!shippingInfo;
    
    // Criar venda com retry para garantir que seja criada mesmo se houver problemas de conexão
    const sale = await this.prisma.executeWithRetry(async () => {
      return await this.prisma.sale.create({
        data: {
          store: { connect: { id: validStoreId } },
          customer: { connect: { id: customerId } },
          employee: { connect: { id: customerId } }, // Cliente é o próprio vendedor
          saleNumber: `SALE-${Date.now()}`,
          totalAmount,
          discount: discount,
          tax: tax,
          status: isOnlineOrder ? 'PENDING' : 'PENDING',
          paymentMethod: 'PIX',
          isOnlineOrder,
          shippingAddress: shippingInfo?.address,
          shippingCity: shippingInfo?.city,
          shippingState: shippingInfo?.state,
          shippingZipCode: shippingInfo?.zipCode,
          shippingPhone: shippingInfo?.phone,
          notes: additionalCosts?.notes,
          items: {
            create: validation.validItems.map(item => ({
              product: { connect: { id: item.productId } },
              quantity: item.quantity,
              unitPrice: item.product.price,
              totalPrice: Number(item.product.price) * item.quantity
            }))
          }
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, price: true } }
            }
          },
          store: { select: { name: true, address: true } }
        }
      });
    });

    // Armazenar informações dos produtos para verificação posterior
    const productsToCheck: Array<{ id: string; name: string; stock: number; minStock: number; storeName?: string }> = [];

    // Atualizar estoque dos produtos (com retry)
    for (const item of validation.validItems) {
      await this.prisma.executeWithRetry(async () => {
        // Buscar produto antes de atualizar
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { store: { select: { name: true } } }
        });

        if (!product) {
          return;
        }

        // Calcular novo estoque
        const newStock = product.stock - item.quantity;

        // Atualizar estoque
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: newStock }
        });

        // Armazenar informações do produto para verificação posterior
        productsToCheck.push({
          id: product.id,
          name: product.name,
          stock: newStock,
          minStock: product.minStock || 0,
          storeName: product.store?.name
        });
      });
    }

    // Limpar carrinho
    await this.clearCart(customerId);

    // Criar notificação de pedido criado para o cliente
    try {
      await this.notificationsService.notifyOrderCreated(
        customerId,
        sale.id,
        sale.saleNumber,
        Number(sale.totalAmount),
      );
    } catch (error) {
      console.error('Erro ao criar notificação de pedido:', error);
      // Não falhar a operação se a notificação falhar
    }

    // Se for pedido online, notificar usuários relevantes (assíncrono, não bloqueia a resposta)
    if (isOnlineOrder) {
      const customer = await this.prisma.user.findUnique({
        where: { id: customerId },
        select: { name: true }
      });

      this.notificationsService.notifyRelevantUsersNewOrderOnline(
        sale.id,
        sale.saleNumber,
        Number(sale.totalAmount),
        validStoreId,
        customer?.name,
        sale.store?.name
      ).catch(error => {
        console.error('Erro ao notificar usuários sobre novo pedido online:', error);
      });
    }

    // Verificar estoque dos produtos após a venda e notificar usuários relevantes se necessário (assíncrono)
    setImmediate(async () => {
      try {
        for (const productInfo of productsToCheck) {
          // Se o estoque zerou após a venda
          if (productInfo.stock === 0) {
            await this.notificationsService.notifyRelevantUsersOutOfStock(
              productInfo.id,
              productInfo.name,
              validStoreId,
              productInfo.storeName
            );
          }
          // Se o estoque está abaixo do mínimo
          else if (productInfo.stock > 0 && productInfo.stock <= productInfo.minStock) {
            await this.notificationsService.notifyRelevantUsersLowStock(
              productInfo.id,
              productInfo.name,
              productInfo.stock,
              productInfo.minStock,
              validStoreId,
              productInfo.storeName
            );
          }
        }
      } catch (error) {
        console.error('Erro ao verificar estoque após checkout:', error);
      }
    });

    return sale;
  }
}
