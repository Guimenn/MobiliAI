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

    // Buscar produtos considerando StoreInventory (igual ao manager)
    const where: any = {
      OR: [
        { storeId: storeId },
        { storeInventory: { some: { storeId: storeId } } }
      ],
      isActive: true
    };

    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      categories
    ] = await Promise.all([
      this.prisma.product.count({ where }),
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
    
    // IMPORTANTE: Employee deve ver produtos da mesma forma que o manager:
    // 1. Produtos com storeId da sua loja
    // 2. Produtos disponíveis via StoreInventory da sua loja
    const where: any = {
      OR: [
        { storeId: storeId }, // Produtos com storeId da loja
        { storeInventory: { some: { storeId: storeId } } } // Produtos via StoreInventory
      ],
      isActive: true
    };
    
    if (category) {
      where.category = category;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        storeInventory: {
          where: { storeId: storeId },
          select: {
            quantity: true,
            minStock: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Processar produtos para usar estoque do StoreInventory quando disponível
    // Se o produto está via StoreInventory, usar quantity do StoreInventory
    // Se o produto tem storeId da loja, usar stock do produto
    const processedProducts = products.map((product: any) => {
      // Se o produto está no StoreInventory da loja, usar quantity do StoreInventory
      if (product.storeInventory && product.storeInventory.length > 0) {
        const inventory = product.storeInventory[0];
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          stock: inventory.quantity || 0,
          minStock: inventory.minStock || product.minStock || 0,
          price: product.price,
          brand: product.brand,
          colorName: product.colorName,
          availableViaStoreInventory: true
        };
      }
      
      // Se o produto tem storeId da loja, usar stock do produto
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        stock: product.stock || 0,
        minStock: product.minStock || 0,
        price: product.price,
        brand: product.brand,
        colorName: product.colorName,
        availableViaStoreInventory: false
      };
    });

    // Ordenar por estoque (ascendente)
    return processedProducts.sort((a, b) => a.stock - b.stock);
  }

  async getStoreProducts(employeeId: string, page = 1, limit = 10, search = '', category?: string) {
    // Verificar se o funcionário tem uma loja atribuída
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    if (!employee || !employee.store) {
      throw new NotFoundException('Funcionário não encontrado ou sem loja atribuída');
    }

    const storeId = employee.store.id;
    const skip = (page - 1) * limit;
    
    // IMPORTANTE: Employee deve ver produtos da mesma forma que o manager:
    // 1. Produtos com storeId da sua loja
    // 2. Produtos disponíveis via StoreInventory da sua loja
    const where: any = {
      OR: [
        { storeId: storeId }, // Produtos com storeId da loja
        { storeInventory: { some: { storeId: storeId } } } // Produtos via StoreInventory
      ],
      isActive: true
    };
    
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }
    
    if (category) {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          supplier: { select: { id: true, name: true } },
          storeInventory: {
            where: { storeId: storeId },
            select: {
              quantity: true,
              minStock: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.product.count({ where })
    ]);

    // Processar produtos para usar estoque do StoreInventory quando disponível
    // Se o produto está via StoreInventory, usar quantity do StoreInventory
    // Se o produto tem storeId da loja, usar stock do produto
    const processedProducts = products.map((product: any) => {
      // Se o produto está no StoreInventory da loja, usar quantity do StoreInventory
      if (product.storeInventory && product.storeInventory.length > 0) {
        const inventory = product.storeInventory[0];
        return {
          ...product,
          stock: inventory.quantity || 0,
          minStock: inventory.minStock || product.minStock || 0,
          availableViaStoreInventory: true,
          originalStoreId: product.storeId
        };
      }
      
      // Se o produto tem storeId da loja, usar stock do produto
      return {
        ...product,
        stock: product.stock || 0,
        availableViaStoreInventory: false
      };
    });

    return {
      products: processedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
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
      where: { id: productId },
      select: {
        id: true,
        name: true,
        storeId: true,
        stock: true
      }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (newStock < 0) {
      throw new BadRequestException('Estoque não pode ser negativo');
    }

    const storeId = employee.store.id;
    const isProductInStore = product.storeId === storeId;

    // Verificar se o produto está no StoreInventory da loja do funcionário
    const storeInventory = await this.prisma.storeInventory.findUnique({
      where: {
        storeId_productId: {
          storeId: storeId,
          productId: productId
        }
      }
    });

    const isProductInStoreInventory = !!storeInventory;

    // Se o produto não está na loja nem via storeId nem via StoreInventory
    if (!isProductInStore && !isProductInStoreInventory) {
      throw new ForbiddenException('Você só pode editar produtos da sua própria loja');
    }

    // Se o produto está no StoreInventory, atualizar o StoreInventory (não afeta outras lojas)
    if (isProductInStoreInventory) {
      const updatedInventory = await this.prisma.storeInventory.update({
        where: {
          storeId_productId: {
            storeId: storeId,
            productId: productId
          }
        },
        data: { quantity: newStock },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              category: true
            }
          }
        }
      });

      return {
        id: updatedInventory.product.id,
        name: updatedInventory.product.name,
        stock: updatedInventory.quantity,
        category: updatedInventory.product.category,
        price: updatedInventory.product.price
      };
    }

    // Se o produto tem storeId da loja, atualizar o produto diretamente
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
    // Buscar produtos considerando StoreInventory
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { storeId: storeId },
          { storeInventory: { some: { storeId: storeId } } }
        ],
        isActive: true
      },
      include: {
        storeInventory: {
          where: { storeId: storeId },
          select: { quantity: true, minStock: true }
        }
      }
    });

    // Filtrar produtos com estoque baixo considerando StoreInventory
    return products
      .map((product: any) => {
        const stock = product.storeInventory?.length > 0 
          ? product.storeInventory[0].quantity 
          : product.stock;
        const minStock = product.storeInventory?.length > 0 
          ? product.storeInventory[0].minStock 
          : product.minStock;
        
        return {
          id: product.id,
          name: product.name,
          stock,
          minStock,
          category: product.category,
          price: product.price
        };
      })
      .filter((p: any) => p.stock <= p.minStock)
      .sort((a: any, b: any) => a.stock - b.stock);
  }

  private async getOutOfStockProducts(storeId: string) {
    // Buscar produtos considerando StoreInventory
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { storeId: storeId },
          { storeInventory: { some: { storeId: storeId } } }
        ],
        isActive: true
      },
      include: {
        storeInventory: {
          where: { storeId: storeId },
          select: { quantity: true }
        }
      }
    });

    // Filtrar produtos sem estoque considerando StoreInventory
    return products
      .map((product: any) => {
        const stock = product.storeInventory?.length > 0 
          ? product.storeInventory[0].quantity 
          : product.stock;
        
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          stock
        };
      })
      .filter((p: any) => p.stock === 0);
  }

  private async getTotalInventoryValue(storeId: string) {
    // Buscar produtos considerando StoreInventory
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { storeId: storeId },
          { storeInventory: { some: { storeId: storeId } } }
        ],
        isActive: true
      },
      include: {
        storeInventory: {
          where: { storeId: storeId },
          select: { quantity: true }
        }
      }
    });

    return products.reduce((total, product: any) => {
      const stock = product.storeInventory?.length > 0 
        ? product.storeInventory[0].quantity 
        : product.stock || 0;
      return total + (Number(product.price) * stock);
    }, 0);
  }

  private async getInventoryByCategory(storeId: string) {
    // Buscar produtos considerando StoreInventory
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { storeId: storeId },
          { storeInventory: { some: { storeId: storeId } } }
        ],
        isActive: true
      },
      include: {
        storeInventory: {
          where: { storeId: storeId },
          select: { quantity: true }
        }
      }
    });

    // Agrupar por categoria considerando StoreInventory
    const categoryMap = new Map<string, { count: number; totalStock: number }>();
    
    products.forEach((product: any) => {
      const stock = product.storeInventory?.length > 0 
        ? product.storeInventory[0].quantity 
        : (product as any).stock || 0;
      
      const category = product.category || 'Sem categoria';
      const current = categoryMap.get(category) || { count: 0, totalStock: 0 };
      
      categoryMap.set(category, {
        count: current.count + 1,
        totalStock: current.totalStock + stock
      });
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      totalStock: data.totalStock
    }));
  }
}
