import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductCategory } from '@prisma/client';

@Injectable()
export class PublicProductsService {
  constructor(private prisma: PrismaService) {}

  async getProducts(page = 1, limit = 50, search = '', category?: string, minPrice?: number, maxPrice?: number, storeId?: string) {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {
        isActive: true,
        // Permitir produtos mesmo com estoque 0 para visualização
      };
      
      // Filtrar por loja se storeId for fornecido
      if (storeId) {
        where.storeId = storeId;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' as any } },
          { description: { contains: search, mode: 'insensitive' as any } },
          { brand: { contains: search, mode: 'insensitive' as any } },
          { tags: { has: search } },
          { keywords: { has: search } }
        ];
      }
      
      if (category) {
        // Converter categoria para formato do enum (uppercase)
        const categoryUpper = category.toUpperCase();
        // Verificar se é um valor válido do enum
        if (Object.values(ProductCategory).includes(categoryUpper as ProductCategory)) {
          where.category = categoryUpper;
        }
      }
      
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      // Tentar executar com retry em caso de erro de conexão
      let products, total;
      
      try {
        [products, total] = await Promise.all([
          this.prisma.product.findMany({
            where,
            skip,
            take: limit,
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              price: true,
              stock: true,
              colorName: true,
              colorHex: true,
              brand: true,
              style: true,
              material: true,
              width: true,
              height: true,
              depth: true,
              weight: true,
              imageUrl: true,
              imageUrls: true,
              videoUrl: true,
              tags: true,
              keywords: true,
              isFeatured: true,
              isNew: true,
              isBestSeller: true,
              rating: true,
              reviewCount: true,
              // Campos de Oferta Normal
              isOnSale: true,
              salePrice: true,
              saleStartDate: true,
              saleEndDate: true,
              // Campos de Oferta Relâmpago
              isFlashSale: true,
              flashSalePrice: true,
              flashSaleDiscountPercent: true,
              flashSaleStartDate: true,
              flashSaleEndDate: true,
              store: { 
                select: { 
                  id: true,
                  name: true, 
                  address: true 
                } 
              }
            },
            orderBy: [
              { isFeatured: 'desc' },
              { isNew: 'desc' },
              { isBestSeller: 'desc' },
              { rating: 'desc' },
              { createdAt: 'desc' }
            ]
          }),
          this.prisma.product.count({ where })
        ]);
      } catch (dbError: any) {
        // Se for erro de conexão, tentar reconectar e tentar novamente
        if (dbError.code === 'P1017' || dbError.message?.includes('Server has closed the connection') || dbError.message?.includes('db_termination')) {
          console.warn('Erro de conexão detectado, tentando reconectar...');
          try {
            await this.prisma.$disconnect();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.prisma.$connect();
            
            // Tentar novamente após reconectar
            [products, total] = await Promise.all([
              this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  price: true,
                  stock: true,
                  colorName: true,
                  colorHex: true,
                  brand: true,
                  style: true,
                  material: true,
                  width: true,
                  height: true,
                  depth: true,
                  weight: true,
                  imageUrls: true,
                  videoUrl: true,
                  tags: true,
                  keywords: true,
                  isFeatured: true,
                  isNew: true,
                  isBestSeller: true,
                  rating: true,
                  reviewCount: true,
                  // Campos de Oferta Normal
                  isOnSale: true,
                  salePrice: true,
                  saleDiscountPercent: true,
                  saleStartDate: true,
                  saleEndDate: true,
                  // Campos de Oferta Relâmpago
                  isFlashSale: true,
                  flashSalePrice: true,
                  flashSaleDiscountPercent: true,
                  flashSaleStartDate: true,
                  flashSaleEndDate: true,
                  store: { 
                    select: { 
                      id: true,
                      name: true, 
                      address: true 
                    } 
                  }
                },
                orderBy: [
                  { isFeatured: 'desc' },
                  { isNew: 'desc' },
                  { isBestSeller: 'desc' },
                  { rating: 'desc' },
                  { createdAt: 'desc' }
                ]
              }),
              this.prisma.product.count({ where })
            ]);
          } catch (retryError) {
            console.error('Erro ao reconectar:', retryError);
            throw dbError; // Lançar o erro original
          }
        } else {
          throw dbError;
        }
      }

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      // Em caso de erro de conexão com o banco, retornar estrutura vazia
      // para evitar quebrar o frontend
      console.error('Erro ao buscar produtos:', error);
      return {
        products: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      };
    }
  }

  async getProductById(productId: string) {
    try {
      // Tentar garantir conexão antes de fazer query
      await this.prisma.$connect();
      
      const product = await this.prisma.product.findUnique({
        where: { 
          id: productId,
          isActive: true 
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          price: true,
          stock: true,
          colorName: true,
          colorHex: true,
          brand: true,
          style: true,
          material: true,
          width: true,
          height: true,
          depth: true,
          weight: true,
          imageUrls: true,
          videoUrl: true,
          tags: true,
          keywords: true,
          isFeatured: true,
          isNew: true,
          isBestSeller: true,
          rating: true,
          reviewCount: true,
          // Campos de Oferta Normal
          isOnSale: true,
          salePrice: true,
          saleDiscountPercent: true,
          saleStartDate: true,
          saleEndDate: true,
          // Campos de Oferta Relâmpago
          isFlashSale: true,
          flashSalePrice: true,
          flashSaleDiscountPercent: true,
          flashSaleStartDate: true,
          flashSaleEndDate: true,
          store: { 
            select: { 
              id: true,
              name: true, 
              address: true 
            } 
          }
        }
      });

      if (!product) {
        throw new Error('Produto não encontrado');
      }

      return product;
    } catch (error: any) {
      // Em caso de erro de conexão, tentar reconectar e tentar novamente
      if (error.code === 'P1017' || error.message?.includes('Server has closed the connection') || error.message?.includes('db_termination')) {
        try {
          console.warn('Erro de conexão ao buscar produto, tentando reconectar...');
          await this.prisma.$disconnect();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.prisma.$connect();
          
          const product = await this.prisma.product.findUnique({
            where: { 
              id: productId,
              isActive: true 
            },
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              price: true,
              stock: true,
              colorName: true,
              colorHex: true,
              brand: true,
              style: true,
              material: true,
              width: true,
              height: true,
              depth: true,
              weight: true,
              imageUrl: true,
              imageUrls: true,
              videoUrl: true,
              tags: true,
              keywords: true,
              isFeatured: true,
              isNew: true,
              isBestSeller: true,
              rating: true,
              reviewCount: true,
              // Campos de Oferta Normal
              isOnSale: true,
              salePrice: true,
              saleDiscountPercent: true,
              saleStartDate: true,
              saleEndDate: true,
              // Campos de Oferta Relâmpago
              isFlashSale: true,
              flashSalePrice: true,
              flashSaleDiscountPercent: true,
              flashSaleStartDate: true,
              flashSaleEndDate: true,
              store: { 
                select: { 
                  id: true,
                  name: true, 
                  address: true 
                } 
              }
            }
          });

          if (!product) {
            throw new Error('Produto não encontrado');
          }

          return product;
        } catch (retryError) {
          console.error('Erro ao reconectar:', retryError);
          throw new Error('Erro ao buscar produto. Tente novamente mais tarde.');
        }
      }
      
      // Re-lançar outros erros
      throw error;
    }
  }

  async getProductReviews(productId: string, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      // Tentar garantir conexão antes de fazer query
      await this.prisma.$connect();

      const [reviews, total] = await Promise.all([
        this.prisma.productReview.findMany({
          where: { productId },
          skip,
          take: limit,
          include: {
            user: { 
              select: { 
                name: true,
                avatarUrl: true
              } 
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.productReview.count({ where: { productId } })
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
    } catch (error: any) {
      // Em caso de erro de conexão, tentar reconectar e tentar novamente
      if (error.code === 'P1017' || error.message?.includes('Server has closed the connection') || error.message?.includes('db_termination')) {
        try {
          console.warn('Erro de conexão ao buscar reviews, tentando reconectar...');
          await this.prisma.$disconnect();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.prisma.$connect();
          
          const skip = (page - 1) * limit;
          
          const [reviews, total] = await Promise.all([
            this.prisma.productReview.findMany({
              where: { productId },
              skip,
              take: limit,
              include: {
                user: { 
                  select: { 
                    name: true,
                    avatarUrl: true
                  } 
                }
              },
              orderBy: { createdAt: 'desc' }
            }),
            this.prisma.productReview.count({ where: { productId } })
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
        } catch (retryError) {
          console.error('Erro ao reconectar:', retryError);
          // Retornar estrutura vazia em vez de lançar erro para evitar quebrar o frontend
          return {
            reviews: [],
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0
            }
          };
        }
      }
      
      // Em caso de outros erros, retornar estrutura vazia
      console.error('Erro ao buscar reviews:', error);
      return {
        reviews: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      };
    }
  }
}

