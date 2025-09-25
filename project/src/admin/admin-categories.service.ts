import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductCategory, ProductStyle, MaterialType } from '@prisma/client';

@Injectable()
export class AdminCategoriesService {
  constructor(private prisma: PrismaService) {}

  // ==================== CATEGORIAS DE PRODUTOS ====================

  async getProductCategories() {
    return {
      categories: Object.values(ProductCategory),
      styles: Object.values(ProductStyle),
      materials: Object.values(MaterialType)
    };
  }

  async getCategoryStats() {
    const categories = await this.prisma.product.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      _sum: {
        price: true
      }
    });

    const styles = await this.prisma.product.groupBy({
      by: ['style'],
      _count: {
        id: true
      }
    });

    const materials = await this.prisma.product.groupBy({
      by: ['material'],
      _count: {
        id: true
      }
    });

    return {
      categories: categories.map(cat => ({
        category: cat.category,
        count: cat._count.id,
        totalValue: cat._sum.price || 0
      })),
      styles: styles.map(style => ({
        style: style.style,
        count: style._count.id
      })),
      materials: materials.map(material => ({
        material: material.material,
        count: material._count.id
      }))
    };
  }

  async getProductsByCategory(category: ProductCategory, limit = 10) {
    return this.prisma.product.findMany({
      where: { category },
      take: limit,
      include: {
        store: { select: { name: true } },
        supplier: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getProductsByStyle(style: ProductStyle, limit = 10) {
    return this.prisma.product.findMany({
      where: { style },
      take: limit,
      include: {
        store: { select: { name: true } },
        supplier: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getProductsByMaterial(material: MaterialType, limit = 10) {
    return this.prisma.product.findMany({
      where: { material },
      take: limit,
      include: {
        store: { select: { name: true } },
        supplier: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ==================== ANÁLISE DE CATEGORIAS ====================

  async getCategoryAnalysis() {
    const totalProducts = await this.prisma.product.count();
    
    const categoryAnalysis = await this.prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      _avg: { price: true, rating: true },
      _sum: { stock: true }
    });

    const styleAnalysis = await this.prisma.product.groupBy({
      by: ['style'],
      _count: { id: true },
      _avg: { price: true, rating: true }
    });

    const materialAnalysis = await this.prisma.product.groupBy({
      by: ['material'],
      _count: { id: true },
      _avg: { price: true, rating: true }
    });

    return {
      totalProducts,
      categoryAnalysis: categoryAnalysis.map(cat => ({
        category: cat.category,
        count: cat._count.id,
        percentage: (cat._count.id / totalProducts) * 100,
        averagePrice: cat._avg.price || 0,
        averageRating: cat._avg.rating || 0,
        totalStock: cat._sum.stock || 0
      })),
      styleAnalysis: styleAnalysis.map(style => ({
        style: style.style,
        count: style._count.id,
        percentage: (style._count.id / totalProducts) * 100,
        averagePrice: style._avg.price || 0,
        averageRating: style._avg.rating || 0
      })),
      materialAnalysis: materialAnalysis.map(material => ({
        material: material.material,
        count: material._count.id,
        percentage: (material._count.id / totalProducts) * 100,
        averagePrice: material._avg.price || 0,
        averageRating: material._avg.rating || 0
      }))
    };
  }

  // ==================== PRODUTOS MAIS VENDIDOS POR CATEGORIA ====================

  async getTopSellingByCategory(category: ProductCategory, limit = 5) {
    const products = await this.prisma.product.findMany({
      where: { category },
      include: {
        _count: {
          select: {
            saleItems: true
          }
        },
        store: { select: { name: true } }
      },
      orderBy: {
        saleItems: {
          _count: 'desc'
        }
      },
      take: limit
    });

    return products.map(product => ({
      ...product,
      salesCount: product._count.saleItems
    }));
  }

  // ==================== ESTOQUE POR CATEGORIA ====================

  async getInventoryByCategory() {
    const inventory = await this.prisma.product.groupBy({
      by: ['category'],
      _sum: {
        stock: true,
        price: true
      },
      _count: {
        id: true
      }
    });

    return inventory.map(item => ({
      category: item.category,
      totalStock: item._sum.stock || 0,
      totalValue: (item._sum.stock || 0) * Number(item._sum.price || 0),
      productCount: item._count.id
    }));
  }

  // ==================== PRODUTOS COM ESTOQUE BAIXO POR CATEGORIA ====================

  async getLowStockByCategory() {
    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        stock: {
          lte: this.prisma.product.fields.minStock
        }
      },
      include: {
        store: { select: { name: true } }
      },
      orderBy: { stock: 'asc' }
    });

    // Agrupar por categoria
    const groupedByCategory = lowStockProducts.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, any[]>);

    return groupedByCategory;
  }
}
