'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { managerAPI, notificationsAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Truck,
  Clock,
} from 'lucide-react';

type DashboardOverview = {
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  monthlyRevenue: number;
};

type DashboardSaleItem = {
  quantity: number;
  unitPrice: number | string;
  product?: {
    name?: string;
  };
};

type DashboardSale = {
  id: string;
  createdAt: string;
  customer?: { name?: string; email?: string };
  items: DashboardSaleItem[];
};

type DashboardData = {
  overview: DashboardOverview;
  recentSales: DashboardSale[];
};

const clampPercentage = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
};

const formatNumber = (value?: number | string | null) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '--';
  }
  return new Intl.NumberFormat('pt-BR').format(Number(value));
};

const formatCurrency = (value?: number | string | null) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '--';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
};

const formatPercent = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '--';
  }
  return `${value.toFixed(1)}%`;
};

export default function ManagerDashboard() {
  const { user, isAuthenticated } = useAppStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (controller?: { cancelled: boolean }) => {
      const signal = controller ?? { cancelled: false };
      setIsLoading(true);
      setError(null);

      try {
        const [dashboardResponse, notificationsResponse] = await Promise.all([
          managerAPI.getDashboard(),
          notificationsAPI.getAll(1, 50).catch(err => {
            console.warn('Erro ao buscar notificações:', err);
            return { notifications: [], total: 0 };
          }),
        ]);

        if (signal.cancelled) {
          return;
        }

        setDashboardData(dashboardResponse);
        
        const notifications = notificationsResponse?.notifications || [];
        setRealNotifications(notifications);
      } catch (err) {
        console.error('Erro ao carregar dashboard manager:', err);
        if (!signal.cancelled) {
          setError('Não foi possível carregar os dados do dashboard. Tente novamente em instantes.');
        }
      } finally {
        if (!signal.cancelled) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'STORE_MANAGER') {
      return;
    }

    const state = { cancelled: false };
    void fetchData(state);
    
    const interval = setInterval(() => {
      if (!state.cancelled) {
        void fetchData(state);
      }
    }, 30000);
    
    return () => {
      state.cancelled = true;
      clearInterval(interval);
    };
  }, [fetchData, isAuthenticated, user]);

  const handleRetry = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    []
  );

  const overviewCards = useMemo(() => {
    const overview = dashboardData?.overview;

    return [
      {
        title: 'Funcionários',
        value: overview ? formatNumber(overview.totalUsers) : '--',
        helper: overview ? 'Equipe da loja' : 'Status não disponível',
        icon: Users,
      },
      {
        title: 'Produtos em estoque',
        value: overview ? formatNumber(overview.totalProducts) : '--',
        helper: overview ? 'Catálogo atualizado' : '---',
        icon: Package,
      },
      {
        title: 'Vendas do mês',
        value: overview ? formatNumber(overview.totalSales) : '--',
        helper: overview ? 'Total de vendas realizadas' : '---',
        icon: ShoppingCart,
      },
      {
        title: 'Receita mensal',
        value: overview ? formatCurrency(overview.monthlyRevenue) : '--',
        helper: overview ? 'Total arrecadado no período' : '---',
        icon: DollarSign,
      },
    ];
  }, [dashboardData]);

  const quickActions = useMemo(() => {
    const overview = dashboardData?.overview;

    return [
      {
        name: 'Nova venda',
        description: 'Registre uma nova venda no PDV.',
        href: '/manager/pdv',
        indicator: overview ? 'Acesso rápido ao PDV' : undefined,
        icon: ShoppingCart,
      },
      {
        name: 'Gerenciar funcionários',
        description: 'Visualize e gerencie sua equipe.',
        href: '/manager/employees',
        indicator: overview ? `${formatNumber(overview.totalUsers)} funcionários` : undefined,
        icon: Users,
      },
      {
        name: 'Catálogo de produtos',
        description: 'Atualize estoque e preços.',
        href: '/manager/products',
        indicator: overview ? `${formatNumber(overview.totalProducts)} itens` : undefined,
        icon: Package,
      },
      {
        name: 'Relatórios da loja',
        description: 'Gere relatórios financeiros e operacionais.',
        href: '/manager/reports',
        indicator: 'Análise detalhada',
        icon: BarChart3,
      },
    ];
  }, [dashboardData]);

  const notificationsList = useMemo(() => {
    return realNotifications
      .map(n => ({
        id: n.id,
        type: n.type?.includes('LOW_STOCK') || n.type?.includes('OUT_OF_STOCK')
          ? 'WARNING'
          : n.type?.includes('ERROR') || n.type?.includes('SYSTEM_ERROR')
          ? 'ERROR'
          : 'INFO',
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        actionUrl: n.actionUrl,
        isRead: n.isRead,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [realNotifications]);

  const getNotificationToneClasses = (type: string) => {
    switch (type) {
      case 'ERROR':
        return 'border-destructive/40 bg-destructive/10 text-destructive';
      case 'WARNING':
        return 'border-amber-500/40 bg-amber-100/50 text-amber-700';
      case 'SUCCESS':
        return 'border-emerald-500/40 bg-emerald-100/40 text-emerald-700';
      default:
        return 'border-primary/30 bg-primary/5 text-foreground';
    }
  };

  const getNotificationLabel = (type: string) => {
    switch (type) {
      case 'ERROR':
        return 'Crítico';
      case 'WARNING':
        return 'Alerta';
      case 'SUCCESS':
        return 'Sucesso';
      default:
        return 'Informação';
    }
  };

  const heroHighlights = useMemo(() => {
    const overview = dashboardData?.overview;
    const unreadCount = realNotifications.filter(n => !n.isRead).length;

    return [
      {
        label: 'Equipe ativa',
        value: overview ? formatNumber(overview.totalUsers) : '--',
        description: 'Funcionários cadastrados na loja',
        icon: Users,
      },
      {
        label: 'Notificações',
        value: formatNumber(notificationsList.length),
        description: unreadCount > 0
          ? `${formatNumber(unreadCount)} não lidas`
          : 'Tudo atualizado',
        icon: AlertTriangle,
      },
      {
        label: 'Receita do mês',
        value: overview ? formatCurrency(overview.monthlyRevenue) : '--',
        description: 'Total arrecadado no período',
        icon: DollarSign,
      },
    ];
  }, [dashboardData, notificationsList, realNotifications]);

  const recentSales = dashboardData?.recentSales ?? [];

  const calculateSaleTotal = (sale: DashboardSale) =>
    sale.items.reduce((total, item) => {
      const quantity = item.quantity ?? 0;
      const price = Number(item.unitPrice ?? 0);
      return total + quantity * price;
    }, 0);

  if (!isAuthenticated || !user || user.role !== 'STORE_MANAGER') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-b-primary" />
          <p className="text-sm text-muted-foreground">Carregando informações do painel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-10 text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Erro ao carregar o dashboard</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-6" onClick={handleRetry}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-[#3e2626] px-8 py-10 text-primary-foreground shadow-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <Badge
              variant="outline"
              className="border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground"
            >
              Visão da loja
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Bem-vindo ao controle da sua loja
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Monitore indicadores da sua loja, acompanhe vendas em tempo real e mantenha sua equipe,
                produtos e operações alinhados às metas.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link href="/manager/pdv">
                  Nova venda
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                asChild
              >
                <Link href="/manager/orders-online">Ver pedidos online</Link>
              </Button>
            </div>
          </div>

          <div className="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-3 lg:max-w-2xl">
            {heroHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4 overflow-hidden min-w-0 flex flex-col"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground flex-shrink-0 mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold leading-tight" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item.value}</p>
                    <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-2 break-words">{item.label}</p>
                    <p className="mt-1 text-xs text-primary-foreground/70 break-words line-clamp-2">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border border-border shadow-sm">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-muted/60 p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="border-transparent text-xs text-muted-foreground">
                    Indicador-chave
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-semibold text-foreground">{card.value}</p>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-xs text-muted-foreground/80">{card.helper}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 border border-border shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">Ações rápidas</CardTitle>
              <CardDescription>
                Atalhos diretos para as áreas mais acessadas do painel da loja.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-foreground">{action.name}</p>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{action.indicator ?? 'Acesse a área correspondente'}</span>
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Notificações</CardTitle>
            <CardDescription>Ocorrências que exigem sua atenção.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notificationsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma notificação registrada.</p>
            ) : (
              notificationsList.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-xl border p-3 text-sm transition hover:shadow-md cursor-pointer ${
                    getNotificationToneClasses(notification.type)
                  } ${!notification.isRead ? 'ring-2 ring-primary/20 bg-opacity-95' : ''}`}
                  onClick={async () => {
                    if (notification.id && !notification.isRead) {
                      try {
                        await notificationsAPI.markAsRead(notification.id);
                        setRealNotifications(prev => 
                          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                        );
                      } catch (error) {
                        console.error('Erro ao marcar notificação como lida:', error);
                      }
                    }
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></span>
                      )}
                      <span className="font-semibold">{notification.title}</span>
                    </div>
                    <Badge variant="outline" className="border-transparent text-[10px] uppercase ml-2">
                      {getNotificationLabel(notification.type)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-current/80">{notification.message}</p>
                  <p className="mt-3 text-[11px] text-current/60">
                    {dateTimeFormatter.format(new Date(notification.createdAt))}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Vendas recentes</CardTitle>
            <CardDescription>Últimos registros de venda da sua loja.</CardDescription>
          </div>
          <Button variant="ghost" className="text-sm text-primary hover:bg-primary/10" asChild>
            <Link href="/manager/reports">
              Ver todas
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentSales.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma venda registrada recentemente.</p>
          ) : (
            recentSales.map((sale) => {
              const total = calculateSaleTotal(sale);
              const firstItem = sale.items[0];
              return (
                <div
                  key={sale.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card/80 p-4 transition hover:border-primary/40 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {sale.customer?.name || 'Cliente não identificado'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {firstItem?.product?.name ?? `${sale.items.length} itens`}
                    </p>
                  </div>
                  <div className="flex flex-col items-start text-sm sm:items-end">
                    <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
                    <span className="text-xs text-muted-foreground">
                      {dateTimeFormatter.format(new Date(sale.createdAt))}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
