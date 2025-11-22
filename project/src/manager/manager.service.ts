import { Injectable, ForbiddenException, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, MedicalCertificateType, MedicalCertificateStatus } from '@prisma/client';
import { CreateMedicalCertificateDto } from '../admin/dto/create-medical-certificate.dto';
import * as bcrypt from 'bcryptjs';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class ManagerService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AdminService))
    private adminService: AdminService
  ) {}

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
          createdAt: true,
          avatarUrl: true
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
    
    // IMPORTANTE: Manager vê produtos de duas formas:
    // 1. Produtos com storeId da sua loja
    // 2. Produtos disponíveis via StoreInventory da sua loja
    // Isso permite que os 90 produtos originais sejam compartilhados, mas com estoques independentes
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
    // Garantir que stock seja um número se estiver presente
    if (productData.stock !== undefined && productData.stock !== null) {
      productData.stock = Number(productData.stock);
      if (isNaN(productData.stock)) {
        throw new BadRequestException('Estoque deve ser um número válido');
      }
    }

    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        name: true,
        storeId: true,
        role: true,
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!manager) {
      throw new NotFoundException('Gerente não encontrado');
    }

    // Usar storeId diretamente se a relação store não estiver disponível
    const managerStoreId = manager.store?.id || manager.storeId;
    
    if (!managerStoreId) {
      throw new NotFoundException('Gerente não está associado a nenhuma loja');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        storeId: true,
        stock: true,
        minStock: true,
      }
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o produto pertence à loja do gerente
    // Normalizar IDs para string para comparação correta (removendo espaços e convertendo para lowercase)
    const productStoreId = product.storeId ? String(product.storeId).trim().toLowerCase() : null;
    const managerStoreIdStr = String(managerStoreId).trim().toLowerCase();

    // Verificar se o produto está disponível na loja do manager de duas formas:
    // 1. Produto tem storeId da loja do manager
    // 2. Produto está no StoreInventory da loja do manager
    const isProductInManagerStore = productStoreId === managerStoreIdStr;
    
    // Verificar se o produto está no StoreInventory da loja do manager
    // IMPORTANTE: Usar managerStoreId (não managerStoreIdStr) para a busca
    const storeInventory = await this.prisma.storeInventory.findUnique({
      where: {
        storeId_productId: {
          storeId: managerStoreId,  // Usar o ID direto, não a string normalizada
          productId: productId
        }
      }
    });

    const isProductInStoreInventory = !!storeInventory;

    // Se o produto não está na loja do manager nem via storeId nem via StoreInventory
    if (!isProductInManagerStore && !isProductInStoreInventory) {
      // Se o produto não está no StoreInventory, criar um registro para permitir edição
      // Isso pode acontecer se o script não foi executado ou se o produto foi adicionado recentemente
      try {
        const newInventory = await this.prisma.storeInventory.create({
          data: {
            storeId: managerStoreId,
            productId: productId,
            quantity: productData.stock !== undefined ? Number(productData.stock) : (product.stock || 0),
            minStock: productData.minStock !== undefined ? Number(productData.minStock) : (product.minStock || 0)
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                category: true,
                description: true,
                imageUrl: true,
                imageUrls: true
              }
            },
            store: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        return {
          ...newInventory.product,
          stock: newInventory.quantity,
          minStock: newInventory.minStock,
          store: newInventory.store,
          storeId: newInventory.store.id,
          availableViaStoreInventory: true
        };
      } catch (createError: any) {
        // Se o erro for de registro duplicado, tentar buscar novamente
        if (createError.code === 'P2002') {
          const existingInventory = await this.prisma.storeInventory.findUnique({
            where: {
              storeId_productId: {
                storeId: managerStoreId,
                productId: productId
              }
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  category: true,
                  description: true,
                  imageUrl: true,
                  imageUrls: true
                }
              },
              store: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
          
          if (existingInventory) {
            // Atualizar o StoreInventory existente
            const updatedInventory = await this.prisma.storeInventory.update({
              where: {
                storeId_productId: {
                  storeId: managerStoreId,
                  productId: productId
                }
              },
              data: {
                quantity: productData.stock !== undefined ? Number(productData.stock) : existingInventory.quantity,
                minStock: productData.minStock !== undefined ? Number(productData.minStock) : existingInventory.minStock
              },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    category: true,
                    description: true,
                    imageUrl: true,
                    imageUrls: true
                  }
                },
                store: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            });
            
            return {
              ...updatedInventory.product,
              stock: updatedInventory.quantity,
              minStock: updatedInventory.minStock,
              store: updatedInventory.store,
              storeId: updatedInventory.store.id,
              availableViaStoreInventory: true
            };
          }
        }
        
        // Se chegou aqui, não conseguiu criar nem encontrar o StoreInventory
        // Tentar criar novamente com valores padrão
        try {
          const fallbackInventory = await this.prisma.storeInventory.create({
            data: {
              storeId: managerStoreId,
              productId: productId,
              quantity: 0,
              minStock: 0
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  category: true,
                  description: true,
                  imageUrl: true,
                  imageUrls: true
                }
              },
              store: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
          
          // Atualizar com os dados do productData se fornecidos
          if (productData.stock !== undefined || productData.minStock !== undefined) {
            const updated = await this.prisma.storeInventory.update({
              where: {
                storeId_productId: {
                  storeId: managerStoreId,
                  productId: productId
                }
              },
              data: {
                quantity: productData.stock !== undefined ? Number(productData.stock) : 0,
                minStock: productData.minStock !== undefined ? Number(productData.minStock) : 0
              },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    category: true,
                    description: true,
                    imageUrl: true,
                    imageUrls: true
                  }
                },
                store: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            });
            
            return {
              ...updated.product,
              stock: updated.quantity,
              minStock: updated.minStock,
              store: updated.store,
              storeId: updated.store.id,
              availableViaStoreInventory: true
            };
          }
          
          return {
            ...fallbackInventory.product,
            stock: fallbackInventory.quantity,
            minStock: fallbackInventory.minStock,
            store: fallbackInventory.store,
            storeId: fallbackInventory.store.id,
            availableViaStoreInventory: true
          };
        } catch (finalError: any) {
          throw new ForbiddenException(
            'Você só pode editar produtos da sua própria loja. ' +
            'Este produto não está disponível na sua loja. Entre em contato com o administrador.'
          );
        }
      }
    }

    // Se o produto está no StoreInventory da loja, atualizar o StoreInventory em vez do produto principal
    // Isso mantém os 90 produtos originais e permite estoques independentes por loja
    if (isProductInStoreInventory && !isProductInManagerStore) {
      // Atualizar o StoreInventory da loja (não afeta outras lojas)
      const updatedInventory = await this.prisma.storeInventory.update({
        where: {
          storeId_productId: {
            storeId: managerStoreId,
            productId: productId
          }
        },
        data: {
          quantity: productData.stock !== undefined ? Number(productData.stock) : storeInventory.quantity,
          minStock: productData.minStock !== undefined ? Number(productData.minStock) : storeInventory.minStock
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              category: true,
              description: true,
              imageUrl: true,
              imageUrls: true
            }
          },
          store: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Retornar o produto com o estoque atualizado do StoreInventory
      return {
        ...updatedInventory.product,
        stock: updatedInventory.quantity,
        minStock: updatedInventory.minStock,
        store: updatedInventory.store,
        storeId: updatedInventory.store.id,
        availableViaStoreInventory: true
      };
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: productData,
      include: {
        store: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } }
      }
    });

    // Garantir que o stock seja retornado corretamente
    // Se o produto retornado não tiver stock, usar o valor que foi enviado
    if (updatedProduct.stock === undefined || updatedProduct.stock === null) {
      updatedProduct.stock = productData.stock;
    }

    return updatedProduct;
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
        averageOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0
      }
    };
  }

  // ==================== PEDIDOS ONLINE DA LOJA ====================

  async getStoreOnlineOrders(managerId: string, page: number = 1, limit: number = 50, status?: string) {
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

  async getStoreOnlineOrderById(managerId: string, orderId: string) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const order = await this.prisma.sale.findFirst({
      where: {
        id: orderId,
        isOnlineOrder: true,
        storeId: manager.store.id
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

  async updateStoreOnlineOrderStatus(managerId: string, orderId: string, status: string, trackingCode?: string) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const order = await this.prisma.sale.findFirst({
      where: {
        id: orderId,
        isOnlineOrder: true,
        storeId: manager.store.id
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

  // ==================== ESTOQUE POR LOJA (Delega para AdminService) ====================

  async getStoreInventory(storeId: string) {
    // Verificar se o gerente tem acesso a esta loja
    return this.adminService.getStoreInventory(storeId);
  }

  async updateStoreInventory(storeId: string, productId: string, inventoryData: {
    quantity?: number;
    minStock?: number;
    maxStock?: number;
    location?: string;
    notes?: string;
  }) {
    return this.adminService.updateStoreInventory(storeId, productId, inventoryData);
  }

  async addProductToStore(storeId: string, productId: string, initialQuantity: number = 0, minStock: number = 0) {
    return this.adminService.addProductToStore(storeId, productId, initialQuantity, minStock);
  }

  async removeProductFromStore(storeId: string, productId: string) {
    return this.adminService.removeProductFromStore(storeId, productId);
  }

  // ==================== GESTÃO DE ATESTADOS MÉDICOS ====================

  async createMedicalCertificate(managerId: string, createDto: CreateMedicalCertificateDto) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    // Verificar se o funcionário existe e pertence à mesma loja
    const employee = await this.prisma.user.findUnique({
      where: { id: createDto.employeeId },
      include: { store: true }
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    // Verificar se o funcionário pertence à mesma loja do gerente
    if (employee.storeId !== manager.store.id) {
      throw new ForbiddenException('Você só pode registrar atestados para funcionários da sua própria loja');
    }

    // Verificar se o funcionário é um funcionário (não cliente)
    if (employee.role === UserRole.CUSTOMER) {
      throw new BadRequestException('Não é possível registrar atestado para clientes');
    }

    // Validar datas
    const startDate = new Date(createDto.startDate);
    const endDate = new Date(createDto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Data de início deve ser anterior à data de fim');
    }

    // Criar atestado e inativar funcionário em uma transação
    const result = await this.prisma.$transaction(async (tx) => {
      // Criar o atestado
      const certificate = await tx.medicalCertificate.create({
        data: {
          employeeId: createDto.employeeId,
          startDate: startDate,
          endDate: endDate,
          type: createDto.type as MedicalCertificateType,
          reason: createDto.reason,
          doctorName: createDto.doctorName,
          doctorCrm: createDto.doctorCrm,
          clinicName: createDto.clinicName,
          status: (createDto.status || MedicalCertificateStatus.APPROVED) as MedicalCertificateStatus,
          notes: createDto.notes,
          attachmentUrl: createDto.attachmentUrl,
          registeredById: managerId,
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
            }
          },
          registeredBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      // Inativar funcionário se o atestado estiver aprovado e ainda estiver no período
      if (certificate.status === MedicalCertificateStatus.APPROVED) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDateOnly = new Date(endDate);
        endDateOnly.setHours(23, 59, 59, 999);

        // Se o período do atestado ainda não terminou, inativar o funcionário
        if (today <= endDateOnly) {
          await tx.user.update({
            where: { id: createDto.employeeId },
            data: { isActive: false }
          });
        }
      }

      return certificate;
    });

    return result;
  }

  async getMedicalCertificates(managerId: string, employeeId?: string) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const where: any = {
      employee: {
        storeId: manager.store.id
      }
    };

    if (employeeId) {
      // Verificar se o funcionário pertence à mesma loja
      const employee = await this.prisma.user.findUnique({
        where: { id: employeeId }
      });

      if (!employee || employee.storeId !== manager.store.id) {
        throw new ForbiddenException('Funcionário não pertence à sua loja');
      }

      where.employeeId = employeeId;
    }
    
    return this.prisma.medicalCertificate.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        registeredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getMedicalCertificateById(managerId: string, id: string) {
    // Verificar se o gerente tem uma loja atribuída
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      include: { store: true }
    });

    if (!manager || !manager.store) {
      throw new NotFoundException('Gerente não encontrado ou sem loja atribuída');
    }

    const certificate = await this.prisma.medicalCertificate.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            store: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        registeredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!certificate) {
      throw new NotFoundException('Atestado não encontrado');
    }

    // Verificar se o funcionário pertence à mesma loja do gerente
    if (certificate.employee.store?.id !== manager.store.id) {
      throw new ForbiddenException('Você só pode visualizar atestados de funcionários da sua própria loja');
    }

    return certificate;
  }
}
