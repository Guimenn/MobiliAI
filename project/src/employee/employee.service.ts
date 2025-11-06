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
    const products = await this.prisma.product.findMany({
      where: { storeId },
      select: { price: true, stock: true }
    });

    return products.reduce((total, product) => {
      return total + (Number(product.price) * product.stock);
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

    const [
      totalProducts,
      lowStock,
      outOfStock,
      totalValue
    ] = await Promise.all([
      this.prisma.product.count({ where: { storeId } }),
      this.prisma.product.count({ 
        where: { 
          storeId,
          stock: { lte: this.prisma.product.fields.minStock }
        }
      }),
      this.prisma.product.count({ 
        where: { 
          storeId,
          stock: 0
        }
      }),
      this.getTotalInventoryValue(storeId)
    ]);

    return {
      totalProducts,
      lowStock,
      outOfStock,
      totalValue,
      averageStock: totalProducts > 0 ? await this.getAverageStock(storeId) : 0
    };
  }

  private async getAverageStock(storeId: string) {
    const products = await this.prisma.product.findMany({
      where: { storeId },
      select: { stock: true }
    });

    if (products.length === 0) return 0;

    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    return totalStock / products.length;
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
