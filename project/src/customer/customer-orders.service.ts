import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerOrdersService {
  constructor(private prisma: PrismaService) {}

  // ==================== PEDIDOS ====================

  async getOrders(customerId: string, page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = { customerId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: { 
                select: { 
                  name: true, 
                  imageUrls: true,
                  category: true,
                  brand: true
                } 
              }
            }
          },
          store: { select: { name: true, address: true, phone: true } }
        }
      }),
      this.prisma.sale.count({ where })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getOrderById(customerId: string, orderId: string) {
    const order = await this.prisma.sale.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { 
              select: { 
                name: true, 
                description: true,
                imageUrls: true,
                category: true,
                brand: true,
                colorName: true,
                colorHex: true
              } 
            }
          }
        },
        store: { 
          select: { 
            name: true, 
            address: true, 
            phone: true, 
            email: true 
          } 
        },
        customer: { 
          select: { 
            name: true, 
            email: true, 
            phone: true, 
            address: true 
          } 
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o pedido pertence ao cliente
    if (order.customerId !== customerId) {
      throw new ForbiddenException('Você só pode visualizar seus próprios pedidos');
    }

    return order;
  }

  async cancelOrder(customerId: string, orderId: string, reason?: string) {
    const order = await this.prisma.sale.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o pedido pertence ao cliente
    if (order.customerId !== customerId) {
      throw new ForbiddenException('Você só pode cancelar seus próprios pedidos');
    }

    // Verificar se o pedido pode ser cancelado
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Pedido já foi cancelado');
    }

    if (order.status === 'COMPLETED') {
      throw new BadRequestException('Pedido já foi finalizado e não pode ser cancelado');
    }

    // Atualizar status do pedido
    const updatedOrder = await this.prisma.sale.update({
      where: { id: orderId },
      data: { 
        status: 'CANCELLED',
        notes: reason || 'Cancelado pelo cliente'
      },
      include: {
        items: {
          include: {
            product: { select: { name: true } }
          }
        }
      }
    });

    // Restaurar estoque dos produtos
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      });
    }

    return updatedOrder;
  }

  // ==================== AVALIAÇÕES ====================

  async addReview(customerId: string, productId: string, rating: number, comment?: string) {
    // Verificar se o produto existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o cliente comprou o produto
    const purchase = await this.prisma.sale.findFirst({
      where: {
        customerId,
        items: {
          some: { productId }
        }
      }
    });

    if (!purchase) {
      throw new BadRequestException('Você só pode avaliar produtos que comprou');
    }

    // Verificar se já avaliou
    const existingReview = await this.prisma.productReview.findFirst({
      where: {
        userId: customerId,
        productId
      }
    });

    if (existingReview) {
      throw new BadRequestException('Você já avaliou este produto');
    }

    // Criar avaliação
    const review = await this.prisma.productReview.create({
      data: {
        userId: customerId,
        productId,
        rating,
        comment
      },
      include: {
        user: { select: { name: true } }
      }
    });

    // Atualizar estatísticas do produto
    await this.updateProductRating(productId);

    return review;
  }

  async updateReview(customerId: string, reviewId: string, rating: number, comment?: string) {
    const review = await this.prisma.productReview.findFirst({
      where: {
        id: reviewId,
        userId: customerId
      }
    });

    if (!review) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    const updatedReview = await this.prisma.productReview.update({
      where: { id: reviewId },
      data: { rating, comment },
      include: {
        user: { select: { name: true } }
      }
    });

    // Atualizar estatísticas do produto
    await this.updateProductRating(review.productId);

    return updatedReview;
  }

  async deleteReview(customerId: string, reviewId: string) {
    const review = await this.prisma.productReview.findFirst({
      where: {
        id: reviewId,
        userId: customerId
      }
    });

    if (!review) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    await this.prisma.productReview.delete({
      where: { id: reviewId }
    });

    // Atualizar estatísticas do produto
    await this.updateProductRating(review.productId);

    return { message: 'Avaliação removida' };
  }

  async getMyReviews(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { userId: customerId },
        skip,
        take: limit,
        include: {
          product: { 
            select: { 
              name: true, 
              imageUrls: true,
              category: true,
              brand: true
            } 
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.productReview.count({ where: { userId: customerId } })
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private async updateProductRating(productId: string) {
    const reviews = await this.prisma.productReview.findMany({
      where: { productId },
      select: { rating: true }
    });

    if (reviews.length === 0) {
      await this.prisma.product.update({
        where: { id: productId },
        data: { rating: 0, reviewCount: 0 }
      });
      return;
    }

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await this.prisma.product.update({
      where: { id: productId },
      data: { 
        rating: Math.round(averageRating * 10) / 10, // Arredondar para 1 casa decimal
        reviewCount: reviews.length
      }
    });
  }
}
