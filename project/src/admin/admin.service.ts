import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, ProductCategory, ProductStyle, MaterialType } from '@prisma/client';
import { UploadService } from '../upload/upload.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService
  ) {}

  // ==================== DASHBOARD E ESTATÍSTICAS ====================
  
  async getDashboardStats() {
    const [
      totalStores,
      totalUsers,
      totalProducts,
      totalSales,
      monthlyRevenue,
      activeStores
    ] = await Promise.all([
      this.prisma.store.count(),
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.sale.count(),
      this.getMonthlyRevenue(),
      this.prisma.store.count({ where: { isActive: true } })
    ]);

    const recentSales = await this.prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          store: { select: { name: true } },
          items: {
            include: {
              product: { select: { name: true, price: true } }
            }
          }
        }
    });

    const topProducts = await this.prisma.product.findMany({
      take: 5,
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        name: true,
        price: true,
        rating: true,
        reviewCount: true,
        stock: true,
        store: { select: { name: true } }
      }
    });

    return {
      overview: {
        totalStores,
        totalUsers,
        totalProducts,
        totalSales,
        monthlyRevenue,
        activeStores
      },
      recentSales,
      topProducts
    };
  }

  private async getMonthlyRevenue() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: { gte: startOfMonth }
      },
      include: { items: true }
    });

    return sales.reduce((total, sale) => {
      const saleTotal = sale.items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);
      return total + saleTotal;
    }, 0);
  }

  // ==================== GESTÃO DE USUÁRIOS ====================

  async getAllUsers(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as any } },
        { email: { contains: search, mode: 'insensitive' as any } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          store: { select: { id: true, name: true } }
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

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true, address: true } },
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

    return user;
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    storeId?: string;
    phone?: string;
    address?: string;
  }) {
    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    // Limpar storeId se for string vazia
    const cleanStoreId = userData.storeId && userData.storeId.trim() !== '' ? userData.storeId : undefined;

    // Verificar se loja existe (se fornecida)
    if (cleanStoreId) {
      const store = await this.prisma.store.findUnique({
        where: { id: cleanStoreId }
      });
      if (!store) {
        throw new NotFoundException('Loja não encontrada');
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        storeId: cleanStoreId,
        phone: userData.phone,
        address: userData.address
      },
      include: {
        store: { select: { id: true, name: true } }
      }
    });

    return user;
  }

  async updateUser(id: string, userData: {
    name?: string;
    email?: string;
    role?: UserRole;
    storeId?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
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

    // Verificar se loja existe (se fornecida)
    if (userData.storeId) {
      const store = await this.prisma.store.findUnique({
        where: { id: userData.storeId }
      });
      if (!store) {
        throw new NotFoundException('Loja não encontrada');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: userData,
      include: {
        store: { select: { id: true, name: true } }
      }
    });

    return updatedUser;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se usuário tem vendas associadas
    const userSales = await this.prisma.sale.count({
      where: { customerId: id }
    });

    if (userSales > 0) {
      throw new BadRequestException('Não é possível deletar usuário com vendas associadas');
    }

    await this.prisma.user.delete({
      where: { id }
    });

    return { message: 'Usuário deletado com sucesso' };
  }

  async changeUserPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return { message: 'Senha alterada com sucesso' };
  }

  // ==================== GESTÃO DE LOJAS ====================

  async getAllStores() {
    return this.prisma.store.findMany({
        include: {
          _count: {
            select: {
              products: true,
              sales: true
            }
          }
        },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getStoreById(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        // users: {
        //   select: {
        //     id: true,
        //     name: true,
        //     email: true,
        //     role: true,
        //     isActive: true,
        //     createdAt: true
        //   }
        // },
        products: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            category: true,
            isActive: true
          }
        },
        sales: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true } },
            items: {
              include: {
                product: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    return store;
  }

  async createStore(storeData: {
    name: string;
    address: string;
    phone: string;
    email: string;
    managerId?: string;
  }) {
    const store = await this.prisma.store.create({
      data: {
        name: storeData.name,
        address: storeData.address,
        phone: storeData.phone,
        email: storeData.email,
        city: 'São Paulo',
        state: 'SP',
        zipCode: '00000-000',
        isActive: true
      }
    });

    // Se managerId foi fornecido, atualizar o usuário
    if (storeData.managerId) {
      await this.prisma.user.update({
        where: { id: storeData.managerId },
        data: { storeId: store.id }
      });
    }

    return store;
  }

  async updateStore(id: string, storeData: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
  }) {
    const store = await this.prisma.store.findUnique({
      where: { id }
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    return this.prisma.store.update({
      where: { id },
      data: storeData
    });
  }

  async deleteStore(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id }
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    // Verificar se loja tem usuários associados
    const storeUsers = await this.prisma.user.count({
      where: { storeId: id }
    });

    if (storeUsers > 0) {
      throw new BadRequestException('Não é possível deletar loja com usuários associados');
    }

    await this.prisma.store.delete({
      where: { id }
    });

    return { message: 'Loja deletada com sucesso' };
  }

  // ==================== GESTÃO DE PRODUTOS ====================

  async getAllProducts(page = 1, limit = 10, search = '', category?: ProductCategory) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
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
          store: { select: { id: true, name: true } },
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

  async createProduct(productData: {
    name: string;
    description?: string;
    category: ProductCategory;
    price: number;
    costPrice?: number;
    stock: number;
    minStock?: number;
    colorName?: string;
    colorHex?: string;
    brand?: string;
    style?: ProductStyle;
    material?: MaterialType;
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
    storeId: string;
    supplierId?: string;
  }) {
    // Verificar se loja existe
    const store = await this.prisma.store.findUnique({
      where: { id: productData.storeId }
    });
    if (!store) {
      throw new NotFoundException('Loja não encontrada');
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
        ...productData,
        minStock: productData.minStock || 0,
        isAvailable: productData.isAvailable ?? true
      },
      include: {
        store: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } }
      }
    });

    return product;
  }

  async createProductWithImages(productData: {
    name: string;
    description?: string;
    category: ProductCategory;
    price: number;
    costPrice?: number;
    stock: number;
    minStock?: number;
    colorName?: string;
    colorHex?: string;
    brand?: string;
    style?: ProductStyle;
    material?: MaterialType;
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
    storeId: string;
    supplierId?: string;
  }, files?: Express.Multer.File[]) {
    // Verificar se loja existe
    const store = await this.prisma.store.findUnique({
      where: { id: productData.storeId }
    });
    if (!store) {
      throw new NotFoundException('Loja não encontrada');
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

    // Criar produto primeiro
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        minStock: productData.minStock || 0,
        isAvailable: productData.isAvailable ?? true
      },
      include: {
        store: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } }
      }
    });

    // Se há imagens, fazer upload
    if (files && files.length > 0) {
      try {
        const imageUrls = await this.uploadService.uploadMultipleProductImages(files, product.id);
        
        // Atualizar produto com as imagens
        const updatedProduct = await this.prisma.product.update({
          where: { id: product.id },
          data: { 
            imageUrls,
            imageUrl: imageUrls[0] // Primeira imagem como principal
          },
          include: {
            store: { select: { id: true, name: true } },
            supplier: { select: { id: true, name: true } }
          }
        });

        return updatedProduct;
      } catch (error) {
        // Se falhar o upload, ainda retorna o produto criado
        console.error('Erro no upload das imagens:', error);
        return product;
      }
    }

    return product;
  }

  async updateProduct(id: string, productData: any) {
    const product = await this.prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return this.prisma.product.update({
      where: { id },
      data: productData,
      include: {
        store: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } }
      }
    });
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se produto tem vendas associadas
    const productSales = await this.prisma.saleItem.count({
      where: { productId: id }
    });

    if (productSales > 0) {
      throw new BadRequestException('Não é possível deletar produto com vendas associadas');
    }

    await this.prisma.product.delete({
      where: { id }
    });

    return { message: 'Produto deletado com sucesso' };
  }

  // ==================== RELATÓRIOS ====================

  async getSalesReport(startDate?: Date, endDate?: Date, storeId?: string) {
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    
    if (storeId) {
      where.storeId = storeId;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true } },
        store: { select: { name: true } },
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

  async getInventoryReport(storeId?: string) {
    const where: any = {};
    if (storeId) where.storeId = storeId;

    const products = await this.prisma.product.findMany({
      where,
      include: {
        store: { select: { name: true } }
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

  async getUserActivityReport(userId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (userId) where.customerId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true, role: true } },
        store: { select: { name: true } },
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

  // ==================== GESTÃO DE CLIENTES ====================

  async getAllCustomers(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    
    const where = {
      role: UserRole.CUSTOMER,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as any } },
          { email: { contains: search, mode: 'insensitive' as any } }
        ]
      } : {})
    };

    const [customers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              purchases: true,
              favorites: true,
              reviews: true,
              cartItems: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getCustomerById(id: string) {
    const customer = await this.prisma.user.findUnique({
      where: { 
        id,
        role: UserRole.CUSTOMER 
      },
      include: {
        purchases: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: { 
                  select: { 
                    name: true, 
                    category: true 
                  } 
                }
              }
            }
          }
        },
        favorites: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              select: {
                name: true,
                price: true,
                category: true
              }
            }
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        },
        cartItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
                category: true
              }
            }
          }
        },
        _count: {
          select: {
            purchases: true,
            favorites: true,
            reviews: true,
            cartItems: true
          }
        }
      }
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }
}
