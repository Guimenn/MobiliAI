import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, ProductCategory, ProductStyle, MaterialType } from '@prisma/client';
import { UploadService } from '../upload/upload.service';
import { TrellisService } from '../trellis/trellis.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private trellisService: TrellisService
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
    cpf?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    isActive?: boolean;
    workingHours?: any;
    avatarUrl?: string;
  }) {
    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    // Verificar se CPF já existe (se fornecido)
    if (userData.cpf) {
      const existingCpf = await this.prisma.user.findUnique({
        where: { cpf: userData.cpf }
      });
      if (existingCpf) {
        throw new BadRequestException('CPF já está em uso');
      }
    }

    // Limpar storeId se for string vazia
    const cleanStoreId = userData.storeId && userData.storeId.trim() !== '' ? userData.storeId : undefined;

    // Verificar se loja existe (se fornecida)
    if (cleanStoreId) {
      console.log('🔍 Verificando loja com ID:', cleanStoreId);
      const store = await this.prisma.store.findUnique({
        where: { id: cleanStoreId }
      });
      console.log('🏪 Loja encontrada:', store ? 'Sim' : 'Não');
      if (!store) {
        console.log('❌ Loja não encontrada no banco de dados');
        throw new NotFoundException('Loja não encontrada');
      }
    } else {
      console.log('ℹ️ Nenhuma loja especificada (storeId vazio)');
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
          address: userData.address,
          cpf: userData.cpf,
          city: userData.city,
          state: userData.state,
          zipCode: userData.zipCode,
          isActive: userData.isActive ?? true,
          workingHours: userData.workingHours
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
    workingHours?: any;
    avatarUrl?: string;
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

  async updateUserWorkingHours(id: string, workingHours: any) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Validar se o usuário é um funcionário (não cliente)
    if (user.role === UserRole.CUSTOMER) {
      throw new BadRequestException('Clientes não podem ter horário de expediente configurado');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { workingHours },
      include: {
        store: { select: { id: true, name: true } }
      }
    });

    return {
      message: 'Horário de expediente atualizado com sucesso',
      user: updatedUser
    };
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
    const stores = await this.prisma.store.findMany({
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

    // Adicionar contagem de produtos no estoque (StoreInventory) para cada loja
    const storesWithInventoryCount = await Promise.all(
      stores.map(async (store) => {
        // Contar produtos que estão no estoque desta loja
        const inventoryCount = await this.prisma.storeInventory.count({
          where: { storeId: store.id }
        });

        return {
          ...store,
          _count: {
            ...store._count,
            products: inventoryCount, // Substituir pela contagem do estoque
            inventoryProducts: inventoryCount // Manter compatibilidade
          }
        };
      })
    );

    return storesWithInventoryCount;
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
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
    description?: string;
    workingHours?: any;
    settings?: any;
    managerId?: string;
    imageUrl?: string;
  }) {
    const store = await this.prisma.store.create({
      data: {
        name: storeData.name,
        address: storeData.address,
        city: storeData.city,
        state: storeData.state,
        zipCode: storeData.zipCode,
        phone: storeData.phone,
        email: storeData.email,
        description: storeData.description,
        workingHours: storeData.workingHours,
        settings: storeData.settings,
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
    is3D?: boolean;
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

    // Criar produto primeiro (remover is3D pois não é campo do Prisma)
    const { is3D, ...productDataForDb } = productData;
    const product = await this.prisma.product.create({
      data: {
        ...productDataForDb,
        minStock: productDataForDb.minStock || 0,
        isAvailable: productDataForDb.isAvailable ?? true
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
        
        // Se is3D está marcado, gerar modelo 3D
        let model3DUrl: string | undefined = undefined;
        if (is3D && files[0]) {
          try {
            console.log('🎨 Gerando modelo 3D com TRELLIS...');
            const result = await this.trellisService.generate3DModel(files[0]);
            model3DUrl = result.glbUrl;
            console.log('✅ Modelo 3D gerado:', model3DUrl);
          } catch (error) {
            console.error('❌ Erro ao gerar modelo 3D:', error);
            // Continuar mesmo se falhar a geração 3D
          }
        }
        
        // Atualizar produto com as imagens e modelo 3D
        const updatedProduct = await this.prisma.product.update({
          where: { id: product.id },
          data: { 
            imageUrls,
            imageUrl: imageUrls[0], // Primeira imagem como principal
            model3DUrl
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

  async generate3DForProduct(id: string, image?: Express.Multer.File) {
    if (!image) {
      throw new BadRequestException('Imagem é obrigatória para gerar modelo 3D');
    }

    try {
      console.log('🎨 Gerando modelo 3D para produto existente...');
      const result = await this.trellisService.generate3DModel(image);
      
      // Atualizar produto com o modelo 3D gerado
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: { 
          model3DUrl: result.glbUrl
        },
        include: {
          store: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } }
        }
      });

      console.log('✅ Modelo 3D gerado e salvo:', result.glbUrl);
      return updatedProduct;
    } catch (error: any) {
      console.error('❌ Erro ao gerar modelo 3D:', error);
      
      // Re-lançar com mensagem mais clara
      const errorMessage = error?.message || 'Erro desconhecido ao gerar modelo 3D';
      throw new BadRequestException(`Erro ao gerar modelo 3D: ${errorMessage}`);
    }
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

  // ==================== FUNCIONÁRIOS POR LOJA ====================

  async getStoreEmployees(storeId: string) {
    return this.prisma.user.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
  }

  async createEmployee(employeeData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    cpf?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    role: any;
    storeId: string;
    department?: string;
    position?: string;
    hireDate?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    notes?: string;
    isActive?: boolean;
  }) {
    console.log('🔍 Dados recebidos para criar funcionário:', employeeData);
    
    // Verificar se o email já existe
    console.log('🔍 Verificando se email já existe:', employeeData.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email: employeeData.email }
    });

    if (existingUser) {
      console.log('❌ Email já existe:', employeeData.email);
      throw new Error('Já existe um usuário com este email');
    }

    console.log('✅ Email disponível, prosseguindo com criação...');
    const { password, ...userData } = employeeData;
    const hashedPassword = await bcrypt.hash(password, 12);

    const { storeId, department, position, hireDate, emergencyContact, emergencyPhone, notes, ...restUserData } = userData;
    
    console.log('🔍 Dados filtrados para criação:', {
      ...restUserData,
      password: '[HASHED]',
      isActive: userData.isActive ?? true,
      storeId
    });
    
    return this.prisma.user.create({
      data: {
        ...restUserData,
        password: hashedPassword,
        isActive: userData.isActive ?? true,
        store: {
          connect: { id: storeId }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        cpf: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
  }

  async updateEmployee(employeeId: string, employeeData: any) {
    return this.prisma.user.update({
      where: { id: employeeId },
      data: employeeData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
  }

  async deleteEmployee(employeeId: string) {
    return this.prisma.user.delete({
      where: { id: employeeId }
    });
  }

  // ==================== VENDAS POR LOJA ====================

  async getAllSales(adminId: string) {
    // Retornar apenas vendas presenciais (não online)
    return this.prisma.sale.findMany({
      where: {
        isOnlineOrder: false
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        employee: {
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
    });
  }

  // ==================== PEDIDOS ONLINE ====================

  async getOnlineOrders(page: number = 1, limit: number = 50, status?: string, storeId?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {
      isOnlineOrder: true
    };
    
    if (status) {
      where.status = status;
    }
    
    if (storeId) {
      where.storeId = storeId;
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

  async getOnlineOrderById(orderId: string) {
    const order = await this.prisma.sale.findFirst({
      where: {
        id: orderId,
        isOnlineOrder: true
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

  async updateOrderStatus(orderId: string, status: string, trackingCode?: string) {
    const order = await this.prisma.sale.findFirst({
      where: {
        id: orderId,
        isOnlineOrder: true
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

  async getAllSalesOld(adminId: string) {
    return this.prisma.sale.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        employee: {
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
                price: true,
                sku: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getStoreSales(storeId: string) {
    return this.prisma.sale.findMany({
      where: { storeId },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        employee: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getStoreSalesStats(storeId: string) {
    const [totalRevenue, totalSales, averageTicket] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { storeId },
        _sum: { totalAmount: true }
      }),
      this.prisma.sale.count({
        where: { storeId }
      }),
      this.prisma.sale.aggregate({
        where: { storeId },
        _avg: { totalAmount: true }
      })
    ]);

    return {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalSales,
      averageTicket: averageTicket._avg.totalAmount || 0,
      growthRate: 0 // Implementar cálculo de crescimento
    };
  }

  // ==================== ANÁLISES E MÉTRICAS ====================

  async getStoreAnalytics(storeId: string, period: string) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [revenue, sales, customers, products] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          storeId,
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true }
      }),
      this.prisma.sale.count({
        where: {
          storeId,
          createdAt: { gte: startDate }
        }
      }),
      this.prisma.user.count({
        where: {
          storeId,
          role: 'CUSTOMER',
          createdAt: { gte: startDate }
        }
      }),
      this.prisma.product.count({
        where: { storeId }
      })
    ]);

    return {
      revenue: {
        total: revenue._sum.totalAmount || 0,
        growth: 0, // Implementar cálculo de crescimento
        monthly: [] // Implementar dados mensais
      },
      sales: {
        total: sales,
        growth: 0, // Implementar cálculo de crescimento
        daily: [] // Implementar dados diários
      },
      customers: {
        total: customers,
        new: customers,
        returning: 0 // Implementar cálculo de clientes retornando
      },
      products: {
        total: products,
        topSelling: [] // Implementar produtos mais vendidos
      },
      performance: {
        averageTicket: revenue._sum.totalAmount ? Number(revenue._sum.totalAmount) / sales : 0,
        conversionRate: 0, // Implementar taxa de conversão
        customerSatisfaction: 0 // Implementar satisfação do cliente
      }
    };
  }

  // ==================== RELATÓRIOS POR LOJA ====================

  async getStoreReport(storeId: string, options: any) {
    const { type, period, startDate, endDate } = options;
    
    // Implementar lógica de relatórios baseada no tipo
    switch (type) {
      case 'sales':
        return this.getStoreSalesReport(storeId, startDate, endDate);
      case 'revenue':
        return this.getStoreRevenueReport(storeId, startDate, endDate);
      case 'customers':
        return this.getStoreCustomersReport(storeId, startDate, endDate);
      case 'products':
        return this.getStoreProductsReport(storeId, startDate, endDate);
      case 'employees':
        return this.getStoreEmployeesReport(storeId, startDate, endDate);
      case 'comprehensive':
        return this.getStoreComprehensiveReport(storeId, startDate, endDate);
      default:
        return this.getStoreSalesReport(storeId, startDate, endDate);
    }
  }

  async exportStoreReport(storeId: string, options: any) {
    // Implementar exportação de relatórios
    const reportData = await this.getStoreReport(storeId, options);
    
    // Aqui você implementaria a lógica de exportação para PDF, Excel, CSV
    // Por enquanto, retornamos os dados para o frontend processar
    
    return {
      data: reportData,
      format: options.format,
      filename: `relatorio_loja_${storeId}_${new Date().toISOString().split('T')[0]}.${options.format}`
    };
  }

  // Métodos auxiliares para relatórios
  private async getStoreSalesReport(storeId: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = { storeId };
    if (startDate && endDate) {
      whereClause.createdAt = { gte: startDate, lte: endDate };
    }

    const sales = await this.prisma.sale.findMany({
      where: whereClause,
      include: {
        customer: { select: { name: true, email: true } },
        employee: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, price: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalSales = sales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      summary: {
        totalRevenue,
        totalSales,
        averageTicket,
        growthRate: 0
      },
      salesByPeriod: [], // Implementar agrupamento por período
      topProducts: [], // Implementar produtos mais vendidos
      topCustomers: [], // Implementar melhores clientes
      salesByEmployee: [] // Implementar vendas por funcionário
    };
  }

  private async getStoreRevenueReport(storeId: string, startDate?: Date, endDate?: Date) {
    // Implementar relatório de receita
    return { message: 'Relatório de receita em desenvolvimento' };
  }

  private async getStoreCustomersReport(storeId: string, startDate?: Date, endDate?: Date) {
    // Implementar relatório de clientes
    return { message: 'Relatório de clientes em desenvolvimento' };
  }

  private async getStoreProductsReport(storeId: string, startDate?: Date, endDate?: Date) {
    // Implementar relatório de produtos
    return { message: 'Relatório de produtos em desenvolvimento' };
  }

  private async getStoreEmployeesReport(storeId: string, startDate?: Date, endDate?: Date) {
    // Implementar relatório de funcionários
    return { message: 'Relatório de funcionários em desenvolvimento' };
  }

  private async getStoreComprehensiveReport(storeId: string, startDate?: Date, endDate?: Date) {
    // Implementar relatório completo
    return { message: 'Relatório completo em desenvolvimento' };
  }

  // ==================== PONTO ELETRÔNICO ====================

  async registerTimeClock(timeClockData: any) {
    console.log('🔍 AdminService.registerTimeClock - Dados recebidos:', JSON.stringify(timeClockData, null, 2));
    
    const { employeeId, photo, latitude, longitude, address, notes } = timeClockData;
    
    // Verificar se o funcionário existe
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId }
    });

    console.log('👤 Funcionário encontrado:', employee ? 'Sim' : 'Não');

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    // Verificar se já existe um ponto de entrada não fechado hoje
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log('📅 Data de hoje:', today);
    
    const existingEntry = await this.prisma.timeClock.findFirst({
      where: {
        employeeId,
        date: {
          gte: today
        },
        clockOut: null
      }
    });

    console.log('🔍 Entrada existente:', existingEntry ? 'Sim' : 'Não');

    if (existingEntry) {
      throw new BadRequestException('Já existe um ponto de entrada não fechado para hoje');
    }

    // Calcular se está atrasado (comparar com horário padrão de entrada - 8:00)
    const currentTime = new Date();
    const standardStartTime = new Date();
    standardStartTime.setHours(8, 0, 0, 0);
    
    const isLate = currentTime > standardStartTime;
    const minutesLate = isLate ? Math.floor((currentTime.getTime() - standardStartTime.getTime()) / (1000 * 60)) : 0;

    // Criar registro de ponto
    console.log('💾 Criando registro de ponto...');
    const timeClock = await this.prisma.timeClock.create({
      data: {
        employeeId,
        date: new Date().toISOString().split('T')[0],
        clockIn: currentTime.toTimeString().split(' ')[0].substring(0, 5),
        photo,
        latitude,
        longitude,
        address,
        status: isLate ? 'LATE' : 'PRESENT',
        minutesLate: minutesLate,
        totalHours: 0,
        overtimeHours: 0,
        notes
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    console.log('✅ Registro de ponto criado com sucesso:', timeClock.id);

    return {
      message: isLate ? `Ponto registrado com ${minutesLate} minutos de atraso` : 'Ponto de entrada registrado com sucesso',
      timeClock,
      isLate,
      minutesLate
    };
  }

  // ==================== RELATÓRIOS ====================

  async getAllReports() {
    return this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async createReport(reportData: {
    name: string;
    type: string;
    period: string;
    status: string;
    data?: any;
    userId?: string;
    storeId?: string;
  }) {
    return this.prisma.report.create({
      data: reportData
    });
  }

  async deleteReport(id: string) {
    return this.prisma.report.delete({
      where: { id }
    });
  }

  async generateDailyReport(date: Date = new Date()) {
    // Definir início e fim do dia
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar todas as lojas
    const stores = await this.prisma.store.findMany({
      include: {
        products: true
      }
    });

    // Buscar vendas do dia
    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        customer: true,
        employee: true,
        store: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Buscar registros de ponto do dia
    const timeClocks = await this.prisma.timeClock.findMany({
      where: {
        date: date.toISOString().split('T')[0]
      },
      include: {
        employee: true
      }
    });

    // Buscar caixas do dia
    const dailyCash = await this.prisma.dailyCash.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        store: true,
        user: true
      }
    });

    // Calcular métricas gerais
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
    const totalSales = sales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Métricas por método de pagamento
    const paymentMethods = sales.reduce((acc, sale) => {
      const method = sale.paymentMethod;
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count++;
      acc[method].total += Number(sale.totalAmount || 0);
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Métricas por loja
    const storeMetrics = stores.map(store => {
      const storeSales = sales.filter(s => s.storeId === store.id);
      const storeRevenue = storeSales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
      const storeDailyCash = dailyCash.find(dc => dc.storeId === store.id);
      
      return {
        storeId: store.id,
        storeName: store.name,
        totalSales: storeSales.length,
        totalRevenue: storeRevenue,
        averageTicket: storeSales.length > 0 ? storeRevenue / storeSales.length : 0,
        isActive: store.isActive,
        openingAmount: storeDailyCash?.openingAmount ? Number(storeDailyCash.openingAmount) : 0,
        closingAmount: storeDailyCash?.closingAmount ? Number(storeDailyCash.closingAmount) : 0,
        hasCashOpen: !!storeDailyCash?.isOpen
      };
    });

    // Métricas por vendedor
    const employeeMetrics = sales.reduce((acc, sale) => {
      const employeeId = sale.employeeId;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employeeId: employeeId,
          employeeName: sale.employee?.name || 'Desconhecido',
          storeName: sale.store?.name || 'Sem loja',
          totalSales: 0,
          totalRevenue: 0,
          sales: []
        };
      }
      acc[employeeId].totalSales++;
      acc[employeeId].totalRevenue += Number(sale.totalAmount || 0);
      acc[employeeId].sales.push(sale);
      return acc;
    }, {} as Record<string, any>);

    const topEmployees = Object.values(employeeMetrics)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Métricas de presença
    const attendanceMetrics = {
      totalEmployees: Object.keys(timeClocks.reduce((acc, tc) => {
        acc[tc.employeeId] = true;
        return acc;
      }, {} as Record<string, boolean>)).length,
      totalLates: timeClocks.filter(tc => (tc.minutesLate || 0) > 0).length,
      totalOvertime: timeClocks.filter(tc => (tc.overtimeHours || 0) > 0).length,
      averageHours: timeClocks.length > 0 
        ? timeClocks.reduce((sum, tc) => sum + (tc.totalHours || 0), 0) / timeClocks.length 
        : 0
    };

    // Métricas de produtos
    const productMetrics = sales.reduce((acc, sale) => {
      sale.items.forEach(item => {
        const productId = item.productId;
        const product = item.product;
        if (!acc[productId]) {
          acc[productId] = {
            productId,
            productName: product?.name || 'Desconhecido',
            category: product?.category || 'OUTROS',
            quantity: 0,
            revenue: 0
          };
        }
        acc[productId].quantity += item.quantity;
        acc[productId].revenue += Number(item.totalPrice || 0);
      });
      return acc;
    }, {} as Record<string, any>);

    const topProducts = Object.values(productMetrics)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    // Buscar vendas dos últimos 7 dias para gráfico de tendência
    const sevenDaysAgo = new Date(date);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentSales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
          lte: endOfDay
        }
      },
      select: {
        createdAt: true,
        totalAmount: true
      }
    });

    // Processar vendas por período (últimos 7 dias)
    const salesByPeriodMap = new Map<string, number>();
    recentSales.forEach(sale => {
      const saleDate = new Date(sale.createdAt);
      const dateKey = saleDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const currentAmount = salesByPeriodMap.get(dateKey) || 0;
      salesByPeriodMap.set(dateKey, currentAmount + Number(sale.totalAmount || 0));
    });

    // Converter para array e ordenar
    const salesByPeriod = Array.from(salesByPeriodMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      })
      .slice(-7); // Últimos 7 dias

    // Construir relatório completo
    const report = {
      date: date.toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      
      // Resumo geral
      summary: {
        totalRevenue,
        totalSales,
        averageTicket,
        totalStores: stores.length,
        activeStores: stores.filter(s => s.isActive).length
      },
      
      // Métricas de pagamento
      paymentMethods: Object.entries(paymentMethods).map(([method, data]: [string, any]) => ({
        method,
        count: data.count,
        total: data.total,
        percentage: totalSales > 0 ? (data.count / totalSales * 100) : 0
      })),
      
      // Métricas por loja
      stores: storeMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue),
      
      // Top vendedores
      topEmployees: topEmployees,
      
      // Métricas de presença
      attendance: attendanceMetrics,
      
      // Top produtos (já processados)
      topProducts: topProducts.map((p: any) => ({
        productId: p.productId,
        productName: p.productName,
        category: p.category,
        quantity: p.quantity,
        revenue: p.revenue
      })),
      
      // Análise de clientes
      customers: {
        total: Object.keys(sales.reduce((acc, sale) => {
          if (sale.customerId) acc[sale.customerId] = true;
          return acc;
        }, {} as Record<string, boolean>)).length,
        newCustomers: sales.filter(sale => sale.customer?.createdAt && new Date(sale.customer.createdAt) >= startOfDay).length
      },

      // Dados para gráficos
      charts: {
        // Vendas por período (últimos 7 dias)
        salesByPeriod: salesByPeriod,
        
        // Top 5 produtos para gráfico
        topProductsChart: topProducts.slice(0, 5).map((p: any) => ({
          name: p.productName,
          quantity: p.quantity,
          revenue: p.revenue
        }))
      }
    };

    // Salvar relatório no banco
    const savedReport = await this.prisma.report.create({
      data: {
        name: `Relatório Diário - ${date.toLocaleDateString('pt-BR')}`,
        type: 'daily',
        period: date.toISOString().split('T')[0],
        status: 'completed',
        data: report as any
      }
    });

    return savedReport;
  }

  // ==================== ESTOQUE POR LOJA ====================

  async getStoreInventory(storeId: string) {
    // Verificar se a loja existe
    const store = await this.prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    // Buscar todos os produtos com seus estoques na loja
    const inventory = await this.prisma.storeInventory.findMany({
      where: { storeId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            price: true,
            costPrice: true,
            sku: true,
            barcode: true,
            imageUrl: true,
            imageUrls: true,
            brand: true,
            colorName: true,
            colorHex: true,
            isActive: true,
            isAvailable: true,
            stock: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Adicionar informações de estoque disponível para cada item
    const inventoryWithStockInfo = await Promise.all(
      inventory.map(async (item) => {
        // Buscar estoque distribuído em todas as lojas para este produto
        const allStoreInventory = await this.prisma.storeInventory.findMany({
          where: { productId: item.productId },
          select: { quantity: true, storeId: true }
        });

        const totalDistributed = allStoreInventory.reduce((sum, inv) => sum + inv.quantity, 0);
        const distributedInOtherStores = allStoreInventory
          .filter(inv => inv.storeId !== storeId)
          .reduce((sum, inv) => sum + inv.quantity, 0);
        const availableForThisStore = Number(item.product.stock) - distributedInOtherStores;

        return {
          ...item,
          stockInfo: {
            totalStock: Number(item.product.stock),
            totalDistributed,
            distributedInOtherStores,
            availableForThisStore
          }
        };
      })
    );

    return inventoryWithStockInfo;
  }

  async getAvailableProductsForStore(storeId: string, search?: string) {
    // Verificar se a loja existe
    const store = await this.prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    // Buscar produtos que já estão no estoque da loja
    const existingInventory = await this.prisma.storeInventory.findMany({
      where: { storeId },
      select: { productId: true }
    });

    const existingProductIds = existingInventory.map(inv => inv.productId);

    // Buscar produtos que não estão no estoque
    const whereClause: any = {
      isActive: true
    };

    if (existingProductIds.length > 0) {
      whereClause.id = { notIn: existingProductIds };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        sku: true,
        barcode: true,
        imageUrl: true,
        imageUrls: true,
        brand: true,
        colorName: true,
        colorHex: true,
        isActive: true,
        isAvailable: true,
        stock: true
      },
      take: 50,
      orderBy: { name: 'asc' }
    });

    // Calcular estoque disponível para cada produto
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        // Buscar estoque já distribuído em todas as lojas para este produto
        const distributedInventory = await this.prisma.storeInventory.findMany({
          where: { productId: product.id },
          select: { quantity: true }
        });

        const totalDistributed = distributedInventory.reduce((sum, inv) => sum + inv.quantity, 0);
        const availableStock = Number(product.stock) - totalDistributed;

        return {
          ...product,
          stock: Number(product.stock),
          distributedStock: totalDistributed,
          availableStock: availableStock
        };
      })
    );

    return productsWithStock;
  }

  async updateStoreInventory(storeId: string, productId: string, inventoryData: {
    quantity?: number;
    minStock?: number;
    maxStock?: number;
    location?: string;
    notes?: string;
  }) {
    // Verificar se a loja existe
    const store = await this.prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    // Verificar se o produto existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se já existe estoque para este produto na loja
    const existingInventory = await this.prisma.storeInventory.findUnique({
      where: {
        storeId_productId: {
          storeId,
          productId
        }
      }
    });

    if (existingInventory) {
      // Se está atualizando a quantidade, validar estoque disponível
      if (inventoryData.quantity !== undefined) {
        // Calcular estoque total já distribuído entre todas as lojas (exceto esta loja)
        const allStoreInventory = await this.prisma.storeInventory.findMany({
          where: { productId },
          select: { quantity: true, storeId: true }
        });

        const totalDistributed = allStoreInventory.reduce((sum, inv) => {
          // Não incluir o estoque atual desta loja na soma
          if (inv.storeId !== storeId) {
            return sum + inv.quantity;
          }
          return sum;
        }, 0);

        const availableStock = Number(product.stock) - totalDistributed;

        // Validar se há estoque suficiente
        if (inventoryData.quantity > availableStock) {
          throw new BadRequestException(
            `Estoque insuficiente! Estoque total do produto: ${product.stock} unidades. ` +
            `Já distribuído em outras lojas: ${totalDistributed} unidades. ` +
            `Disponível para esta loja: ${availableStock} unidades. ` +
            `Você tentou definir: ${inventoryData.quantity} unidades.`
          );
        }
      }

      // Atualizar estoque existente
      return this.prisma.storeInventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: inventoryData.quantity !== undefined ? inventoryData.quantity : existingInventory.quantity,
          minStock: inventoryData.minStock !== undefined ? inventoryData.minStock : existingInventory.minStock,
          maxStock: inventoryData.maxStock !== undefined ? inventoryData.maxStock : existingInventory.maxStock,
          location: inventoryData.location !== undefined ? inventoryData.location : existingInventory.location,
          notes: inventoryData.notes !== undefined ? inventoryData.notes : existingInventory.notes
        },
        include: {
          product: true
        }
      });
    } else {
      // Se está criando novo estoque com quantidade, validar estoque disponível
      const requestedQuantity = inventoryData.quantity || 0;
      
      if (requestedQuantity > 0) {
        // Calcular estoque total já distribuído entre todas as lojas
        const allStoreInventory = await this.prisma.storeInventory.findMany({
          where: { productId },
          select: { quantity: true }
        });

        const totalDistributed = allStoreInventory.reduce((sum, inv) => sum + inv.quantity, 0);
        const availableStock = Number(product.stock) - totalDistributed;

        // Validar se há estoque suficiente
        if (requestedQuantity > availableStock) {
          throw new BadRequestException(
            `Estoque insuficiente! Estoque total do produto: ${product.stock} unidades. ` +
            `Já distribuído entre lojas: ${totalDistributed} unidades. ` +
            `Disponível: ${availableStock} unidades. ` +
            `Você tentou adicionar: ${requestedQuantity} unidades.`
          );
        }
      }

      // Criar novo registro de estoque
      return this.prisma.storeInventory.create({
        data: {
          storeId,
          productId,
          quantity: requestedQuantity,
          minStock: inventoryData.minStock || 0,
          maxStock: inventoryData.maxStock,
          location: inventoryData.location,
          notes: inventoryData.notes
        },
        include: {
          product: true
        }
      });
    }
  }

  async addProductToStore(storeId: string, productId: string, initialQuantity: number = 0, minStock: number = 0) {
    // Verificar se a loja existe
    const store = await this.prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }

    // Verificar se o produto existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se já existe estoque
    const existingInventory = await this.prisma.storeInventory.findUnique({
      where: {
        storeId_productId: {
          storeId,
          productId
        }
      }
    });

    if (existingInventory) {
      throw new BadRequestException('Produto já está no estoque desta loja');
    }

    // Calcular estoque total já distribuído entre todas as lojas
    const allStoreInventory = await this.prisma.storeInventory.findMany({
      where: { productId },
      select: { quantity: true }
    });

    const totalDistributed = allStoreInventory.reduce((sum, inv) => sum + inv.quantity, 0);
    const availableStock = Number(product.stock) - totalDistributed;

    // Validar se há estoque suficiente
    if (initialQuantity > availableStock) {
      throw new BadRequestException(
        `Estoque insuficiente! Estoque total do produto: ${product.stock} unidades. ` +
        `Já distribuído entre lojas: ${totalDistributed} unidades. ` +
        `Disponível: ${availableStock} unidades. ` +
        `Você tentou adicionar: ${initialQuantity} unidades.`
      );
    }

    // Criar novo registro de estoque
    return this.prisma.storeInventory.create({
      data: {
        storeId,
        productId,
        quantity: initialQuantity,
        minStock: minStock
      },
      include: {
        product: true
      }
    });
  }

  async removeProductFromStore(storeId: string, productId: string) {
    // Verificar se existe estoque
    const inventory = await this.prisma.storeInventory.findUnique({
      where: {
        storeId_productId: {
          storeId,
          productId
        }
      }
    });

    if (!inventory) {
      throw new NotFoundException('Produto não encontrado no estoque desta loja');
    }

    // Remover do estoque
    await this.prisma.storeInventory.delete({
      where: { id: inventory.id }
    });

    return { message: 'Produto removido do estoque da loja com sucesso' };
  }
}
