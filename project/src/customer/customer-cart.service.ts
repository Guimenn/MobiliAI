import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerCartService {
  constructor(private prisma: PrismaService) {}

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

    if (product.stock < quantity) {
      throw new BadRequestException('Quantidade solicitada maior que o estoque disponível');
    }

    // Verificar se o produto já está no carrinho
    const existingCartItem = await this.prisma.cartItem.findFirst({
      where: {
        customerId,
        productId
      }
    });

    if (existingCartItem) {
      // Atualizar quantidade
      const newQuantity = existingCartItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        throw new BadRequestException('Quantidade total maior que o estoque disponível');
      }

      return this.prisma.cartItem.update({
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
      return this.prisma.cartItem.create({
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

    if (cartItem.product.stock < quantity) {
      throw new BadRequestException('Quantidade solicitada maior que o estoque disponível');
    }

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
      } else if (item.product.stock < item.quantity) {
        issues.push({
          itemId: item.id,
          productName: item.product.name,
          issue: `Estoque insuficiente. Disponível: ${item.product.stock}`
        });
      } else {
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

  async checkout(customerId: string, storeId: string) {
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
    
    const sale = await this.prisma.sale.create({
      data: {
        store: { connect: { id: storeId } },
        customer: { connect: { id: customerId } },
        employee: { connect: { id: customerId } }, // Cliente é o próprio vendedor
        saleNumber: `SALE-${Date.now()}`,
        totalAmount,
        discount: 0,
        tax: 0,
        status: 'PENDING',
        paymentMethod: 'PIX',
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

    return sale;
  }
}
