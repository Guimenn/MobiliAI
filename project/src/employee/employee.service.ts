import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  // ==================== DASHBOARD DO FUNCIONÁRIO ====================
  
  async getEmployeeDashboard(employeeId: string) {
    // Buscar a loja do funcionário
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
      recentMovements
    ] = await Promise.all([
      this.prisma.product.count({ where: { storeId } }),
      this.getLowStockProducts(storeId),
      this.getOutOfStockProducts(storeId),
      this.getTotalInventoryValue(storeId),
      this.getRecentStockMovements(storeId)
    ]);

    const categories = await this.prisma.product.groupBy({
      by: ['category'],
      where: { storeId },
      _count: { id: true },
      _sum: { stock: true }
    });

    return {
      store: {
        id: employee.store.id,
        name: employee.store.name,
        address: employee.store.address,
        phone: employee.store.phone,
        email: employee.store.email
      },
      inventory: {
        totalProducts,
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
        totalValue
      },
      categories: categories.map(cat => ({
        category: cat.category,
        count: cat._count.id,
        totalStock: cat._sum.stock || 0
      })),
      alerts: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts
      },
      recentMovements
    };
  }

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

  private async getRecentStockMovements(storeId: string) {
    // Buscar vendas recentes que afetaram o estoque
    const recentSales = await this.prisma.sale.findMany({
      where: { storeId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { name: true, category: true } }
          }
        }
      }
    });

    return recentSales.map(sale => ({
      date: sale.createdAt,
      type: 'Venda',
      items: sale.items.map(item => ({
        productName: item.product.name,
        category: item.product.category,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice)
      }))
    }));
  }

  // ==================== INFORMAÇÕES DA LOJA ====================

  async getStoreInfo(employeeId: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    if (!employee || !employee.store) {
      throw new NotFoundException('Funcionário não encontrado ou sem loja atribuída');
    }

    return {
      id: employee.store.id,
      name: employee.store.name,
      address: employee.store.address,
      city: employee.store.city,
      state: employee.store.state,
      zipCode: employee.store.zipCode,
      phone: employee.store.phone,
      email: employee.store.email,
      isActive: employee.store.isActive
    };
  }

  // ==================== ESTATÍSTICAS BÁSICAS ====================

  async getInventoryStats(employeeId: string) {
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

    // Buscar todos os produtos para calcular estatísticas corretas
    const products = await this.prisma.product.findMany({
      where,
      include: {
        storeInventory: {
          where: { storeId: storeId },
          select: { quantity: true, minStock: true }
        }
      }
    });

    // Processar produtos para usar estoque do StoreInventory quando disponível
    const processedProducts = products.map((product: any) => {
      const stock = product.storeInventory?.length > 0 
        ? product.storeInventory[0].quantity 
        : product.stock || 0;
      const minStock = product.storeInventory?.length > 0 
        ? product.storeInventory[0].minStock 
        : product.minStock || 0;
      
      return { stock, minStock, price: product.price };
    });

    const totalProducts = processedProducts.length;
    const lowStock = processedProducts.filter((p: any) => p.stock <= p.minStock).length;
    const outOfStock = processedProducts.filter((p: any) => p.stock === 0).length;
    const totalValue = processedProducts.reduce((total, p: any) => 
      total + (Number(p.price) * p.stock), 0
    );
    const averageStock = totalProducts > 0 
      ? processedProducts.reduce((sum, p: any) => sum + p.stock, 0) / totalProducts 
      : 0;

    return {
      totalProducts,
      lowStock,
      outOfStock,
      totalValue,
      averageStock
    };
  }

  private async getAverageStock(storeId: string) {
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

    if (products.length === 0) return 0;

    // Processar produtos para usar estoque do StoreInventory quando disponível
    const processedProducts = products.map((product: any) => {
      return product.storeInventory?.length > 0 
        ? product.storeInventory[0].quantity 
        : product.stock || 0;
    });

    const totalStock = processedProducts.reduce((sum, stock) => sum + stock, 0);
    return totalStock / processedProducts.length;
  }

  // ==================== PEDIDOS ONLINE DA LOJA ====================

  async getStoreOnlineOrders(employeeId: string, page: number = 1, limit: number = 50, status?: string) {
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
    
    const where: any = {
      isOnlineOrder: true,
      storeId
    };
    
    if (status) {
      where.status = status;
    }
    
    const [orders, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              address: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  imageUrl: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
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

  async getStoreOnlineOrderById(employeeId: string, orderId: string) {
    // Verificar se o funcionário tem uma loja atribuída
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    if (!employee || !employee.store) {
      throw new NotFoundException('Funcionário não encontrado ou sem loja atribuída');
    }

    const order = await this.prisma.sale.findFirst({
      where: {
        id: orderId,
        isOnlineOrder: true,
        storeId: employee.store.id
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                imageUrls: true
              }
            }
          }
        }
      }
    });
    
    if (!order) {
      throw new NotFoundException('Pedido online não encontrado');
    }
    
    return order;
  }

  async updateStoreOnlineOrderStatus(employeeId: string, orderId: string, status: string, trackingCode?: string) {
    // Verificar se o funcionário tem uma loja atribuída
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
      include: { store: true }
    });

    if (!employee || !employee.store) {
      throw new NotFoundException('Funcionário não encontrado ou sem loja atribuída');
    }

    const order = await this.prisma.sale.findFirst({
      where: {
        id: orderId,
        isOnlineOrder: true,
        storeId: employee.store.id
      }
    });
    
    if (!order) {
      throw new NotFoundException('Pedido online não encontrado');
    }
    
    const updateData: any = {
      status: status as any
    };
    
    // Se for marcado como enviado, atualizar shippedAt e trackingCode
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
      if (trackingCode) {
        updateData.trackingCode = trackingCode;
      }
    }
    
    // Se for marcado como entregue, atualizar deliveredAt
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }
    
    return this.prisma.sale.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
      }
    });
  }
}
