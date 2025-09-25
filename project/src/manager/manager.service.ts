import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ManagerService {
  constructor(private prisma: PrismaService) {}

  // ==================== DASHBOARD DA FILIAL ====================
  
  async getStoreDashboard(managerId: string) {
    // Buscar a loja do gerente
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const storeId = manager.store.id;

    const [
      totalUsers,
      totalProducts,
      totalSales,
      monthlyRevenue,
      lowStockProducts,
      recentSales
    ] = await Promise.all([
      this.prisma.user.count({ where: { storeId } }),
      this.prisma.product.count({ where: { storeId } }),
      this.prisma.sale.count({ where: { storeId } }),
      this.getMonthlyRevenue(storeId),
      this.getLowStockProducts(storeId),
      this.getRecentSales(storeId)
    ]);

    const topProducts = await this.prisma.product.findMany({
      where: { storeId },
      take: 5,
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        name: true,
        price: true,
        rating: true,
        reviewCount: true,
        stock: true,
        category: true
      }
    });

    return {
      store: {
        id: manager.store.id,
        name: manager.store.name,
        address: manager.store.address,
        phone: manager.store.phone,
        email: manager.store.email
      },
      overview: {
        totalUsers,
        totalProducts,
        totalSales,
        monthlyRevenue,
        lowStockProducts: lowStockProducts.length
      },
      recentSales,
      topProducts,
      alerts: {
        lowStock: lowStockProducts,
        outOfStock: await this.getOutOfStockProducts(storeId)
      }
    };
  }

  private async getMonthlyRevenue(storeId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const sales = await this.prisma.sale.findMany({
      where: {
        storeId,
        createdAt: { gte: startOfMonth }
      },
      include: { items: true }
    });

    return sales.reduce((total, sale) => {
      const saleTotal = sale.items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);
      return total + saleTotal;
    }, 0);
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
        category: true
      }
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
        category: true
      }
    });
  }

  private async getRecentSales(storeId: string) {
    return this.prisma.sale.findMany({
      where: { storeId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, email: true } },
        items: {
          include: {
            product: { select: { name: true, price: true } }
          }
        }
      }
    });
  }

  // ==================== GESTÃO DE USUÁRIOS DA FILIAL ====================

  async getStoreUsers(managerId: string, page = 1, limit = 10, search = '') {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const storeId = manager.store.id;
    const skip = (page - 1) * limit;
    
    const where: any = { storeId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as any } },
        { email: { contains: search, mode: 'insensitive' as any } }
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(managerId: string, userId: string) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        store: { select: { id: true, name: true } },
        sales: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: { select: { name: true, price: true } }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o usuário pertence à mesma loja do gerente
    if (user.storeId !== manager.store.id) {
      throw new ForbiddenException('Você só pode visualizar usuários da sua própria loja');
    }

    return user;
  }

  async createStoreUser(managerId: string, userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    address?: string;
  }) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        storeId: manager.store.id, // Sempre atribuir à loja do gerente
        phone: userData.phone,
        address: userData.address
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true
      }
    });

    return user;
  }

  async updateStoreUser(managerId: string, userId: string, userData: {
    name?: string;
    email?: string;
    role?: UserRole;
    phone?: string;
    address?: string;
    isActive?: boolean;
  }) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o usuário pertence à mesma loja do gerente
    if (user.storeId !== manager.store.id) {
      throw new ForbiddenException('Você só pode editar usuários da sua própria loja');
    }

    // Verificar se email já existe (se estiver sendo alterado)
    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email }
      });
      if (existingUser) {
        throw new BadRequestException('Email já está em uso');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        isActive: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  async deleteStoreUser(managerId: string, userId: string) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o usuário pertence à mesma loja do gerente
    if (user.storeId !== manager.store.id) {
      throw new ForbiddenException('Você só pode deletar usuários da sua própria loja');
    }

    // Verificar se usuário tem vendas associadas
    const userSales = await this.prisma.sale.count({
      where: { customerId: userId }
    });

    if (userSales > 0) {
      throw new BadRequestException('Não é possível deletar usuário com vendas associadas');
    }

    await this.prisma.user.delete({
      where: { id: userId }
    });

    return { message: 'Usuário deletado com sucesso' };
  }

  async changeUserPassword(managerId: string, userId: string, newPassword: string) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o usuário pertence à mesma loja do gerente
    if (user.storeId !== manager.store.id) {
      throw new ForbiddenException('Você só pode alterar senhas de usuários da sua própria loja');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return { message: 'Senha alterada com sucesso' };
  }

  // ==================== GESTÃO DE PRODUTOS DA FILIAL ====================

  async getStoreProducts(managerId: string, page = 1, limit = 10, search = '', category?: string) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const storeId = manager.store.id;
    const skip = (page - 1) * limit;
    
    const where: any = { storeId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
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
          supplier: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
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

  async getProductById(managerId: string, productId: string) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } }
      }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o produto pertence à loja do gerente
    if (product.storeId !== manager.store.id) {
      throw new ForbiddenException('Você só pode visualizar produtos da sua própria loja');
    }

    return product;
  }

  async createStoreProduct(managerId: string, productData: {
    name: string;
    description?: string;
    category: string;
    price: number;
    costPrice?: number;
    stock: number;
    minStock?: number;
    colorName?: string;
    colorHex?: string;
    brand?: string;
    style?: string;
    material?: string;
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    model?: string;
    sku?: string;
    barcode?: string;
    imageUrls?: string[];
    videoUrl?: string;
    tags?: string[];
    keywords?: string[];
    isFeatured?: boolean;
    isNew?: boolean;
    isBestSeller?: boolean;
    isAvailable?: boolean;
    supplierId?: string;
  }) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    // Verificar se fornecedor existe (se fornecido)
    if (productData.supplierId) {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id: productData.supplierId }
      });
      if (!supplier) {
        throw new NotFoundException('Fornecedor não encontrado');
      }
    }

    const product = await this.prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        category: productData.category as any,
        price: productData.price,
        costPrice: productData.costPrice,
        stock: productData.stock,
        minStock: productData.minStock || 0,
        colorName: productData.colorName,
        colorHex: productData.colorHex,
        brand: productData.brand,
        style: productData.style as any,
        material: productData.material as any,
        width: productData.width,
        height: productData.height,
        depth: productData.depth,
        weight: productData.weight,
        model: productData.model,
        sku: productData.sku,
        barcode: productData.barcode,
        imageUrls: productData.imageUrls,
        videoUrl: productData.videoUrl,
        tags: productData.tags,
        keywords: productData.keywords,
        isFeatured: productData.isFeatured,
        isNew: productData.isNew,
        isBestSeller: productData.isBestSeller,
        isAvailable: productData.isAvailable ?? true,
        storeId: manager.store.id,
        supplierId: productData.supplierId
      },
      include: {
        store: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } }
      }
    });

    return product;
  }

  async updateStoreProduct(managerId: string, productId: string, productData: any) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o produto pertence à loja do gerente
    if (product.storeId !== manager.store.id) {
      throw new ForbiddenException('Você só pode editar produtos da sua própria loja');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: productData,
      include: {
        store: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } }
      }
    });
  }

  async deleteStoreProduct(managerId: string, productId: string) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o produto pertence à loja do gerente
    if (product.storeId !== manager.store.id) {
      throw new ForbiddenException('Você só pode deletar produtos da sua própria loja');
    }

    // Verificar se produto tem vendas associadas
    const productSales = await this.prisma.saleItem.count({
      where: { productId }
    });

    if (productSales > 0) {
      throw new BadRequestException('Não é possível deletar produto com vendas associadas');
    }

    await this.prisma.product.delete({
      where: { id: productId }
    });

    return { message: 'Produto deletado com sucesso' };
  }

  // ==================== RELATÓRIOS DA FILIAL ====================

  async getStoreSalesReport(managerId: string, startDate?: Date, endDate?: Date) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const storeId = manager.store.id;
    const where: any = { storeId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true } },
        items: {
          include: {
            product: { select: { name: true, category: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalRevenue = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((saleSum, item) => saleSum + (Number(item.unitPrice) * item.quantity), 0);
    }, 0);

    const totalItems = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((saleSum, item) => saleSum + item.quantity, 0);
    }, 0);

    return {
      sales,
      summary: {
        totalSales: sales.length,
        totalRevenue,
        totalItems,
        averageTicket: sales.length > 0 ? totalRevenue / sales.length : 0
      }
    };
  }

  async getStoreInventoryReport(managerId: string) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const storeId = manager.store.id;

    const products = await this.prisma.product.findMany({
      where: { storeId },
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

  async getStoreUserActivityReport(managerId: string, userId?: string, startDate?: Date, endDate?: Date) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const storeId = manager.store.id;
    const where: any = { storeId };
    
    if (userId) {
      // Verificar se o usuário pertence à loja do gerente
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user || user.storeId !== storeId) {
        throw new ForbiddenException('Usuário não pertence à sua loja');
      }
      
      where.customerId = userId;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true, role: true } },
        items: {
          include: {
            product: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return sales;
  }
}
