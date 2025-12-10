import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaleStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStoreOverview(storeId: string) {
    // Buscar dados básicos e estatísticas em paralelo
    const [store, totalEmployees, salesAggregate, timeClocks] = await Promise.all([
      this.prisma.store.findUnique({
        where: { id: storeId }
      }),
      this.prisma.user.count({
        where: { storeId }
      }),
      this.prisma.sale.aggregate({
        where: {
          storeId,
          status: {
            in: [SaleStatus.COMPLETED, SaleStatus.DELIVERED, SaleStatus.PENDING, SaleStatus.PREPARING, SaleStatus.SHIPPED]
          }
        },
        _sum: {
          totalAmount: true
        }
      }),
      this.prisma.timeClock.findMany({
        where: {
          employee: { storeId },
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      })
    ]);

    if (!store) {
      throw new Error('Loja não encontrada');
    }

    const totalTimeClocks = timeClocks.length;

    const totalSales = Number(salesAggregate._sum.totalAmount ?? 0);

    // Taxa de presença aproximada: pontos / (funcionários * 30 dias)
    const attendanceRate =
      totalEmployees > 0 && totalTimeClocks > 0
        ? Math.min(
            100,
            Math.floor((totalTimeClocks / (totalEmployees * 30)) * 100)
          )
        : 0;

    // Horas médias por funcionário (usando campo totalHours quando disponível)
    let averageHours = 0;
    if (totalEmployees > 0 && timeClocks.length > 0) {
      const totalHours = timeClocks.reduce((sum, tc: any) => {
        return sum + Number(tc.totalHours ?? 0);
      }, 0);
      averageHours = totalHours > 0 ? Math.round(totalHours / totalEmployees) : 0;
    }

    return {
      totalSales,
      totalEmployees,
      attendanceRate,
      averageHours,
      storeName: store.name,
      isActive: store.isActive
    };
  }

  async getStoreSales(storeId: string) {
    // Vendas reais dos últimos 6 meses agrupadas por mês
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const sales = await this.prisma.sale.findMany({
      where: {
        storeId,
        createdAt: {
          gte: sixMonthsAgo
        },
        status: {
          in: [SaleStatus.COMPLETED, SaleStatus.DELIVERED, SaleStatus.PENDING, SaleStatus.PREPARING, SaleStatus.SHIPPED]
        }
      },
      select: {
        createdAt: true,
        totalAmount: true,
        customerId: true
      }
    });

    // Criar buckets mensais
    const dataMap: Record<
      string,
      { name: string; vendas: number; clientes: Set<string> }
    > = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleString('pt-BR', { month: 'short' });
      dataMap[key] = { name: label, vendas: 0, clientes: new Set() };
    }

    sales.forEach((sale) => {
      const d = new Date(sale.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!dataMap[key]) {
        const label = d.toLocaleString('pt-BR', { month: 'short' });
        dataMap[key] = { name: label, vendas: 0, clientes: new Set() };
      }
      dataMap[key].vendas += Number(sale.totalAmount ?? 0);
      if (sale.customerId) {
        dataMap[key].clientes.add(sale.customerId);
      }
    });

    const salesData = Object.values(dataMap).map((m) => ({
      name: m.name,
      vendas: m.vendas,
      clientes: m.clientes.size
    }));

    return salesData;
  }

  async getStoreAttendance(storeId: string) {
    // Buscar dados reais de frequência dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const timeClocks = await this.prisma.timeClock.findMany({
      where: {
        employee: { storeId },
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      include: { employee: true }
    });

    // Agrupar por dia da semana
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    const attendanceData = days.map(day => {
      const dayTimeClocks = timeClocks.filter(tc => {
        const dayOfWeek = new Date(tc.createdAt).getDay();
        const dayMap = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex' };
        return dayMap[dayOfWeek] === day;
      });

      const presenca = dayTimeClocks.length;
      const atrasos = dayTimeClocks.filter(tc => tc.minutesLate && tc.minutesLate > 0).length;

      return {
        name: day,
        presenca,
        atrasos
      };
    });

    return attendanceData;
  }

  async getEmployeePerformance(storeId: string) {
    // Buscar funcionários da loja
    const employees = await this.prisma.user.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        role: true
      }
    });

    if (!employees.length) return [];

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Buscar vendas por funcionário no último mês
    const sales = await this.prisma.sale.findMany({
      where: {
        storeId,
        createdAt: {
          gte: oneMonthAgo
        },
        status: {
          in: [SaleStatus.COMPLETED, SaleStatus.DELIVERED, SaleStatus.PENDING, SaleStatus.PREPARING, SaleStatus.SHIPPED]
        }
      },
      select: {
        employeeId: true,
        totalAmount: true
      }
    });

    // Buscar pontos (timeClock) por funcionário no último mês
    const timeClocks = await this.prisma.timeClock.findMany({
      where: {
        employee: { storeId },
        createdAt: {
          gte: oneMonthAgo
        }
      }
    });

    const salesMap = new Map<string, number>();
    sales.forEach((s) => {
      if (!s.employeeId) return;
      const current = salesMap.get(s.employeeId) ?? 0;
      salesMap.set(s.employeeId, current + Number(s.totalAmount ?? 0));
    });

    const clocksByEmployee = new Map<string, any[]>();
    timeClocks.forEach((tc: any) => {
      const list = clocksByEmployee.get(tc.employeeId) ?? [];
      list.push(tc);
      clocksByEmployee.set(tc.employeeId, list);
    });

    const employeePerformance = employees.map((emp) => {
      const empClocks = clocksByEmployee.get(emp.id) ?? [];
      const totalTimeClocks = empClocks.length;
      const vendas = salesMap.get(emp.id) ?? 0;
      const pontos = totalTimeClocks * 2; // 2 pontos por ponto registrado
      const atrasos = empClocks.filter(
        (tc) => tc.minutesLate && tc.minutesLate > 0
      ).length;

      return {
        name: emp.name,
        vendas,
        pontos,
        atrasos,
        totalTimeClocks
      };
    });

    return employeePerformance;
  }

  async getRecentActivity(storeId: string) {
    // Buscar funcionários da loja
    const employees = await this.prisma.user.findMany({
      where: { storeId },
      select: { id: true, name: true }
    });

    // Buscar últimos pontos registrados
    const recentTimeClocks = await this.prisma.timeClock.findMany({
      where: { 
        employee: { storeId }
      },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Gerar atividade recente
    const recentActivity = recentTimeClocks.map((tc, index) => {
      const actions = [
        'Funcionário bateu ponto',
        'Venda realizada',
        'Atraso registrado',
        'Ponto de saída registrado'
      ];
      
      const types = ['success', 'success', 'warning', 'info'];
      
      return {
        id: tc.id,
        action: actions[index % actions.length],
        employee: tc.employee.name,
        time: this.getTimeAgo(tc.createdAt),
        type: types[index % types.length]
      };
    });

    return recentActivity;
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours} horas atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} dias atrás`;
    }
  }
}
