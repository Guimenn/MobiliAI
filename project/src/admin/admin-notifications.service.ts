import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminNotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca configurações do sistema
   */
  private async getSystemSettings(): Promise<any> {
    try {
      const settingsRecord = await this.prisma.systemSettings.findUnique({
        where: { key: 'system_settings' }
      });

      if (settingsRecord) {
        return settingsRecord.value as any;
      }

      // Retornar valores padrão
      return {
        notifications: {
          salesAlerts: true,
          lowStockAlerts: true
        }
      };
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return {
        notifications: {
          salesAlerts: true,
          lowStockAlerts: true
        }
      };
    }
  }

  // ==================== NOTIFICAÇÕES DO SISTEMA ====================

  async getSystemNotifications() {
    const notifications = [];

    // Carregar configurações do sistema
    const settings = await this.getSystemSettings();
    const lowStockAlertsEnabled = settings?.notifications?.lowStockAlerts ?? true;
    const salesAlertsEnabled = settings?.notifications?.salesAlerts ?? true;

    // Verificar estoque baixo - produtos onde stock <= minStock E stock > 0
    if (lowStockAlertsEnabled) {
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
    }

    // Verificar vendas recentes
    if (salesAlertsEnabled) {
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

    try {
      // 1. Verificar saúde do banco de dados (teste real de conexão)
      const dbHealth = await this.checkDatabaseHealth();
      if (!dbHealth.healthy) {
        alerts.push({
          type: 'ERROR',
          title: 'Problema no Banco de Dados',
          message: dbHealth.message || 'Falha na conexão com o banco de dados',
          data: dbHealth,
          createdAt: new Date()
        });
      }

      // 2. Verificar produtos sem estoque crítico (muitos produtos zerados)
      const criticalOutOfStock = await this.prisma.product.count({
        where: { stock: 0 }
      });
      
      if (criticalOutOfStock > 20) {
        alerts.push({
          type: 'ERROR',
          title: 'Estoque Crítico',
          message: `${criticalOutOfStock} produtos completamente sem estoque`,
          data: { count: criticalOutOfStock },
          createdAt: new Date()
        });
      } else if (criticalOutOfStock > 10) {
        alerts.push({
          type: 'WARNING',
          title: 'Atenção: Estoque Baixo',
          message: `${criticalOutOfStock} produtos sem estoque`,
          data: { count: criticalOutOfStock },
          createdAt: new Date()
        });
      }

      // 3. Verificar pedidos online pendentes há muito tempo (> 48 horas)
      const pendingOrders = await this.prisma.sale.count({
        where: {
          isOnlineOrder: true,
          status: {
            in: ['PENDING', 'PREPARING']
          },
          createdAt: {
            lt: new Date(Date.now() - 48 * 60 * 60 * 1000) // Mais de 48 horas
          }
        }
      });

      if (pendingOrders > 0) {
        alerts.push({
          type: 'WARNING',
          title: 'Pedidos Pendentes',
          message: `${pendingOrders} pedido(s) online aguardando processamento há mais de 48 horas`,
          data: { count: pendingOrders },
          createdAt: new Date()
        });
      }

      // 4. Verificar usuários bloqueados ou inativos há muito tempo
      const inactiveUsers = await this.prisma.user.count({
        where: {
          isActive: false,
          updatedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Mais de 30 dias
          }
        }
      });

      if (inactiveUsers > 5) {
        alerts.push({
          type: 'WARNING',
          title: 'Usuários Inativos',
          message: `${inactiveUsers} usuários inativos há mais de 30 dias`,
          data: { count: inactiveUsers },
          createdAt: new Date()
        });
      }

      // 5. Verificar logs de erro recentes (se a tabela existir)
      try {
        const errorLogs = await this.prisma.systemLog.findMany({
          where: {
            level: 'ERROR',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          take: 5
        });

        if (errorLogs.length > 10) {
          alerts.push({
            type: 'ERROR',
            title: 'Muitos Erros no Sistema',
            message: `${errorLogs.length} erros registrados nas últimas 24 horas`,
            data: errorLogs,
            createdAt: new Date()
          });
        } else if (errorLogs.length > 0) {
          alerts.push({
            type: 'WARNING',
            title: 'Erros Detectados',
            message: `${errorLogs.length} erro(s) nas últimas 24 horas`,
            data: errorLogs,
            createdAt: new Date()
          });
        }
      } catch (error) {
        // Tabela SystemLog pode não existir, ignorar silenciosamente
        console.debug('Tabela SystemLog não disponível:', error);
      }

      // 6. Verificar vendas com problemas (valores zerados ou negativos)
      const problematicSales = await this.prisma.sale.count({
        where: {
          OR: [
            { totalAmount: { lte: 0 } },
            { items: { none: {} } } // Vendas sem itens
          ],
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
          }
        }
      });

      if (problematicSales > 0) {
        alerts.push({
          type: 'ERROR',
          title: 'Vendas com Problemas',
          message: `${problematicSales} venda(s) com valores inválidos ou sem itens nos últimos 7 dias`,
          data: { count: problematicSales },
          createdAt: new Date()
        });
      }

    } catch (error) {
      // Se houver erro ao buscar alertas, criar um alerta sobre isso
      console.error('Erro ao verificar alertas do sistema:', error);
      alerts.push({
        type: 'ERROR',
        title: 'Erro ao Verificar Alertas',
        message: 'Não foi possível verificar todos os alertas do sistema',
        data: { error: error.message },
        createdAt: new Date()
      });
    }

    return alerts;
  }

  private async checkDatabaseHealth() {
    try {
      // Teste real de conexão com o banco
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        healthy: true,
        message: 'Conexão com banco de dados OK'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Erro na conexão: ${error.message}`
      };
    }
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
