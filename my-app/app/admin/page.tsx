'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { adminAPI, notificationsAPI } from '@/lib/api';
import {
  Store,
  Users,
  Package,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  CheckCircle,
} from 'lucide-react';
import { Loader } from '@/components/ui/ai/loader';

type DashboardOverview = {
  totalStores: number;
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  monthlyRevenue: number;
  totalProfit?: number;
  activeStores: number;
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
  store?: { name?: string };
  items: DashboardSaleItem[];
};

type DashboardProduct = {
  id: string;
  name: string;
  price: number | string;
  rating?: number | null;
  reviewCount?: number | null;
  stock?: number | null;
  store?: { name?: string };
};

type DashboardData = {
  overview: DashboardOverview;
  recentSales: DashboardSale[];
  topProducts: DashboardProduct[];
};

type DashboardSummaryNotification = {
  type: string;
  title: string;
  message: string;
  createdAt: string;
};

type DashboardSummary = {
  notifications?: DashboardSummaryNotification[];
  alerts?: DashboardSummaryNotification[];
  performance?: {
    sales?: {
      today?: number;
      yesterday?: number;
      lastWeek?: number;
      growth?: number;
    };
    users?: {
      total?: number;
      active?: number;
      newThisWeek?: number;
      activityRate?: number;
    };
    products?: {
      total?: number;
      lowStock?: number;
      outOfStock?: number;
      stockHealth?: number;
    };
    system?: {
      totalLogs?: number;
      errors?: number;
      warnings?: number;
      errorRate?: number;
    };
  };
  summary?: {
    totalNotifications?: number;
    totalAlerts?: number;
    criticalAlerts?: number;
  };
};

