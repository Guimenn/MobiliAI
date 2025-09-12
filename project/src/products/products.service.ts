import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product, ProductCategory, User, UserRole } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
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

  async findAll(currentUser: User, storeId?: string): Promise<Product[]> {
    const whereCondition: any = { isActive: true };

    // Se não for admin, filtrar por loja
    if (currentUser.role !== UserRole.ADMIN) {
      whereCondition.storeId = currentUser.storeId;
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

    // Se não for admin, filtrar por loja
    if (currentUser.role !== UserRole.ADMIN) {
      whereCondition.storeId = currentUser.storeId;
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

    // Se não for admin, filtrar por loja
    if (currentUser.role !== UserRole.ADMIN) {
      whereCondition.storeId = currentUser.storeId;
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

    // Se não for admin, filtrar por loja
    if (currentUser.role !== UserRole.ADMIN) {
      whereCondition.storeId = currentUser.storeId;
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
}