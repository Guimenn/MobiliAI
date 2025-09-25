import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeeInventoryService {
  constructor(private prisma: PrismaService) {}

  // ==================== CONTROLE DE ESTOQUE ====================

  async getInventoryStatus(employeeId: string) {
    // Verificar se o funcionário tem uma loja atribuída
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    if (!employee || !employee.store) {
      throw new NotFoundException('Funcionário não encontrado ou sem loja atribuída');
    }

    const storeId = employee.store.id;

    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      categories
    ] = await Promise.all([
      this.prisma.product.count({ where: { storeId } }),
      this.getLowStockProducts(storeId),
      this.getOutOfStockProducts(storeId),
      this.getTotalInventoryValue(storeId),
      this.getInventoryByCategory(storeId)
    ]);

    return {
      overview: {
        totalProducts,
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
        totalValue
      },
      lowStockProducts,
      outOfStockProducts,
      categories
    };
  }

  async getProductsByCategory(employeeId: string, category?: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    if (!employee || !employee.store) {
      throw new NotFoundException('Funcionário não encontrado ou sem loja atribuída');
    }

    const storeId = employee.store.id;
    const where: any = { storeId };
    
    if (category) {
      where.category = category;
    }

    return this.prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        stock: true,
        minStock: true,
        price: true,
        brand: true,
        colorName: true
      },
      orderBy: { stock: 'asc' }
    });
  }

  async updateProductStock(employeeId: string, productId: string, newStock: number) {
    // Verificar se o funcionário tem uma loja atribuída
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    if (!employee || !employee.store) {
      throw new NotFoundException('Funcionário não encontrado ou sem loja atribuída');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o produto pertence à loja do funcionário
    if (product.storeId !== employee.store.id) {
      throw new ForbiddenException('Você só pode editar produtos da sua própria loja');
    }

    if (newStock < 0) {
      throw new BadRequestException('Estoque não pode ser negativo');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        category: true,
        price: true
      }
    });
  }

  async adjustInventory(employeeId: string, productId: string, adjustment: number, reason: string) {
    // Verificar se o funcionário tem uma loja atribuída
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    if (!employee || !employee.store) {
      throw new NotFoundException('Funcionário não encontrado ou sem loja atribuída');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o produto pertence à loja do funcionário
    if (product.storeId !== employee.store.id) {
      throw new ForbiddenException('Você só pode editar produtos da sua própria loja');
    }

    const newStock = product.stock + adjustment;
    
    if (newStock < 0) {
      throw new BadRequestException('Estoque não pode ser negativo');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        category: true,
        price: true
      }
    });
  }

  async getInventoryAlerts(employeeId: string) {
    // Verificar se o funcionário tem uma loja atribuída
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    if (!employee || !employee.store) {
      throw new NotFoundException('Funcionário não encontrado ou sem loja atribuída');
    }

    const storeId = employee.store.id;

    const [lowStock, outOfStock] = await Promise.all([
      this.getLowStockProducts(storeId),
      this.getOutOfStockProducts(storeId)
    ]);

    return {
      lowStock,
      outOfStock,
      totalAlerts: lowStock.length + outOfStock.length
    };
  }

  async searchProducts(employeeId: string, searchTerm: string, category?: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    if (!employee || !employee.store) {
      throw new NotFoundException('Funcionário não encontrado ou sem loja atribuída');
    }

    const storeId = employee.store.id;
    const where: any = { 
      storeId,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' as any } },
        { description: { contains: searchTerm, mode: 'insensitive' as any } },
        { brand: { contains: searchTerm, mode: 'insensitive' as any } },
        { sku: { contains: searchTerm, mode: 'insensitive' as any } },
        { barcode: { contains: searchTerm, mode: 'insensitive' as any } }
      ]
    };
    
    if (category) {
      where.category = category;
    }

    return this.prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        stock: true,
        minStock: true,
        price: true,
        brand: true,
        colorName: true,
        sku: true,
        barcode: true
      },
      orderBy: { stock: 'asc' }
    });
  }

  // ==================== RELATÓRIOS DE ESTOQUE ====================

  async getInventoryReport(employeeId: string, category?: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    if (!employee || !employee.store) {
      throw new NotFoundException('Funcionário não encontrado ou sem loja atribuída');
    }

    const storeId = employee.store.id;
    const where: any = { storeId };
    
    if (category) {
      where.category = category;
    }

    const products = await this.prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        stock: true,
        minStock: true,
        price: true,
        brand: true,
        colorName: true
      },
      orderBy: { stock: 'asc' }
    });

    const lowStock = products.filter(p => p.stock <= p.minStock);
    const outOfStock = products.filter(p => p.stock === 0);
    const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * p.stock), 0);

    return {
      products,
      summary: {
        totalProducts: products.length,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        totalValue
      },
      lowStock,
      outOfStock
    };
  }

  async getStockMovement(employeeId: string, productId?: string, days = 30) {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    if (!employee || !employee.store) {
      throw new NotFoundException('Funcionário não encontrado ou sem loja atribuída');
    }

    const storeId = employee.store.id;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      storeId,
      createdAt: { gte: startDate }
    };

    if (productId) {
      where.items = {
        some: { productId }
      };
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: { select: { name: true, category: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular movimentação de estoque
    const stockMovement = sales.map(sale => ({
      date: sale.createdAt,
      type: 'Venda',
      items: sale.items.map(item => ({
        productName: item.product.name,
        category: item.product.category,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice)
      }))
    }));

    return {
      period: `${days} dias`,
      totalSales: sales.length,
      stockMovement
    };
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private async getLowStockProducts(storeId: string) {
    return this.prisma.product.findMany({
      where: {
        storeId,
        stock: {
          lte: this.prisma.product.fields.minStock
        }
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        category: true,
        price: true
      },
      orderBy: { stock: 'asc' }
    });
  }

  private async getOutOfStockProducts(storeId: string) {
    return this.prisma.product.findMany({
      where: {
        storeId,
        stock: 0
      },
      select: {
        id: true,
        name: true,
        category: true,
        price: true
      }
    });
  }

  private async getTotalInventoryValue(storeId: string) {
    const products = await this.prisma.product.findMany({
      where: { storeId },
      select: { price: true, stock: true }
    });

    return products.reduce((total, product) => {
      return total + (Number(product.price) * product.stock);
    }, 0);
  }

  private async getInventoryByCategory(storeId: string) {
    const categories = await this.prisma.product.groupBy({
      by: ['category'],
      where: { storeId },
      _count: { id: true },
      _sum: { stock: true }
    });

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count.id,
      totalStock: cat._sum.stock || 0
    }));
  }
}