const clampPercentage = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
};

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

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (controller?: { cancelled: boolean }) => {
      const signal = controller ?? { cancelled: false };
      setIsLoading(true);
      setError(null);

      try {
        // Buscar dados do dashboard, notificações do sistema e notificações reais do banco de dados
        const [dashboardResponse, summaryResponse, notificationsResponse, systemNotificationsResponse, systemAlertsResponse] = await Promise.all([
          adminAPI.getDashboard(),
          adminAPI.getDashboardSummary(),
          notificationsAPI.getAll(1, 50).catch(err => {
            console.warn('Erro ao buscar notificações reais:', err);
            return { notifications: [], total: 0 };
          }),
          adminAPI.getNotifications().catch(err => {
            console.warn('Erro ao buscar notificações do sistema:', err);
            return [];
          }),
          adminAPI.getAlerts().catch(err => {
            console.warn('Erro ao buscar alertas do sistema:', err);
            return [];
          }),
        ]);

        if (signal.cancelled) {
          return;
        }

        setDashboardData(dashboardResponse);
        setSummaryData(summaryResponse);
        
        // Processar notificações reais do banco de dados (do usuário logado)
        const notifications = notificationsResponse?.notifications || [];
        setRealNotifications(notifications);
        
        // Processar notificações do sistema (estoque baixo, etc.)
        const sysNotifications = Array.isArray(systemNotificationsResponse) ? systemNotificationsResponse : [];
        setSystemNotifications(sysNotifications);
        
        // Processar alertas do sistema
        const alerts = Array.isArray(systemAlertsResponse) ? systemAlertsResponse : [];
        setSystemAlerts(alerts);
      } catch (err) {
        console.error('Erro ao carregar dashboard admin:', err);
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
    const state = { cancelled: false };
    void fetchData(state);
    
    // Atualizar notificações a cada 30 segundos
    const interval = setInterval(() => {
      if (!state.cancelled) {
        void fetchData(state);
      }
    }, 30000);
    
    return () => {
      state.cancelled = true;
      clearInterval(interval);
    };
  }, [fetchData]);

  const handleRetry = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('pt-BR'), []);
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    []
  );
  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    []
  );

  const formatNumber = useCallback(
    (value?: number | string | null) => {
      if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return '--';
      }
      return numberFormatter.format(Number(value));
    },
    [numberFormatter]
  );

  const formatCurrency = useCallback(
    (value?: number | string | null) => {
      if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return '--';
      }
      return currencyFormatter.format(Number(value));
    },
    [currencyFormatter]
  );

  const formatPercent = useCallback((value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return '--';
    }
    return `${value.toFixed(1)}%`;
  }, []);

  // Calcular lucro total - priorizar do overview (calculado no backend), senão calcular das vendas recentes
  const totalProfit = useMemo(() => {
    // Priorizar lucro total do overview se disponível (calculado no backend de TODAS as vendas)
    if (dashboardData?.overview?.totalProfit !== undefined && dashboardData.overview.totalProfit !== null) {
      const profit = Number(dashboardData.overview.totalProfit);
      if (!isNaN(profit) && profit >= 0) {
        return profit;
      }
    }
    // Fallback: calcular das vendas recentes (apenas as últimas 10)
    if (!dashboardData?.recentSales || dashboardData.recentSales.length === 0) return 0;
    const calculatedProfit = dashboardData.recentSales.reduce((sum, sale) => {
      if (!sale.items || !Array.isArray(sale.items)) return sum;
      const saleProfit = sale.items.reduce((itemSum: number, item: any) => {
        const itemProfit = item.profit !== undefined && item.profit !== null ? Number(item.profit) : 0;
        return itemSum + (isNaN(itemProfit) ? 0 : itemProfit);
      }, 0);
      return sum + saleProfit;
    }, 0);
    return calculatedProfit;
  }, [dashboardData]);

  const overviewCards = useMemo(() => {
    const overview = dashboardData?.overview;

    return [
      {
        title: 'Lojas cadastradas',
        value: overview ? formatNumber(overview.totalStores) : '--',
        helper: overview
          ? `${formatNumber(overview.activeStores)} ativas`
          : 'Status não disponível',
        icon: Store,
      },
      {
        title: 'Usuários no sistema',
        value: overview ? formatNumber(overview.totalUsers) : '--',
        helper: overview ? `${formatNumber(overview.totalSales)} vendas registradas` : '---',
        icon: Users,
      },
      {
        title: 'Produtos ativos',
        value: overview ? formatNumber(overview.totalProducts) : '--',
        helper: overview ? 'Catálogo atualizado automaticamente' : '---',
        icon: Package,
      },
      {
        title: 'Receita mensal',
        value: overview ? formatCurrency(overview.monthlyRevenue) : '--',
        helper: overview ? `${formatNumber(overview.totalSales)} pedidos no período` : '---',
        icon: DollarSign,
      },
      {
        title: 'Lucro total',
        value: formatCurrency(totalProfit),
        helper: 'Lucro acumulado das vendas recentes',
        icon: TrendingUp,
      },
    ];
  }, [dashboardData, formatNumber, formatCurrency, totalProfit]);

  const performance = summaryData?.performance;

  const operationalMetrics = useMemo(
    () => [
      {
        title: 'Taxa de atividade da equipe',
        value: formatPercent(performance?.users?.activityRate ?? 0),
        helper: `${formatNumber(performance?.users?.active ?? 0)} usuários ativos nesta semana`,
        progress: clampPercentage(performance?.users?.activityRate),
        tone: 'default' as const,
      },
      {
        title: 'Saúde do estoque',
        value: formatPercent(performance?.products?.stockHealth ?? 0),
        helper: `${formatNumber(performance?.products?.lowStock ?? 0)} itens em atenção`,
        progress: clampPercentage(performance?.products?.stockHealth),
        tone: 'success' as const,
      },
      {
        title: 'Taxa de erro do sistema',
        value: formatPercent(performance?.system?.errorRate ?? 0),
        helper: `${formatNumber(performance?.system?.errors ?? 0)} erros rastreados nas últimas 24h`,
        progress: clampPercentage(100 - (performance?.system?.errorRate ?? 0)),
        tone: 'destructive' as const,
      },
    ],
    [formatNumber, formatPercent, performance]
  );

  const quickActions = useMemo(() => {
    const overview = dashboardData?.overview;

    return [
      {
        name: 'Gerenciar lojas',
        description: 'Cadastre unidades, estoque manual e horários.',
        href: '/admin/stores',
        indicator: overview ? `${formatNumber(overview.totalStores)} lojas` : undefined,
        icon: Store,
      },
      {
        name: 'Equipe e usuários',
        description: 'Permissões, acesso e acompanhamento de desempenho.',
        href: '/admin/users',
        indicator: overview ? `${formatNumber(summaryData?.performance?.users?.total ?? 0)} membros` : undefined,
        icon: Users,
      },
      {
        name: 'Catálogo de produtos',
        description: 'Atualize estoque, preços e disponibilidade.',
        href: '/admin/products',
        indicator: overview ? `${formatNumber(overview.totalProducts)} itens` : undefined,
        icon: Package,
      },
      {
        name: 'Relatórios consolidados',
        description: 'Gere relatórios financeiros e operacionais.',
        href: '/admin/reports',
        indicator: summaryData?.summary
          ? `${formatNumber(summaryData.summary.totalAlerts ?? 0)} alertas`
          : undefined,
        icon: BarChart3,
      },
    ];
  }, [dashboardData, summaryData, formatNumber]);

  // Combinar notificações reais do banco com notificações do sistema
  // Priorizar notificações reais do banco de dados (mais recentes e específicas)
  const notificationsList = useMemo(() => {
    const realNotificationsFormatted = realNotifications.map(n => ({
      id: n.id,
      type: n.type === 'ADMIN_NEW_SALE' || n.type === 'MANAGER_NEW_SALE' || n.type === 'EMPLOYEE_SALE_CREATED' 
        ? 'INFO' 
        : n.type?.includes('LOW_STOCK') || n.type?.includes('OUT_OF_STOCK')
        ? 'WARNING'
        : n.type?.includes('ERROR') || n.type?.includes('SYSTEM_ERROR')
        ? 'ERROR'
        : 'INFO',
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      actionUrl: n.actionUrl,
      isRead: n.isRead,
    }));

    // Adicionar notificações do sistema (estoque baixo, etc.) apenas se não houver notificações reais similares
    const systemNotificationsFormatted = systemNotifications.map(n => ({
      id: `system-${n.type}-${n.createdAt}`,
      type: n.type || 'INFO',
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      actionUrl: null,
      isRead: false,
    }));

    // Combinar: primeiro notificações reais, depois notificações do sistema
    const combined = [...realNotificationsFormatted, ...systemNotificationsFormatted];
    
    // Remover duplicatas baseadas no título e mensagem
    const unique = combined.filter((n, index, self) => 
      index === self.findIndex((t) => t.title === n.title && t.message === n.message)
    );
    
    // Ordenar por data (mais recentes primeiro)
    return unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [realNotifications, systemNotifications]);

  // Usar alertas do sistema
  const alertsList = useMemo(() => {
    return systemAlerts.map(alert => ({
      id: `alert-${alert.type}-${alert.createdAt}`,
      type: alert.type || 'WARNING',
      title: alert.title,
      message: alert.message,
      createdAt: alert.createdAt,
    }));
  }, [systemAlerts]);

  // Hero highlights com notificações
  const heroHighlights = useMemo(() => {
    const overview = dashboardData?.overview;
    const unreadCount = realNotifications.filter(n => !n.isRead).length;
    const criticalAlerts = alertsList.filter(a => a.type === 'ERROR').length;

    return [
      {
        label: 'Lojas operando',
        value: overview
          ? `${formatNumber(overview.activeStores)} / ${formatNumber(overview.totalStores)}`
          : '--',
        description: 'Unidades com estoque e caixa ativos',
        icon: Store,
      },
      {
        label: 'Notificações recentes',
        value: formatNumber(notificationsList.length),
        description: unreadCount > 0
          ? `${formatNumber(unreadCount)} não lidas`
          : criticalAlerts > 0
          ? `${formatNumber(criticalAlerts)} alertas críticos`
          : 'Tudo atualizado',
        icon: AlertTriangle,
      },
      {
        label: 'Receita acumulada',
        value: overview ? formatCurrency(overview.monthlyRevenue) : '--',
        description: 'Total de vendas consolidadas no mês',
        icon: DollarSign,
      },
    ];
  }, [dashboardData, notificationsList, realNotifications, alertsList, formatNumber, formatCurrency]);

  const recentSales = dashboardData?.recentSales ?? [];
  const topProducts = dashboardData?.topProducts ?? [];

  const calculateSaleTotal = (sale: DashboardSale) =>
    sale.items.reduce((total, item) => {
      const quantity = item.quantity ?? 0;
      const price = Number(item.unitPrice ?? 0);
      return total + quantity * price;
    }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader size={40} className="mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando informações do painel...</p>
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
              Visão executiva
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Bem-vindo ao controle da sua operação
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Monitore indicadores críticos, acompanhe alertas em tempo real e mantenha suas lojas,
                equipes e produtos alinhados às metas do negócio.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link href="/admin/reports">
                  Abrir relatórios
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                asChild
              >
                <Link href="/admin/orders-online">Ver pedidos online</Link>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
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
                Atalhos diretos para as áreas mais acessadas do painel administrativo.
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
                      <span>{action.indicator ?? 'Atualize a área correspondente'}</span>
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
            <CardTitle className="text-lg font-semibold text-foreground">Indicadores operacionais</CardTitle>
            <CardDescription>Metas de eficiência e saúde da operação acompanhadas em tempo real.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {operationalMetrics.map((metric) => (
              <div key={metric.title} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{metric.title}</p>
                    <p className="text-xs text-muted-foreground">{metric.helper}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      metric.tone === 'destructive'
                        ? 'text-destructive'
                        : metric.tone === 'success'
                        ? 'text-emerald-600'
                        : 'text-foreground'
                    }`}
                  >
                    {metric.value}
                  </span>
                </div>
                <Progress
                  value={metric.progress}
                  className={`h-2 ${
                    metric.tone === 'destructive'
                      ? '[&>div]:bg-destructive'
                      : metric.tone === 'success'
                      ? '[&>div]:bg-emerald-500'
                      : ''
                  }`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 border border-border shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">Notificações e alertas</CardTitle>
              <CardDescription>
                Ocorrências do sistema, estoque e operações que exigem acompanhamento imediato.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-transparent text-xs text-muted-foreground">
              {formatNumber(notificationsList.length + alertsList.length)} registros
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notificações
                </p>
                {realNotifications.filter(n => !n.isRead).length > 0 && (
                  <Badge variant="default" className="bg-primary text-xs">
                    {realNotifications.filter(n => !n.isRead).length} não lidas
                  </Badge>
                )}
              </div>
              {notificationsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma notificação registrada.</p>
              ) : (
                notificationsList.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-xl border p-3 text-sm transition hover:shadow-md cursor-pointer ${
                      getNotificationToneClasses(notification.type)
                    } ${!notification.isRead ? 'ring-2 ring-primary/20 bg-opacity-95' : ''}`}
                    onClick={async () => {
                      // Marcar como lida se tiver ID (não é do sistema)
                      if (notification.id && !notification.id.startsWith('system-') && !notification.isRead) {
                        try {
                          await notificationsAPI.markAsRead(notification.id);
                          // Atualizar estado local
                          setRealNotifications(prev => 
                            prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                          );
                        } catch (error) {
                          console.error('Erro ao marcar notificação como lida:', error);
                        }
                      }
                      // Navegar para a ação se houver URL
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        {!notification.isRead && !notification.id?.startsWith('system-') && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></span>
                        )}
                        <span className="font-semibold">{notification.title}</span>
                      </div>
                      <Badge variant="outline" className="border-transparent text-[10px] uppercase ml-2">
                        {getNotificationLabel(notification.type)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-current/80">{notification.message}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[11px] text-current/60">
                        {dateTimeFormatter.format(new Date(notification.createdAt))}
                      </p>
                      {notification.actionUrl && (
                        <span className="text-[11px] text-primary hover:underline">
                          Ver detalhes →
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Alertas do sistema
              </p>
              {alertsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem alertas críticos no momento.</p>
              ) : (
                alertsList.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-xl border p-3 text-sm ${getNotificationToneClasses(alert.type)}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{alert.title}</span>
                      <Badge variant="outline" className="border-transparent text-[10px] uppercase">
                        {getNotificationLabel(alert.type)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-current/80">{alert.message}</p>
                    <p className="mt-3 text-[11px] text-current/60">
                      {dateTimeFormatter.format(new Date(alert.createdAt))}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Resumo analítico</CardTitle>
            <CardDescription>Métricas consolidadas para tomada de decisão rápida.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-muted/60 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Crescimento de vendas (24h)
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatNumber(performance?.sales?.today ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Ontem: {formatNumber(performance?.sales?.yesterday ?? 0)} · Semana: {formatNumber(performance?.sales?.lastWeek ?? 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-muted/60 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Novos usuários (7 dias)
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatNumber(performance?.users?.newThisWeek ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total ativo: {formatNumber(performance?.users?.total ?? 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-muted/60 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Alertas críticos abertos
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-foreground">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {formatNumber(summaryData?.summary?.criticalAlerts ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total de alertas: {formatNumber(summaryData?.summary?.totalAlerts ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 border border-border shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">Vendas recentes</CardTitle>
              <CardDescription>Últimos registros de venda com destaque para valores e clientes.</CardDescription>
            </div>
            <Button variant="ghost" className="text-sm text-primary hover:bg-primary/10" asChild>
              <Link href="/admin/sales">
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
                        {sale.store?.name ? `${sale.store?.name} • ` : ''}
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

        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Produtos em destaque</CardTitle>
            <CardDescription>Itens com melhor avaliação e desempenho de vendas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto em destaque disponível.</p>
            ) : (
              topProducts.map((product) => (
                <div key={product.id} className="flex flex-col gap-2 rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.store?.name ?? 'Loja não informada'}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-transparent text-xs text-primary">
                      {formatCurrency(product.price)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {formatNumber(product.rating ?? 0)} avaliação
                    </span>
                    <span>{formatNumber(product.reviewCount ?? 0)} avaliações</span>
                    <span>Estoque: {formatNumber(product.stock ?? 0)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
 