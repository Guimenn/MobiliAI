'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { adminAPI } from '@/lib/api';
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

type DashboardOverview = {
  totalStores: number;
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  monthlyRevenue: number;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (controller?: { cancelled: boolean }) => {
      const signal = controller ?? { cancelled: false };
      setIsLoading(true);
      setError(null);

      try {
        const [dashboardResponse, summaryResponse] = await Promise.all([
          adminAPI.getDashboard(),
          adminAPI.getDashboardSummary(),
        ]);

        if (signal.cancelled) {
          return;
        }

        setDashboardData(dashboardResponse);
        setSummaryData(summaryResponse);
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
    return () => {
      state.cancelled = true;
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
    ];
  }, [dashboardData, formatNumber, formatCurrency]);

  const heroHighlights = useMemo(() => {
    const overview = dashboardData?.overview;
    const summary = summaryData?.summary;

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
        value: summary ? formatNumber(summary.totalNotifications ?? 0) : '--',
        description: summary
          ? `${formatNumber(summary.criticalAlerts ?? 0)} críticas aguardando ação`
          : 'Sem dados recentes',
        icon: AlertTriangle,
      },
      {
        label: 'Receita acumulada',
        value: overview ? formatCurrency(overview.monthlyRevenue) : '--',
        description: 'Total de vendas consolidadas no mês',
        icon: DollarSign,
      },
    ];
  }, [dashboardData, summaryData, formatNumber, formatCurrency]);

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

  const notificationsList = summaryData?.notifications ?? [];
  const alertsList = summaryData?.alerts ?? [];

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
      <section className="rounded-3xl border border-border bg-primary px-8 py-10 text-primary-foreground shadow-sm">
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

          <div className="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-3 lg:max-w-lg">
            {heroHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-2xl font-semibold">{item.value}</p>
                  <p className="text-xs uppercase tracking-wide text-primary-foreground/70">{item.label}</p>
                  <p className="mt-1 text-xs text-primary-foreground/70">{item.description}</p>
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
              {formatNumber(summaryData?.summary?.totalNotifications ?? 0)} registros
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notificações
              </p>
              {notificationsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma notificação registrada.</p>
              ) : (
                notificationsList.map((notification, index) => (
                  <div
                    key={`${notification.title}-${index}`}
                    className={`rounded-xl border p-3 text-sm ${getNotificationToneClasses(notification.type)}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{notification.title}</span>
                      <Badge variant="outline" className="border-transparent text-[10px] uppercase">
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
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Alertas do sistema
              </p>
              {alertsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem alertas críticos no momento.</p>
              ) : (
                alertsList.map((alert, index) => (
                  <div
                    key={`${alert.title}-${index}`}
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
 