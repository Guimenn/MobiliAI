import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Sale, SaleStatus, SaleItem, Product, User, UserRole } from '@prisma/client';
import { CreateSaleDto, UpdateSaleDto } from '../dto/sale.dto';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(createSaleDto: CreateSaleDto, currentUser: User): Promise<Sale> {
    // Apenas funcionários podem criar vendas
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    // Verificar se o cliente existe (se fornecido)
    if (createSaleDto.customerId) {
      const customer = await this.prisma.user.findUnique({ where: { id: createSaleDto.customerId } });
      if (!customer) {
        throw new NotFoundException('Cliente não encontrado');
      }
    }

    // Verificar se todos os produtos existem e têm estoque suficiente
    for (const item of createSaleDto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new NotFoundException(`Produto ${item.productId} não encontrado`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para o produto ${product.name}`);
      }
    }

    // Gerar número da venda
    const saleNumber = await this.generateSaleNumber();

    // Criar a venda com transação
    return this.prisma.$transaction(async (tx) => {
      // Criar a venda
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          totalAmount: createSaleDto.totalAmount,
          discount: createSaleDto.discount || 0,
          tax: createSaleDto.tax || 0,
          status: 'PENDING' as any,
          paymentMethod: (createSaleDto.paymentMethod || 'CASH') as any,
          paymentReference: createSaleDto.paymentReference,
          notes: createSaleDto.notes,
          customerId: createSaleDto.customerId,
          employeeId: currentUser.id,
          storeId: createSaleDto.storeId,
        },
      });

      // Criar os itens da venda e atualizar estoque
      for (const item of createSaleDto.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        
        await tx.saleItem.create({
          data: {
            ...item,
            saleId: sale.id,
            totalPrice: item.quantity * item.unitPrice,
          },
        });

        // Atualizar estoque
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: product!.stock - item.quantity,
          },
        });
      }

      // Retornar a venda completa
      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          customer: true,
          employee: true,
          store: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async findAll(currentUser: User, storeId?: string): Promise<Sale[]> {
    const whereCondition: any = {};

    // Se não for admin, filtrar por loja
    if (currentUser.role !== UserRole.ADMIN) {
      whereCondition.storeId = currentUser.storeId;
    } else if (storeId) {
      whereCondition.storeId = storeId;
    }

    return this.prisma.sale.findMany({
      where: whereCondition,
      include: {
        customer: true,
        employee: true,
        store: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUser: User): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        employee: true,
        store: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    // Verificar se o usuário tem acesso à venda
    if (currentUser.role !== UserRole.ADMIN && sale.storeId !== currentUser.storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    return sale;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto, currentUser: User): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({ where: { id } });
    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    // Verificar se o usuário tem acesso à venda
    if (currentUser.role !== UserRole.ADMIN && sale.storeId !== currentUser.storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    // Apenas funcionários podem editar vendas
    if (currentUser.role === UserRole.CUSTOMER) {
      throw new ForbiddenException('Acesso negado');
    }

    await this.prisma.sale.update({
      where: { id },
      data: updateSaleDto as any,
    });
    return this.findOne(id, currentUser);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    // Verificar se o usuário tem acesso à venda
    if (currentUser.role !== UserRole.ADMIN && sale.storeId !== currentUser.storeId) {
      throw new ForbiddenException('Acesso negado');
    }

    // Apenas admins podem deletar vendas
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso negado');
    }

    // Restaurar estoque dos produtos
    for (const item of sale.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: product.stock + item.quantity,
          },
        });
      }
    }

    await this.prisma.sale.update({
      where: { id },
      data: { status: 'CANCELLED' as SaleStatus },
    });
  }

  async getSalesByCustomer(customerId: string, currentUser: User): Promise<Sale[]> {
    // Verificar se o usuário tem acesso aos dados do cliente
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== customerId) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.prisma.sale.findMany({
      where: { customerId },
      include: {
        store: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSalesByDateRange(startDate: Date, endDate: Date, currentUser: User, storeId?: string): Promise<Sale[]> {
    const whereCondition: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Se não for admin, filtrar por loja
    if (currentUser.role !== UserRole.ADMIN) {
      whereCondition.storeId = currentUser.storeId;
    } else if (storeId) {
      whereCondition.storeId = storeId;
    }

    return this.prisma.sale.findMany({
      where: whereCondition,
      include: {
        customer: true,
        employee: true,
        store: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async generateSaleNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const prefix = `${year}${month}${day}`;
    
    // Buscar a última venda do dia
    const lastSale = await this.prisma.sale.findFirst({
      where: {
        saleNumber: {
          startsWith: prefix,
        },
      },
      orderBy: { saleNumber: 'desc' },
    });

    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.saleNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }
}