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
            colorHex: true
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
    }
  ) {
    // Validar carrinho
    const validation = await this.validateCart(customerId);
    
    if (!validation.valid) {
      throw new BadRequestException('Carrinho contém itens inválidos');
    }

    if (validation.validItems.length === 0) {
      throw new BadRequestException('Carrinho está vazio');
    }

    // Criar venda
    const totalAmount = validation.totalPrice;
    const isOnlineOrder = !!shippingInfo;
    
    const sale = await this.prisma.sale.create({
      data: {
        store: { connect: { id: storeId } },
        customer: { connect: { id: customerId } },
        employee: { connect: { id: customerId } }, // Cliente é o próprio vendedor
        saleNumber: `SALE-${Date.now()}`,
        totalAmount,
        discount: 0,
        tax: 0,
        status: isOnlineOrder ? 'PENDING' : 'PENDING',
        paymentMethod: 'PIX',
        isOnlineOrder,
        shippingAddress: shippingInfo?.address,
        shippingCity: shippingInfo?.city,
        shippingState: shippingInfo?.state,
        shippingZipCode: shippingInfo?.zipCode,
        shippingPhone: shippingInfo?.phone,
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

    // Atualizar estoque dos produtos
    for (const item of validation.validItems) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    // Limpar carrinho
    await this.clearCart(customerId);

    // Criar notificação de pedido criado
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

    return sale;
  }
}
