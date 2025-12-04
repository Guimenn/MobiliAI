import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product, ProductCategory, User, UserRole } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  /**
   * Valida se o usuário tem permissão para gerenciar ofertas
   * Apenas ADMIN ou STORE_MANAGER da loja específica podem gerenciar ofertas
   */
  private validateSalePermission(currentUser: User, storeId: string | null | undefined): void {
    // Se não tem storeId, usar o storeId do usuário
    const storeIdForValidation = storeId || currentUser.storeId || '';
    
    const canManageSales = 
      currentUser.role === UserRole.ADMIN || 
      (currentUser.role === UserRole.STORE_MANAGER && currentUser.storeId === storeIdForValidation);
    
    if (!canManageSales) {
      throw new ForbiddenException('Apenas administradores ou gerentes da loja podem gerenciar ofertas');
    }
  }

  /**
   * Valida se há campos de oferta no DTO e verifica permissões
   */
  private validateSaleFields(dto: CreateProductDto | UpdateProductDto, currentUser: User, storeId: string | null | undefined): void {
    // Verificar se há campos de oferta com valores definidos (não undefined e não null)
    const hasSaleFields = 
      (dto.isOnSale !== undefined && dto.isOnSale !== null) || 
      (dto.salePrice !== undefined && dto.salePrice !== null) || 
      (dto.saleDiscountPercent !== undefined && dto.saleDiscountPercent !== null) ||
      (dto.saleStartDate !== undefined && dto.saleStartDate !== null) || 
      (dto.saleEndDate !== undefined && dto.saleEndDate !== null) ||
      (dto.isFlashSale !== undefined && dto.isFlashSale !== null) || 
      (dto.flashSalePrice !== undefined && dto.flashSalePrice !== null) || 
      (dto.flashSaleDiscountPercent !== undefined && dto.flashSaleDiscountPercent !== null) ||
      (dto.flashSaleStartDate !== undefined && dto.flashSaleStartDate !== null) || 
      (dto.flashSaleEndDate !== undefined && dto.flashSaleEndDate !== null);

    if (hasSaleFields) {
      // Se não tem storeId, usar o storeId do usuário
      const storeIdForValidation = storeId || currentUser.storeId || '';
      this.validateSalePermission(currentUser, storeIdForValidation);
    }
  }

  async create(createProductDto: CreateProductDto, currentUser: User): Promise<Product> {
    // Apenas funcionários podem criar produtos
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    // Validar permissões para campos de oferta
    this.validateSaleFields(createProductDto, currentUser, createProductDto.storeId);

    // Converter datas de string para Date se necessário
    const data: any = { ...createProductDto };
    if (data.saleStartDate) data.saleStartDate = new Date(data.saleStartDate);
    if (data.saleEndDate) data.saleEndDate = new Date(data.saleEndDate);
    if (data.flashSaleStartDate) data.flashSaleStartDate = new Date(data.flashSaleStartDate);
    if (data.flashSaleEndDate) data.flashSaleEndDate = new Date(data.flashSaleEndDate);

    return this.prisma.product.create({
      data,
    });
  }

  async createWithImages(createProductDto: CreateProductDto, files: Express.Multer.File[], currentUser: User): Promise<Product> {
    // Apenas funcionários podem criar produtos
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    // Validar permissões para campos de oferta
    this.validateSaleFields(createProductDto, currentUser, createProductDto.storeId);

    // Converter datas de string para Date se necessário
    const data: any = { ...createProductDto };
    if (data.saleStartDate) data.saleStartDate = new Date(data.saleStartDate);
    if (data.saleEndDate) data.saleEndDate = new Date(data.saleEndDate);
    if (data.flashSaleStartDate) data.flashSaleStartDate = new Date(data.flashSaleStartDate);
    if (data.flashSaleEndDate) data.flashSaleEndDate = new Date(data.flashSaleEndDate);

    // Criar produto primeiro
    const product = await this.prisma.product.create({
      data,
    });

    // Se há imagens, fazer upload
    if (files && files.length > 0) {
      const imageUrls = await this.uploadService.uploadMultipleProductImages(files, product.id);
      
      // Atualizar produto com as imagens
      await this.prisma.product.update({
        where: { id: product.id },
        data: { 
          imageUrls,
          imageUrl: imageUrls[0] // Primeira imagem como principal
        },
      });

      return this.findOne(product.id, currentUser);
    }

    return product;
  }

  async findAll(currentUser: User, storeId?: string): Promise<Product[]> {
    const whereCondition: any = { isActive: true };

    // Determinar loja alvo
    const targetStoreId = storeId || currentUser.storeId;

    // Se não for admin, filtrar por loja via StoreInventory
    // Um produto pode estar em múltiplas lojas de duas formas:
    // 1. storeId direto = loja principal do produto
    // 2. StoreInventory = produto também disponível em outras lojas
    if (currentUser.role !== UserRole.ADMIN) {
      if (targetStoreId) {
        // Produtos que têm storeId direto OU estão em StoreInventory da loja
        whereCondition.OR = [
          { storeId: targetStoreId }, // Produtos com esta loja como principal
          { storeInventory: { some: { storeId: targetStoreId } } } // Produtos disponíveis nesta loja via StoreInventory
        ];
      }
    } else if (storeId) {
      // Admin pode filtrar por loja específica se passar storeId
      whereCondition.OR = [
        { storeId: storeId },
        { storeInventory: { some: { storeId: storeId } } }
      ];
    }
    // Se for admin e não passar storeId, mostra todos os produtos (não adiciona storeId ao where)

    // Se for admin sem storeId, buscar TODOS os StoreInventory para mostrar estoque por filial
    const includeStoreInventory = currentUser.role === UserRole.ADMIN && !storeId
      ? {
          select: {
            id: true,
            quantity: true,
            storeId: true,
            store: {
              select: {
                id: true,
                name: true,
                address: true
              }
            }
          }
        }
      : targetStoreId ? {
          where: { storeId: targetStoreId },
          select: {
            storeId: true,
            quantity: true,
            minStock: true,
            store: {
              select: {
                id: true,
                name: true
              }
            }
          }
        } : false;

    const products = await this.prisma.product.findMany({
      where: whereCondition,
      include: {
        store: true,
        storeInventory: includeStoreInventory
      },
      orderBy: { name: 'asc' },
    });

    // Processar produtos para usar estoque do StoreInventory quando disponível
    return products.map((product: any) => {
      // Se for admin sem storeId, mostrar estoque total e lista por filial
      if (currentUser.role === UserRole.ADMIN && !storeId && product.storeInventory && product.storeInventory.length > 0) {
        const totalStock = product.storeInventory.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0);
        const stockByStore = product.storeInventory.map((inv: any) => ({
          storeId: inv.storeId,
          storeName: inv.store?.name || 'Loja desconhecida',
          quantity: inv.quantity || 0
        }));

        return {
          ...product,
          stock: totalStock, // Estoque total (soma de todas as lojas)
          stockByStore: stockByStore, // Lista de estoques por filial
          storeId: product.store?.id || product.storeId,
        };
      }
      
      // LÓGICA: Um produto pode estar em múltiplas lojas de duas formas:
      // 1. storeId direto = loja principal do produto (usa product.stock)
      // 2. StoreInventory = produto também disponível em outras lojas (usa StoreInventory.quantity)
      // IMPORTANTE: Se o produto tem StoreInventory para a loja, SEMPRE priorizar StoreInventory.quantity
      // mesmo que o produto também tenha storeId === targetStoreId
      
      // Verificar se o produto está disponível na loja solicitada via StoreInventory
      // O storeInventory já está filtrado pela query quando targetStoreId existe
      const inventoryForStore = product.storeInventory && product.storeInventory.length > 0
        ? product.storeInventory.find(inv => inv.storeId === targetStoreId) || product.storeInventory[0]
        : null;
      
      // PRIORIDADE: Se o produto tem StoreInventory para esta loja, SEMPRE usar StoreInventory.quantity
      // Isso garante consistência entre frontend e backend
      if (inventoryForStore) {
        return {
          ...product,
          stock: Number(inventoryForStore.quantity) || 0,
          store: inventoryForStore.store || product.store,
          storeId: inventoryForStore.store?.id || targetStoreId,
        };
      }
      
      // Se o produto tem storeId da loja solicitada (sem StoreInventory), usar stock do produto
      if (product.storeId === targetStoreId) {
        return {
          ...product,
          stock: Number(product.stock) || 0,
          storeId: product.store?.id || product.storeId,
        };
      }
      
      // Se não está na loja solicitada nem via storeId nem via StoreInventory, não retornar
      // (já filtrado no where, mas garantindo)
      // Se chegou aqui, significa que o produto foi encontrado no where mas não tem estoque definido
      // Retornar com estoque 0 para evitar que o produto seja perdido
      return {
        ...product,
        stock: 0,
        storeId: product.store?.id || product.storeId || targetStoreId,
      };
    });
  }

  async findOne(id: string, currentUser: User): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
        storeInventory: currentUser.storeId ? {
          where: { storeId: currentUser.storeId },
          select: {
            storeId: true,
            quantity: true,
            minStock: true
          }
        } : false
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Se for admin, permitir sempre
    if (currentUser.role === UserRole.ADMIN) {
      return product;
    }

    // Verificar se o produto está disponível para a loja do usuário
    const productStoreId = product.storeId;
    const userStoreId = currentUser.storeId;
    const isProductInStore = productStoreId === userStoreId;
    const isProductInStoreInventory = product.storeInventory && product.storeInventory.length > 0;

    if (!isProductInStore && !isProductInStoreInventory) {
      throw new ForbiddenException('Acesso negado - produto não disponível na sua loja');
    }

    // Se o produto está via StoreInventory, retornar com o estoque do StoreInventory
    if (isProductInStoreInventory && !isProductInStore) {
      const inventory = product.storeInventory[0];
      return {
        ...product,
        stock: inventory.quantity || 0,
        minStock: inventory.minStock || product.minStock || 0,
        storeId: userStoreId
      } as any;
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, currentUser: User): Promise<Product> {
    const product = await this.prisma.product.findUnique({ 
      where: { id },
      include: {
        storeInventory: currentUser.storeId ? {
          where: { storeId: currentUser.storeId },
          select: {
            storeId: true,
            quantity: true,
            minStock: true
          }
        } : false
      }
    });
    
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Se for admin, permitir sempre
    if (currentUser.role === UserRole.ADMIN) {
      // Admin pode editar qualquer produto
    } else if (!currentUser.storeId) {
      // Se o usuário não tem loja, negar acesso
      throw new ForbiddenException('Acesso negado - usuário sem loja atribuída');
    } else {
      // Verificar se o produto está disponível para a loja do usuário
      const productStoreId = product.storeId;
      const userStoreId = currentUser.storeId;
      const isProductInStore = productStoreId === userStoreId;
      const isProductInStoreInventory = product.storeInventory && product.storeInventory.length > 0;

      if (!isProductInStore && !isProductInStoreInventory) {
        // Produto não está na loja do usuário nem via StoreInventory
        throw new ForbiddenException('Você só pode editar produtos da sua própria loja');
      }
    }

    // Apenas funcionários podem editar produtos
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    // Validar permissões para campos de oferta APENAS se houver campos de oferta sendo atualizados
    // Remover campos undefined/null do DTO antes de validar
    const cleanUpdateDto: any = {};
    Object.keys(updateProductDto || {}).forEach(key => {
      const value = (updateProductDto as any)[key];
      if (value !== undefined && value !== null) {
        cleanUpdateDto[key] = value;
      }
    });
    
    // Usar o storeId do produto se existir, senão usar o storeId do usuário (que será atribuído)
    const storeIdForValidation = product.storeId || currentUser.storeId || '';
    this.validateSaleFields(cleanUpdateDto, currentUser, storeIdForValidation);

    // Converter datas de string para Date se necessário
    // Usar o DTO limpo (sem campos undefined/null)
    const data: any = { ...cleanUpdateDto };
    if (data.saleStartDate) data.saleStartDate = new Date(data.saleStartDate);
    if (data.saleEndDate) data.saleEndDate = new Date(data.saleEndDate);
    if (data.flashSaleStartDate) data.flashSaleStartDate = new Date(data.flashSaleStartDate);
    if (data.flashSaleEndDate) data.flashSaleEndDate = new Date(data.flashSaleEndDate);

    // Se o produto está disponível via StoreInventory e o usuário está atualizando estoque,
    // atualizar o StoreInventory.quantity em vez do product.stock
    const isProductInStoreInventory = product.storeInventory && product.storeInventory.length > 0;
    const isProductInStore = product.storeId === currentUser.storeId;
    const isUpdatingStock = 'stock' in data || 'minStock' in data;

    if (isUpdatingStock && !isProductInStore && isProductInStoreInventory && currentUser.storeId) {
      // Produto está via StoreInventory, atualizar StoreInventory.quantity
      const storeInventory = product.storeInventory[0];
      
      if ('stock' in data) {
        await this.prisma.storeInventory.update({
          where: {
            storeId_productId: {
              storeId: currentUser.storeId,
              productId: id
            }
          },
          data: {
            quantity: data.stock
          }
        });
        // Remover stock do data para não atualizar o product.stock
        delete data.stock;
      }

      if ('minStock' in data) {
        await this.prisma.storeInventory.update({
          where: {
            storeId_productId: {
              storeId: currentUser.storeId,
              productId: id
            }
          },
          data: {
            minStock: data.minStock
          }
        });
        // Remover minStock do data para não atualizar o product.minStock
        delete data.minStock;
      }

    }

    // Atualizar o produto (sem stock/minStock se foi atualizado via StoreInventory)
    if (Object.keys(data).length > 0) {
      await this.prisma.product.update({
        where: { id },
        data,
      });
    }

    return this.findOne(id, currentUser);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o usuário tem acesso ao produto
    if (currentUser.role !== UserRole.ADMIN && product.storeId !== currentUser.storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    // Apenas funcionários podem deletar produtos
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findByCategory(category: ProductCategory, currentUser: User, storeId?: string): Promise<Product[]> {
    const whereCondition: any = { category, isActive: true };

    // Se não for admin, filtrar por loja (apenas se tiver storeId)
    if (currentUser.role !== UserRole.ADMIN) {
      if (currentUser.storeId) {
        whereCondition.storeId = currentUser.storeId;
      }
    } else if (storeId) {
      whereCondition.storeId = storeId;
    }

    return this.prisma.product.findMany({
      where: whereCondition,
      include: {
        store: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByColor(color: string, currentUser: User, storeId?: string): Promise<Product[]> {
    const whereCondition: any = { color, isActive: true };

    // Se não for admin, filtrar por loja (apenas se tiver storeId)
    if (currentUser.role !== UserRole.ADMIN) {
      if (currentUser.storeId) {
        whereCondition.storeId = currentUser.storeId;
      }
    } else if (storeId) {
      whereCondition.storeId = storeId;
    }

    return this.prisma.product.findMany({
      where: whereCondition,
      include: {
        store: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateStock(id: string, quantity: number, currentUser: User): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o usuário tem acesso ao produto
    if (currentUser.role !== UserRole.ADMIN && product.storeId !== currentUser.storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    // Apenas funcionários podem atualizar estoque
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      throw new ForbiddenException('Estoque insuficiente');
    }

    await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
    return this.findOne(id, currentUser);
  }

  async getLowStockProducts(currentUser: User, storeId?: string): Promise<Product[]> {
    const whereCondition: any = { isActive: true };

    // Se não for admin, filtrar por loja (apenas se tiver storeId)
    if (currentUser.role !== UserRole.ADMIN) {
      if (currentUser.storeId) {
        whereCondition.storeId = currentUser.storeId;
      }
    } else if (storeId) {
      whereCondition.storeId = storeId;
    }

    // Para o Prisma, vamos usar uma query mais simples
    const products = await this.prisma.product.findMany({
      where: whereCondition,
      include: {
        store: true,
      },
      orderBy: { stock: 'asc' },
    });

    // Filtrar produtos com estoque baixo
    return products.filter(product => product.stock <= product.minStock);
  }

  async uploadProductImage(id: string, file: Express.Multer.File, currentUser: User): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o usuário tem acesso ao produto
    if (currentUser.role !== UserRole.ADMIN && product.storeId !== currentUser.storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    // Apenas funcionários podem fazer upload de imagens
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    // Fazer upload da imagem
    const imageUrl = await this.uploadService.uploadProductImage(file, id);

    // Atualizar produto com a nova imagem
    await this.prisma.product.update({
      where: { id },
      data: { imageUrl },
    });

    return this.findOne(id, currentUser);
  }

  async uploadProductImages(id: string, files: Express.Multer.File[], currentUser: User): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o usuário tem acesso ao produto
    if (currentUser.role !== UserRole.ADMIN && product.storeId !== currentUser.storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    // Apenas funcionários podem fazer upload de imagens
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    // Fazer upload das imagens
    const imageUrls = await this.uploadService.uploadMultipleProductImages(files, id);

    // Combinar com imagens existentes
    const existingImages = product.imageUrls || [];
    const allImageUrls = [...existingImages, ...imageUrls];

    // Atualizar produto com as novas imagens
    await this.prisma.product.update({
      where: { id },
      data: { 
        imageUrls: allImageUrls,
        imageUrl: allImageUrls[0] // Primeira imagem como principal
      },
    });

    return this.findOne(id, currentUser);
  }
}