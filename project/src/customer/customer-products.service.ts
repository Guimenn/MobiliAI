import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerProductsService {
  constructor(private prisma: PrismaService) {}

  // ==================== CATÁLOGO DE PRODUTOS ====================

  async getProducts(page = 1, limit = 12, search = '', category?: string, minPrice?: number, maxPrice?: number) {
    const skip = (page - 1) * limit;
    
    const where: any = {
      isAvailable: true,
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
          store: { select: { name: true, address: true } }
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
      where: { id: productId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        costPrice: true,
        stock: true,
        minStock: true,
        colorName: true,
        colorHex: true,
        brand: true,
        style: true,
        material: true,
        width: true,
        height: true,
        depth: true,
        weight: true,
        model: true,
        sku: true,
        barcode: true,
        imageUrls: true,
        videoUrl: true,
        tags: true,
        keywords: true,
        isFeatured: true,
        isNew: true,
        isBestSeller: true,
        rating: true,
        reviewCount: true,
        isAvailable: true,
        store: { 
          select: { 
            id: true, 
            name: true, 
            address: true, 
            phone: true, 
            email: true 
          } 
        },
        supplier: { select: { name: true } },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: { select: { name: true } }
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async getFeaturedProducts(limit = 8) {
    return this.prisma.product.findMany({
      where: {
        isFeatured: true,
        isAvailable: true,
        stock: { gt: 0 }
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        colorName: true,
        colorHex: true,
        brand: true,
        imageUrls: true,
        rating: true,
        reviewCount: true,
        isNew: true,
        isBestSeller: true,
        store: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getNewProducts(limit = 8) {
    return this.prisma.product.findMany({
      where: {
        isNew: true,
        isAvailable: true,
        stock: { gt: 0 }
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        colorName: true,
        colorHex: true,
        brand: true,
        imageUrls: true,
        rating: true,
        reviewCount: true,
        isFeatured: true,
        isBestSeller: true,
        store: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getBestSellerProducts(limit = 8) {
    return this.prisma.product.findMany({
      where: {
        isBestSeller: true,
        isAvailable: true,
        stock: { gt: 0 }
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        colorName: true,
        colorHex: true,
        brand: true,
        imageUrls: true,
        rating: true,
        reviewCount: true,
        isFeatured: true,
        isNew: true,
        store: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ==================== BUSCA E FILTROS ====================

  async searchProducts(searchTerm: string, page = 1, limit = 12) {
    const skip = (page - 1) * limit;
    
    const where = {
      isAvailable: true,
      stock: { gt: 0 },
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' as any } },
        { description: { contains: searchTerm, mode: 'insensitive' as any } },
        { brand: { contains: searchTerm, mode: 'insensitive' as any } },
        { tags: { has: searchTerm } },
        { keywords: { has: searchTerm } }
      ]
    };

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
          colorName: true,
          colorHex: true,
          brand: true,
          imageUrls: true,
          rating: true,
          reviewCount: true,
          isFeatured: true,
          isNew: true,
          isBestSeller: true,
          store: { select: { name: true } }
        },
        orderBy: [
          { isFeatured: 'desc' },
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

  async getProductsByCategory(category: string, page = 1, limit = 12) {
    const skip = (page - 1) * limit;
    
    const where = {
      category: category as any,
      isAvailable: true,
      stock: { gt: 0 }
    };

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
          colorName: true,
          colorHex: true,
          brand: true,
          imageUrls: true,
          rating: true,
          reviewCount: true,
          isFeatured: true,
          isNew: true,
          isBestSeller: true,
          store: { select: { name: true } }
        },
        orderBy: [
          { isFeatured: 'desc' },
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

  // ==================== CATEGORIAS E FILTROS ====================

  async getCategories() {
    const categories = await this.prisma.product.groupBy({
      by: ['category'],
      where: {
        isAvailable: true,
        stock: { gt: 0 }
      },
      _count: { id: true }
    });

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count.id
    }));
  }

  async getBrands() {
    const brands = await this.prisma.product.groupBy({
      by: ['brand'],
      where: {
        isAvailable: true,
        stock: { gt: 0 },
        brand: { not: null }
      },
      _count: { id: true }
    });

    return brands.map(brand => ({
      brand: brand.brand,
      count: brand._count.id
    }));
  }

  async getPriceRanges() {
    const products = await this.prisma.product.findMany({
      where: {
        isAvailable: true,
        stock: { gt: 0 }
      },
      select: { price: true }
    });

    if (products.length === 0) {
      return [];
    }

    const prices = products.map(p => Number(p.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return {
      min: minPrice,
      max: maxPrice,
      ranges: [
        { label: 'Até R$ 500', min: 0, max: 500 },
        { label: 'R$ 500 - R$ 1.000', min: 500, max: 1000 },
        { label: 'R$ 1.000 - R$ 2.000', min: 1000, max: 2000 },
        { label: 'R$ 2.000 - R$ 5.000', min: 2000, max: 5000 },
        { label: 'Acima de R$ 5.000', min: 5000, max: Infinity }
      ]
    };
  }
}
