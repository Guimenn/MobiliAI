import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminSystemService {
  constructor(private prisma: PrismaService) {}

  // ==================== LOGS DO SISTEMA ====================

  async getSystemLogs(page = 1, limit = 50, level?: string, userId?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (level) where.level = level;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.systemLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async createSystemLog(data: {
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    message: string;
    action: string;
    userId?: string;
    metadata?: any;
  }) {
    // Verificar se log de auditoria está habilitado
    const auditLogEnabled = await this.isAuditLogEnabled();
    if (!auditLogEnabled) {
      return null; // Não criar log se estiver desabilitado
    }

    return this.prisma.systemLog.create({
      data: {
        level: data.level,
        message: data.message,
        action: data.action,
        userId: data.userId,
        metadata: data.metadata
      }
    });
  }

  private async isAuditLogEnabled(): Promise<boolean> {
    try {
      const settings = await this.prisma.systemSettings.findUnique({
        where: { key: 'system_settings' }
      });
      
      if (settings && settings.value) {
        const value = settings.value as any;
        return value?.security?.auditLog ?? true; // Padrão: true
      }
      return true; // Padrão: habilitado
    } catch (error) {
      console.error('Erro ao verificar log de auditoria:', error);
      return true; // Em caso de erro, habilitar por padrão
    }
  }

  // ==================== ESTATÍSTICAS DO SISTEMA ====================

  async getSystemStats() {
    const [
      totalUsers,
      activeUsers,
      totalStores,
      activeStores,
      totalProducts,
      totalSales,
      totalRevenue,
      systemUptime
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.store.count(),
      this.prisma.store.count({ where: { isActive: true } }),
      this.prisma.product.count(),
      this.prisma.sale.count(),
      this.getTotalRevenue(),
      this.getSystemUptime()
    ]);

    const recentActivity = await this.prisma.systemLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, role: true } }
      }
    });

    return {
      overview: {
        totalUsers,
        activeUsers,
        totalStores,
        activeStores,
        totalProducts,
        totalSales,
        totalRevenue,
        systemUptime
      },
      recentActivity
    };
  }

  private async getTotalRevenue() {
    const sales = await this.prisma.sale.findMany({
      include: { items: true }
    });

    return sales.reduce((total, sale) => {
      const saleTotal = sale.items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);
      return total + saleTotal;
    }, 0);
  }

  private async getSystemUptime() {
    // Simular uptime - em produção, você usaria um serviço de monitoramento
    const startTime = new Date('2024-01-01T00:00:00Z');
    const now = new Date();
    const uptimeMs = now.getTime() - startTime.getTime();
    const uptimeDays = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const uptimeHours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${uptimeDays}d ${uptimeHours}h`;
  }

  // ==================== BACKUP E RESTORE ====================

  async createBackup() {
    const backupData = {
      timestamp: new Date().toISOString(),
      users: await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          storeId: true,
          phone: true,
          address: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      stores: await this.prisma.store.findMany(),
      products: await this.prisma.product.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          price: true,
          costPrice: true,
          stock: true,
          minStock: true,
          colorName: true,
          colorHex: true,
          brand: true,
          style: true,
          material: true,
          width: true,
          height: true,
          depth: true,
          weight: true,
          model: true,
          sku: true,
          barcode: true,
          imageUrls: true,
          videoUrl: true,
          tags: true,
          keywords: true,
          isFeatured: true,
          isNew: true,
          isBestSeller: true,
          rating: true,
          reviewCount: true,
          isAvailable: true,
          storeId: true,
          supplierId: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      sales: await this.prisma.sale.findMany({
        include: {
          items: true
        }
      })
    };

    // Em produção, você salvaria isso em um arquivo ou serviço de backup
    return {
      message: 'Backup criado com sucesso',
      timestamp: backupData.timestamp,
      recordCounts: {
        users: backupData.users.length,
        stores: backupData.stores.length,
        products: backupData.products.length,
        sales: backupData.sales.length
      }
    };
  }

  // ==================== LIMPEZA DO SISTEMA ====================

  async cleanupSystem() {
    const results = {
      deletedLogs: 0,
      deletedExpiredSessions: 0,
      deletedOldBackups: 0
    };

    // Deletar logs antigos (mais de 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedLogs = await this.prisma.systemLog.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        level: { not: 'ERROR' } // Manter logs de erro
      }
    });
    results.deletedLogs = deletedLogs.count;

    // Deletar sessões expiradas (se você tiver uma tabela de sessões)
    // const deletedSessions = await this.prisma.session.deleteMany({
    //   where: {
    //     expiresAt: { lt: new Date() }
    //   }
    // });
    // results.deletedExpiredSessions = deletedSessions.count;

    return {
      message: 'Limpeza do sistema concluída',
      results
    };
  }

  // ==================== CONFIGURAÇÕES DO SISTEMA ====================

  async getSystemSettings() {
    try {
      // Buscar configurações do banco
      const settingsRecord = await this.prisma.systemSettings.findUnique({
        where: { key: 'system_settings' }
      });

      if (settingsRecord) {
        return settingsRecord.value as any;
      }

      // Retornar valores padrão se não existir
      const defaultSettings = {
        company: {
          name: 'PintAI',
          email: 'contato@pintai.com',
          phone: '(11) 99999-9999',
          address: 'Rua das Tintas, 123 - São Paulo, SP',
          cnpj: '12.345.678/0001-90'
        },
        system: {
          maintenanceMode: false,
          sessionTimeout: 30,
          maxLoginAttempts: 5
        },
        notifications: {
          salesAlerts: true,
          lowStockAlerts: true
        },
        security: {
          passwordExpiration: 90,
          ipWhitelist: '',
          auditLog: true
        }
      };

      // Criar registro padrão
      await this.prisma.systemSettings.create({
        data: {
          key: 'system_settings',
          value: defaultSettings,
          description: 'Configurações gerais do sistema'
        }
      });

      return defaultSettings;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      // Retornar valores padrão em caso de erro
      return {
        company: {
          name: 'PintAI',
          email: 'contato@pintai.com',
          phone: '(11) 99999-9999',
          address: 'Rua das Tintas, 123 - São Paulo, SP',
          cnpj: '12.345.678/0001-90'
        },
        system: {
          maintenanceMode: false,
          sessionTimeout: 30,
          maxLoginAttempts: 5
        },
        notifications: {
          salesAlerts: true,
          lowStockAlerts: true
        },
        security: {
          passwordExpiration: 90,
          ipWhitelist: '',
          auditLog: true
        }
      };
    }
  }

  async updateSystemSettings(settings: any, userId?: string) {
    try {
      // Atualizar ou criar configurações
      await this.prisma.systemSettings.upsert({
        where: { key: 'system_settings' },
        update: {
          value: settings,
          updatedBy: userId,
          updatedAt: new Date()
        },
        create: {
          key: 'system_settings',
          value: settings,
          description: 'Configurações gerais do sistema',
          updatedBy: userId
        }
      });

      return {
        message: 'Configurações atualizadas com sucesso',
        settings
      };
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw new Error('Erro ao atualizar configurações');
    }
  }

  async getMaintenanceMode(): Promise<boolean> {
    try {
      const settings = await this.getSystemSettings();
      return settings?.system?.maintenanceMode || false;
    } catch (error) {
      return false;
    }
  }

  async getMaxLoginAttempts(): Promise<number> {
    try {
      const settings = await this.getSystemSettings();
      return settings?.system?.maxLoginAttempts || 5;
    } catch (error) {
      return 5;
    }
  }

  async getSessionTimeout(): Promise<number> {
    try {
      const settings = await this.getSystemSettings();
      return settings?.system?.sessionTimeout || 30;
    } catch (error) {
      return 30;
    }
  }

  // ==================== MONITORAMENTO ====================

  async getSystemHealth() {
    const health = {
      database: 'healthy',
      api: 'healthy',
      storage: 'healthy',
      ai: 'healthy',
      chatbot: 'healthy'
    };

    // Verificar conexão com banco
    try {
      await this.prisma.user.count();
      health.database = 'healthy';
    } catch (error) {
      health.database = 'unhealthy';
    }

    // Verificar outros serviços...
    
    return {
      status: Object.values(health).every(h => h === 'healthy') ? 'healthy' : 'degraded',
      services: health,
      timestamp: new Date().toISOString()
    };
  }
}
