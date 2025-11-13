import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminNotificationsService {
  constructor(private prisma: PrismaService) {}

  // ==================== NOTIFICAÇÕES DO SISTEMA ====================

  async getSystemNotifications() {
    const notifications = [];

    // Verificar estoque baixo - produtos onde stock <= minStock E stock > 0
    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        AND: [
          {
            stock: {
              lte: this.prisma.product.fields.minStock
            }
          },
          {
            stock: {
              gt: 0
            }
          }
        ]
      },
      include: {
        store: { select: { name: true } }
      },
      take: 10
    });

    if (lowStockProducts.length > 0) {
      notifications.push({
        type: 'WARNING',
        title: 'Estoque Baixo',
        message: `${lowStockProducts.length} produto(s) com estoque baixo`,
        data: lowStockProducts,
        createdAt: new Date()
      });
    }

    // Verificar produtos sem estoque
    const outOfStockProducts = await this.prisma.product.findMany({
      where: { stock: 0 },
      include: {
        store: { select: { name: true } }
      },
      take: 10
    });

    if (outOfStockProducts.length > 0) {
      notifications.push({
        type: 'ERROR',
        title: 'Produtos Sem Estoque',
        message: `${outOfStockProducts.length} produtos sem estoque`,
        data: outOfStockProducts,
        createdAt: new Date()
      });
    }

    // Verificar vendas recentes
    const recentSales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      },
      include: {
        customer: { select: { name: true } },
        store: { select: { name: true } }
      },
      take: 5
    });

    if (recentSales.length > 0) {
      notifications.push({
        type: 'INFO',
        title: 'Vendas Recentes',
        message: `${recentSales.length} vendas nas últimas 24 horas`,
        data: recentSales,
        createdAt: new Date()
      });
    }

    // Verificar usuários inativos
    const inactiveUsers = await this.prisma.user.findMany({
      where: {
        isActive: false
      },
      take: 5
    });

    if (inactiveUsers.length > 0) {
      notifications.push({
        type: 'WARNING',
        title: 'Usuários Inativos',
        message: `${inactiveUsers.length} usuários inativos`,
        data: inactiveUsers,
        createdAt: new Date()
      });
    }

    return notifications;
  }

  // ==================== ALERTAS DE SISTEMA ====================

  async getSystemAlerts() {
    const alerts = [];

    // Verificar saúde do sistema
    const systemHealth = await this.checkSystemHealth();
    if (systemHealth.status !== 'healthy') {
      alerts.push({
        type: 'ERROR',
        title: 'Problema no Sistema',
        message: 'Alguns serviços estão com problemas',
        data: systemHealth,
        createdAt: new Date()
      });
    }

    // Verificar espaço em disco (simulado)
    const diskSpace = await this.checkDiskSpace();
    if (diskSpace.usage > 80) {
      alerts.push({
        type: 'WARNING',
        title: 'Espaço em Disco Baixo',
        message: `Uso de disco: ${diskSpace.usage}%`,
        data: diskSpace,
        createdAt: new Date()
      });
    }

    // Verificar logs de erro recentes
    const errorLogs = await this.prisma.systemLog.findMany({
      where: {
        level: 'ERROR',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      take: 5
    });

    if (errorLogs.length > 0) {
      alerts.push({
        type: 'ERROR',
        title: 'Logs de Erro',
        message: `${errorLogs.length} erros nas últimas 24 horas`,
        data: errorLogs,
        createdAt: new Date()
      });
    }

    return alerts;
  }

  // ==================== RELATÓRIOS DE PERFORMANCE ====================

  async getPerformanceReport() {
    const report = {
      sales: await this.getSalesPerformance(),
      users: await this.getUsersPerformance(),
      products: await this.getProductsPerformance(),
      system: await this.getSystemPerformance()
    };

    return report;
  }

  private async getSalesPerformance() {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todaySales, yesterdaySales, lastWeekSales] = await Promise.all([
      this.prisma.sale.count({
        where: { createdAt: { gte: today } }
      }),
      this.prisma.sale.count({
        where: { 
          createdAt: { 
            gte: yesterday,
            lt: today 
          } 
        }
      }),
      this.prisma.sale.count({
        where: { createdAt: { gte: lastWeek } }
      })
    ]);

    return {
      today: todaySales,
      yesterday: yesterdaySales,
      lastWeek: lastWeekSales,
      growth: yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0
    };
  }

  private async getUsersPerformance() {
    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.user.count({
      where: { isActive: true }
    });
    const newUsers = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    return {
      total: totalUsers,
      active: activeUsers,
      newThisWeek: newUsers,
      activityRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
    };
  }

  private async getProductsPerformance() {
    const totalProducts = await this.prisma.product.count();
    const lowStockProducts = await this.prisma.product.count({
      where: {
        stock: {
          lte: this.prisma.product.fields.minStock
        }
      }
    });
    const outOfStockProducts = await this.prisma.product.count({
      where: { stock: 0 }
    });

    return {
      total: totalProducts,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
      stockHealth: totalProducts > 0 ? ((totalProducts - lowStockProducts - outOfStockProducts) / totalProducts) * 100 : 0
    };
  }

  private async getSystemPerformance() {
    const totalLogs = await this.prisma.systemLog.count();
    const errorLogs = await this.prisma.systemLog.count({
      where: { level: 'ERROR' }
    });
    const warningLogs = await this.prisma.systemLog.count({
      where: { level: 'WARN' }
    });

    return {
      totalLogs,
      errors: errorLogs,
      warnings: warningLogs,
      errorRate: totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0
    };
  }

  private async checkSystemHealth() {
    // Simular verificação de saúde do sistema
    return {
      status: 'healthy',
      services: {
        database: 'healthy',
        api: 'healthy',
        storage: 'healthy'
      }
    };
  }

  private async checkDiskSpace() {
    // Simular verificação de espaço em disco
    return {
      total: 100,
      used: 75,
      usage: 75,
      free: 25
    };
  }

  // ==================== DASHBOARD RESUMIDO ====================

  async getDashboardSummary() {
    const [
      notifications,
      alerts,
      performance
    ] = await Promise.all([
      this.getSystemNotifications(),
      this.getSystemAlerts(),
      this.getPerformanceReport()
    ]);

    return {
      notifications: notifications.slice(0, 5), // Últimas 5
      alerts: alerts.slice(0, 3), // Últimas 3
      performance,
      summary: {
        totalNotifications: notifications.length,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.type === 'ERROR').length
      }
    };
  }
}
