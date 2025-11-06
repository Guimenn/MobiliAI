import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CustomerFavoritesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  // ==================== FAVORITOS ====================

  async addToFavorites(customerId: string, productId: string) {
    // Verificar se o produto existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se já está nos favoritos
    const existingFavorite = await this.prisma.favorite.findFirst({
      where: {
        customerId,
        productId
      }
    });

    if (existingFavorite) {
      throw new BadRequestException('Produto já está nos favoritos');
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        customerId,
        productId
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrls: true,
            category: true,
            brand: true,
            colorName: true,
            colorHex: true,
            rating: true,
            reviewCount: true,
            isFeatured: true,
            isNew: true,
            isBestSeller: true,
            store: { select: { name: true } }
          }
        }
      }
    });

    // Criar notificação de favorito adicionado
    try {
      await this.notificationsService.notifyFavoriteAdded(
        customerId,
        product.id,
        product.name,
      );
    } catch (error) {
      console.error('Erro ao criar notificação de favorito:', error);
      // Não falhar a operação se a notificação falhar
    }

    return favorite;
  }

  async removeFromFavorites(customerId: string, productId: string) {
    const favorite = await this.prisma.favorite.findFirst({
      where: {
        customerId,
        productId
      }
    });

    if (!favorite) {
      throw new NotFoundException('Produto não está nos favoritos');
    }

    await this.prisma.favorite.delete({
      where: { id: favorite.id }
    });

    return { message: 'Produto removido dos favoritos' };
  }

  async getFavorites(customerId: string, page = 1, limit = 12) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { customerId },
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrls: true,
              category: true,
              brand: true,
              colorName: true,
              colorHex: true,
              rating: true,
              reviewCount: true,
              isFeatured: true,
              isNew: true,
              isBestSeller: true,
              isAvailable: true,
              stock: true,
              store: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.favorite.count({ where: { customerId } })
    ]);

    return {
      favorites,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async isFavorite(customerId: string, productId: string) {
    try {
      // Tentar garantir conexão antes de fazer query
      await this.prisma.$connect();
      
      const favorite = await this.prisma.favorite.findFirst({
        where: {
          customerId,
          productId
        }
      });

      return { isFavorite: !!favorite };
    } catch (error: any) {
      // Em caso de erro de conexão, tentar reconectar e tentar novamente
      if (error.code === 'P1017' || error.message?.includes('Server has closed the connection')) {
        try {
          console.warn('Erro de conexão ao verificar favorito, tentando reconectar...');
          await this.prisma.$disconnect();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.prisma.$connect();
          
          const favorite = await this.prisma.favorite.findFirst({
            where: {
              customerId,
              productId
            }
          });
          
          return { isFavorite: !!favorite };
        } catch (retryError) {
          console.error('Erro ao reconectar:', retryError);
          // Retornar false em vez de lançar erro para evitar quebrar o frontend
          return { isFavorite: false };
        }
      }
      
      // Em caso de outros erros, retornar false em vez de lançar erro
      // Isso evita erros 500 quando há problemas temporários com o banco
      console.error('Erro ao verificar favorito:', error);
      return { isFavorite: false };
    }
  }

  async getFavoriteCount(customerId: string) {
    try {
      await this.prisma.$connect();
      
      return await this.prisma.favorite.count({
        where: { customerId }
      });
    } catch (error: any) {
      if (error.code === 'P1017' || error.message?.includes('Server has closed the connection')) {
        try {
          await this.prisma.$disconnect();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.prisma.$connect();
          
          return await this.prisma.favorite.count({
            where: { customerId }
          });
        } catch (retryError) {
          console.error('Erro ao reconectar:', retryError);
          return 0;
        }
      }
      console.error('Erro ao buscar contagem de favoritos:', error);
      return 0;
    }
  }

  // ==================== COMPARAÇÃO DE PRODUTOS ====================

  async addToComparison(customerId: string, productId: string) {
    // Verificar se o produto existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar limite de comparação (máximo 4 produtos)
    const comparisonCount = await this.prisma.comparison.count({
      where: { customerId }
    });

    if (comparisonCount >= 4) {
      throw new BadRequestException('Máximo de 4 produtos para comparação');
    }

    // Verificar se já está na comparação
    const existingComparison = await this.prisma.comparison.findFirst({
      where: {
        customerId,
        productId
      }
    });

    if (existingComparison) {
      throw new BadRequestException('Produto já está na comparação');
    }

    return this.prisma.comparison.create({
      data: {
        customerId,
        productId
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrls: true,
            category: true,
            brand: true,
            colorName: true,
            colorHex: true,
            style: true,
            material: true,
            width: true,
            height: true,
            depth: true,
            weight: true,
            rating: true,
            reviewCount: true,
            store: { select: { name: true } }
          }
        }
      }
    });
  }

  async removeFromComparison(customerId: string, productId: string) {
    const comparison = await this.prisma.comparison.findFirst({
      where: {
        customerId,
        productId
      }
    });

    if (!comparison) {
      throw new NotFoundException('Produto não está na comparação');
    }

    await this.prisma.comparison.delete({
      where: { id: comparison.id }
    });

    return { message: 'Produto removido da comparação' };
  }

  async getComparison(customerId: string) {
    const comparisons = await this.prisma.comparison.findMany({
      where: { customerId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrls: true,
            category: true,
            brand: true,
            colorName: true,
            colorHex: true,
            style: true,
            material: true,
            width: true,
            height: true,
            depth: true,
            weight: true,
            rating: true,
            reviewCount: true,
            store: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return {
      products: comparisons.map(c => c.product),
      count: comparisons.length
    };
  }

  async clearComparison(customerId: string) {
    await this.prisma.comparison.deleteMany({
      where: { customerId }
    });

    return { message: 'Comparação limpa' };
  }
}
