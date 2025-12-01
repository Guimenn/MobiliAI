import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateCashFlowDto } from './dto/create-cash-flow.dto';
import { CreateCashExpenseDto } from './dto/create-cash-expense.dto';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  // Fluxo de Caixa
  async createCashFlow(createCashFlowDto: CreateCashFlowDto, userId: string, userStoreId: string, userRole: UserRole) {
    // Apenas ADMIN e STORE_MANAGER podem criar fluxo de caixa
    if (![UserRole.ADMIN, UserRole.STORE_MANAGER].includes(userRole as any)) {
      throw new ForbiddenException('Acesso negado');
    }

    const data: any = {
        ...createCashFlowDto,
        storeId: userStoreId,
        userId,
    };

    // Converter date string para Date se fornecido
    if (createCashFlowDto.date) {
      data.date = new Date(createCashFlowDto.date);
    }

    return this.prisma.cashFlow.create({
      data,
    });
  }

  async getCashFlow(userStoreId: string, userRole: UserRole, startDate?: Date, endDate?: Date) {
    const whereClause: any = {
      storeId: userStoreId,
    };

    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.cashFlow.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });
  }

  async getCashFlowReport(userStoreId: string, userRole: UserRole, startDate: Date, endDate: Date) {
    const cashFlows = await this.getCashFlow(userStoreId, userRole, startDate, endDate);
    
    const income = cashFlows.filter(cf => cf.type === 'INCOME');
    const expenses = cashFlows.filter(cf => cf.type === 'EXPENSE');
    
    const totalIncome = income.reduce((sum, cf) => sum + Number(cf.amount), 0);
    const totalExpenses = expenses.reduce((sum, cf) => sum + Number(cf.amount), 0);
    
    const incomeByCategory = income.reduce((acc, cf) => {
      acc[cf.category] = (acc[cf.category] || 0) + Number(cf.amount);
      return acc;
    }, {});

    const expensesByCategory = expenses.reduce((acc, cf) => {
      acc[cf.category] = (acc[cf.category] || 0) + Number(cf.amount);
      return acc;
    }, {});

    return {
      period: { startDate, endDate },
      summary: {
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
      },
      incomeByCategory,
      expensesByCategory,
      cashFlows,
    };
  }

  // Despesas de Caixa
  async createCashExpense(createCashExpenseDto: CreateCashExpenseDto, userId: string, userStoreId: string, userRole: UserRole) {
    // Verificar se há caixa aberto
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentCash = await this.prisma.dailyCash.findFirst({
      where: {
        storeId: userStoreId,
        date: {
          gte: today,
        },
        isOpen: true,
      },
    });

    if (!currentCash) {
      throw new NotFoundException('Não há caixa aberto para registrar despesas');
    }

    // Apenas ADMIN, STORE_MANAGER e CASHIER podem criar despesas
    if (![UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER].includes(userRole as any)) {
      throw new ForbiddenException('Acesso negado');
    }

    const expense = await this.prisma.cashExpense.create({
      data: {
        ...createCashExpenseDto,
        dailyCashId: currentCash.id,
        userId,
      },
    });

    // Atualizar total de despesas do caixa
    await this.prisma.dailyCash.update({
      where: { id: currentCash.id },
      data: {
        totalExpenses: {
          increment: Number(createCashExpenseDto.amount),
        },
      },
    });

    return expense;
  }

  async getCashExpenses(userStoreId: string, userRole: UserRole, startDate?: Date, endDate?: Date) {
    const whereClause: any = {
      dailyCash: {
        storeId: userStoreId,
      },
    };

    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.cashExpense.findMany({
      where: whereClause,
      include: {
        dailyCash: {
          select: {
            date: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  // Relatórios Consolidados (apenas para ADMIN)
  async getConsolidatedReport(userRole: UserRole, startDate: Date, endDate: Date) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem acessar relatórios consolidados');
    }

    // Buscar dados de todas as lojas
    const stores = await this.prisma.store.findMany({
      where: { isActive: true },
    });

    const consolidatedData = await Promise.all(
      stores.map(async (store) => {
        const sales = await this.prisma.sale.findMany({
          where: {
            storeId: store.id,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        const cashFlows = await this.prisma.cashFlow.findMany({
          where: {
            storeId: store.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        const totalSales = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
        const totalIncome = cashFlows
          .filter(cf => cf.type === 'INCOME')
          .reduce((sum, cf) => sum + Number(cf.amount), 0);
        const totalExpenses = cashFlows
          .filter(cf => cf.type === 'EXPENSE')
          .reduce((sum, cf) => sum + Number(cf.amount), 0);

        return {
          store: {
            id: store.id,
            name: store.name,
            city: store.city,
          },
          sales: {
            total: totalSales,
            count: sales.length,
          },
          cashFlow: {
            income: totalIncome,
            expenses: totalExpenses,
            net: totalIncome - totalExpenses,
          },
        };
      })
    );

    // Calcular totais consolidados
    const totalSales = consolidatedData.reduce((sum, store) => sum + store.sales.total, 0);
    const totalIncome = consolidatedData.reduce((sum, store) => sum + store.cashFlow.income, 0);
    const totalExpenses = consolidatedData.reduce((sum, store) => sum + store.cashFlow.expenses, 0);

    return {
      period: { startDate, endDate },
      consolidated: {
        totalSales,
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        totalStores: stores.length,
      },
      byStore: consolidatedData,
    };
  }
}
