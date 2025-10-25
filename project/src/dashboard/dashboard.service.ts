import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStoreOverview(storeId: string) {
    // Buscar dados básicos da loja
    const store = await this.prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      throw new Error('Loja não encontrada');
    }

    // Buscar funcionários da loja
    const users = await this.prisma.user.findMany({
      where: { storeId }
    });

    // Buscar pontos dos últimos 6 meses
    const timeClocks = await this.prisma.timeClock.findMany({
      where: {
        employee: { storeId },
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
        }
      }
    });

    // Calcular estatísticas
    const totalEmployees = users.length;
    const totalTimeClocks = timeClocks.length;
    
    // Calcular vendas (0 se não houver dados reais)
    const totalSales = 0; // TODO: Implementar vendas reais
    
    // Calcular taxa de presença baseada nos pontos reais
    const attendanceRate = totalTimeClocks > 0 ? Math.min(100, Math.floor((totalTimeClocks / (totalEmployees * 30)) * 100)) : 0;
    
    // Calcular horas médias baseadas nos pontos reais
    const averageHours = totalTimeClocks > 0 ? Math.floor(totalTimeClocks / totalEmployees) : 0;

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
    // TODO: Implementar vendas reais baseadas em dados do banco
    // Por enquanto retorna dados zerados
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const salesData = months.map(month => ({
      name: month,
      vendas: 0,
      clientes: 0
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

    // Calcular performance de cada funcionário
    const employeePerformance = await Promise.all(employees.map(async (emp) => {
      // Buscar pontos do funcionário no último mês
      const timeClocks = await this.prisma.timeClock.findMany({
        where: {
          employeeId: emp.id,
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
          }
        }
      });

      const totalTimeClocks = timeClocks.length;
      const vendas = 0; // TODO: Implementar vendas reais por funcionário
      const pontos = totalTimeClocks * 2; // 2 pontos por ponto registrado
      const atrasos = timeClocks.filter(tc => tc.minutesLate && tc.minutesLate > 0).length;

      return {
        name: emp.name,
        vendas,
        pontos,
        atrasos,
        totalTimeClocks
      };
    }));

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
