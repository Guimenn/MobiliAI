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

  async create(createProductDto: CreateProductDto, currentUser: User): Promise<Product> {
    // Apenas funcionários podem criar produtos
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.product.create({
      data: createProductDto as any,
    });
  }

  async createWithImages(createProductDto: CreateProductDto, files: Express.Multer.File[], currentUser: User): Promise<Product> {
    // Apenas funcionários podem criar produtos
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    // Criar produto primeiro
    const product = await this.prisma.product.create({
      data: createProductDto as any,
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

    // Se não for admin, filtrar por loja (apenas se tiver storeId)
    if (currentUser.role !== UserRole.ADMIN) {
      if (currentUser.storeId) {
        whereCondition.storeId = currentUser.storeId;
      }
    } else if (storeId) {
      // Admin pode filtrar por loja específica se passar storeId
      whereCondition.storeId = storeId;
    }
    // Se for admin e não passar storeId, mostra todos os produtos (não adiciona storeId ao where)

    return this.prisma.product.findMany({
      where: whereCondition,
      include: {
        store: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, currentUser: User): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o usuário tem acesso ao produto
    if (currentUser.role !== UserRole.ADMIN && product.storeId !== currentUser.storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, currentUser: User): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o usuário tem acesso ao produto
    if (currentUser.role !== UserRole.ADMIN && product.storeId !== currentUser.storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    // Apenas funcionários podem editar produtos
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    await this.prisma.product.update({
      where: { id },
      data: updateProductDto as any,
    });
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