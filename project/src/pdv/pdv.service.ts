import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateSaleDto } from './dto/create-sale.dto';
import { OpenCashDto } from './dto/open-cash.dto';
import { CloseCashDto } from './dto/close-cash.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PdvService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  // Controle de Caixa Diário
  async openCash(openCashDto: OpenCashDto, userId: string, userStoreId: string) {
    // Verificar se já existe caixa aberto para hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingCash = await this.prisma.dailyCash.findFirst({
      where: {
        storeId: userStoreId,
        date: {
          gte: today,
        },
        isOpen: true,
      },
    });

    if (existingCash) {
      throw new BadRequestException('Já existe um caixa aberto para hoje');
    }

    return this.prisma.dailyCash.create({
      data: {
        openingAmount: openCashDto.openingAmount,
        storeId: userStoreId,
        userId,
        notes: openCashDto.notes,
      },
    });
  }

  async getCurrentCash(userStoreId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.prisma.dailyCash.findFirst({
      where: {
        storeId: userStoreId,
        date: {
          gte: today,
        },
        isOpen: true,
      },
      include: {
        sales: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
        expenses: true,
      },
    });
  }

  async closeCash(closeCashDto: CloseCashDto, userId: string, userStoreId: string) {
    const currentCash = await this.getCurrentCash(userStoreId);
    
    if (!currentCash) {
      throw new NotFoundException('Nenhum caixa aberto encontrado');
    }

    // Calcular totais
    const totalSales = currentCash.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalExpenses = currentCash.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    
    const expectedAmount = Number(currentCash.openingAmount) + totalSales - totalExpenses;
    const difference = Number(closeCashDto.closingAmount) - expectedAmount;

    return this.prisma.dailyCash.update({
      where: { id: currentCash.id },
      data: {
        closingAmount: closeCashDto.closingAmount,
        totalSales,
        totalExpenses,
        isOpen: false,
        notes: closeCashDto.notes,
      },
    });
  }

  // Vendas
  async createSale(createSaleDto: CreateSaleDto, userId: string, userStoreId: string) {
    // Verificar se há caixa aberto
    const currentCash = await this.getCurrentCash(userStoreId);
    if (!currentCash) {
      throw new BadRequestException('Não há caixa aberto. Abra o caixa antes de realizar vendas.');
    }

    // Verificar produtos e estoque
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: createSaleDto.items.map(item => item.productId) },
        storeId: userStoreId,
        isActive: true,
      },
    });

    if (products.length !== createSaleDto.items.length) {
      throw new BadRequestException('Alguns produtos não foram encontrados ou estão inativos');
    }

    // Verificar estoque
    for (const item of createSaleDto.items) {
      const product = products.find(p => p.id === item.productId);
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para o produto ${product.name}`);
      }
    }

    // Calcular total
    const totalAmount = createSaleDto.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (Number(product.price) * item.quantity);
    }, 0);

    // Determinar status baseado no método de pagamento
    // Vendas físicas devem ser COMPLETED, exceto cartão de crédito (PENDING para pagamento posterior)
    const saleStatus = createSaleDto.paymentMethod === 'CREDIT_CARD' ? 'PENDING' : 'COMPLETED';

    // Criar venda
    const sale = await this.prisma.sale.create({
      data: {
        saleNumber: await this.generateSaleNumber(userStoreId),
        totalAmount,
        discount: createSaleDto.discount || 0,
        tax: createSaleDto.tax || 0,
        status: saleStatus,
        paymentMethod: createSaleDto.paymentMethod,
        paymentReference: createSaleDto.paymentReference,
        notes: createSaleDto.notes,
        customerId: createSaleDto.customerId,
        employeeId: userId,
        storeId: userStoreId,
        dailyCashId: currentCash.id,
        items: {
          create: createSaleDto.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: Number(product.price),
              totalPrice: Number(product.price) * item.quantity,
              notes: item.notes,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            name: true,
          },
        },
      },
    });

    // Armazenar informações dos produtos para verificação posterior
    const productsToCheck: Array<{ id: string; name: string; stock: number; minStock: number; storeName?: string }> = [];

    // Atualizar estoque
    for (const item of createSaleDto.items) {
      // Buscar produto antes de atualizar
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { store: { select: { name: true } } }
      });

      if (!product) {
        continue;
      }

      // Calcular novo estoque
      const newStock = product.stock - item.quantity;

      // Atualizar estoque
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: newStock,
        },
      });

      // Armazenar informações do produto para verificação posterior
      productsToCheck.push({
        id: product.id,
        name: product.name,
        stock: newStock,
        minStock: product.minStock || 0,
        storeName: product.store?.name
      });
    }

    // Atualizar total de vendas do caixa
    await this.prisma.dailyCash.update({
      where: { id: currentCash.id },
      data: {
        totalSales: {
          increment: totalAmount,
        },
      },
    });

    // Notificar usuários relevantes sobre nova venda (assíncrono, não bloqueia a resposta)
    setImmediate(async () => {
      try {
        // Notificar ADMINs, MANAGERs e EMPLOYEEs relevantes
        await this.notificationsService.notifyRelevantUsersNewSale(
          sale.id,
          sale.saleNumber,
          Number(totalAmount),
          userStoreId,
          userId,
          sale.customer?.name,
          sale.store?.name
        );

        // Verificar estoque dos produtos vendidos e notificar se necessário
        for (const productInfo of productsToCheck) {
          // Se o estoque zerou após a venda
          if (productInfo.stock === 0) {
            await this.notificationsService.notifyRelevantUsersOutOfStock(
              productInfo.id,
              productInfo.name,
              userStoreId,
              productInfo.storeName
            );
          }
          // Se o estoque está abaixo do mínimo
          else if (productInfo.stock > 0 && productInfo.stock <= productInfo.minStock) {
            await this.notificationsService.notifyRelevantUsersLowStock(
              productInfo.id,
              productInfo.name,
              productInfo.stock,
              productInfo.minStock,
              userStoreId,
              productInfo.storeName
            );
          }
        }
      } catch (error) {
        console.error('Erro ao notificar usuários sobre nova venda no PDV:', error);
      }
    });

    return sale;
  }

  async getSales(userStoreId: string, userRole: UserRole, startDate?: Date, endDate?: Date) {
    // Apenas usuários da mesma loja podem ver as vendas
    const whereClause: any = {
      storeId: userStoreId,
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.sale.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        employee: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSalesReport(userStoreId: string, userRole: UserRole, startDate: Date, endDate: Date) {
    const sales = await this.getSales(userStoreId, userRole, startDate, endDate);
    
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalDiscounts = sales.reduce((sum, sale) => sum + Number(sale.discount), 0);
    const totalTaxes = sales.reduce((sum, sale) => sum + Number(sale.tax), 0);
    
    const salesByPaymentMethod = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + Number(sale.totalAmount);
      return acc;
    }, {});

    const topProducts = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          storeId: userStoreId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc',
        },
      },
      take: 10,
    });

    return {
      period: { startDate, endDate },
      summary: {
        totalSales,
        totalDiscounts,
        totalTaxes,
        netSales: totalSales - totalDiscounts + totalTaxes,
        totalTransactions: sales.length,
      },
      salesByPaymentMethod,
      topProducts,
    };
  }

  private async generateSaleNumber(storeId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const lastSale = await this.prisma.sale.findFirst({
      where: {
        storeId,
        saleNumber: {
          startsWith: dateStr,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.saleNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${dateStr}${sequence.toString().padStart(4, '0')}`;
  }
}

