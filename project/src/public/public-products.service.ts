import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicProductsService {
  constructor(private prisma: PrismaService) {}

  async getProducts(page = 1, limit = 50, search = '', category?: string, minPrice?: number, maxPrice?: number) {
    const skip = (page - 1) * limit;
    
    const where: any = {
      isActive: true,
      stock: { gt: 0 }
    };
    
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
      where.category = category;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const [products, total] = await Promise.all([
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

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getProductById(productId: string) {
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
  }
}
