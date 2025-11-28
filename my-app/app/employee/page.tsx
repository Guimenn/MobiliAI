'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { salesAPI, timeClockAPI, notificationsAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  Clock,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  User,
  Package,
  Receipt,
  Target,
  Truck,
} from 'lucide-react';

interface TimeClockEntry {
  id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  status?: string;
}

interface SaleEntry {
  id: string;
  totalAmount: number;
  createdAt: string;
  customer?: { name: string };
  items?: Array<{ product: { name: string } }>;
  employeeId?: string;
}

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

const clampPercentage = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
};

export default function EmployeeDashboard() {
  const { user, isAuthenticated, token } = useAppStore();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Time Clock Data
  const [lastTimeClock, setLastTimeClock] = useState<TimeClockEntry | null>(null);
  const [hoursWorkedToday, setHoursWorkedToday] = useState({ hours: 0, minutes: 0 });
  const [workStatus, setWorkStatus] = useState<'Trabalhando' | 'Fora de Serviço'>('Fora de Serviço');
  const [nextAction, setNextAction] = useState<'Entrada' | 'Saída'>('Entrada');
  const [timeClockHistory, setTimeClockHistory] = useState<TimeClockEntry[]>([]);
  
  // Sales Data
  const [salesStats, setSalesStats] = useState({
    totalVendas: 0,
    numeroVendas: 0,
    ticketMedio: 0,
    metaDia: 5000,
    progressoMeta: 0,
  });
  const [salesHistory, setSalesHistory] = useState<SaleEntry[]>([]);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
  }, [user, isAuthenticated, router]);

  useEffect(() => {
    // Atualizar relógio a cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(
    async (controller?: { cancelled: boolean }) => {
      const signal = controller ?? { cancelled: false };
      if (!user?.id || !token) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const [salesData, timeClockData, notificationsResponse] = await Promise.all([
          fetchSalesData(),
          fetchTimeClockData(),
          notificationsAPI.getAll(1, 50).catch(err => {
            console.warn('Erro ao buscar notificações:', err);
            return { notifications: [], total: 0 };
          }),
        ]);

        if (signal.cancelled) return;

        // Processar dados de ponto
        if (timeClockData.records && timeClockData.records.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const todayEntry = timeClockData.records.find((entry: TimeClockEntry) => entry.date === today);
          
          if (todayEntry) {
            setLastTimeClock(todayEntry);
            setWorkStatus(todayEntry.clockOut ? 'Fora de Serviço' : 'Trabalhando');
            setNextAction(todayEntry.clockOut ? 'Entrada' : 'Saída');

            // Calcular horas trabalhadas hoje
            if (todayEntry.clockIn && todayEntry.clockOut) {
              const hours = todayEntry.totalHours || 0;
              setHoursWorkedToday({
                hours: Math.floor(hours),
                minutes: Math.round((hours - Math.floor(hours)) * 60)
              });
            } else if (todayEntry.clockIn) {
              // Calcular horas parciais se ainda está trabalhando
              const now = new Date();
              const clockInTime = new Date(`${todayEntry.date}T${todayEntry.clockIn}`);
              const diffMs = now.getTime() - clockInTime.getTime();
              const diffHours = diffMs / (1000 * 60 * 60);
              setHoursWorkedToday({
                hours: Math.floor(diffHours),
                minutes: Math.round((diffHours - Math.floor(diffHours)) * 60)
              });
            }
          }

          // Histórico de pontos (últimos 3 registros)
          setTimeClockHistory(
            timeClockData.records
              .slice(0, 3)
              .map((entry: TimeClockEntry) => ({
                ...entry,
                status: entry.clockOut ? 'Registrado' : 'Pendente'
              }))
          );
        }

        // Processar dados de vendas
        if (salesData.sales) {
          const total = salesData.sales.reduce((sum: number, sale: SaleEntry) => 
            sum + Number(sale.totalAmount), 0);
          const count = salesData.sales.length;
          const avg = count > 0 ? total / count : 0;
          const metaDia = 5000;
          const progressoMeta = metaDia > 0 ? (total / metaDia) * 100 : 0;
          
          setSalesStats({
            totalVendas: total,
            numeroVendas: count,
            ticketMedio: avg,
            metaDia: metaDia,
            progressoMeta: Math.min(progressoMeta, 100),
          });

          // Histórico de vendas (últimas 3)
          setSalesHistory(
            salesData.sales.slice(0, 3).map((sale: SaleEntry) => sale)
          );
        }

        // Processar notificações
        const notifications = notificationsResponse?.notifications || [];
        setRealNotifications(notifications);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        if (!signal.cancelled) {
          setError('Não foi possível carregar os dados do dashboard. Tente novamente em instantes.');
        }
      } finally {
        if (!signal.cancelled) {
          setIsLoading(false);
        }
      }
    },
    [user?.id, token]
  );

  useEffect(() => {
    const state = { cancelled: false };
    void fetchData(state);
    
    // Atualizar dados a cada 30 segundos
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

  const fetchSalesData = async () => {
    if (!user?.id) return { sales: [] };
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const allSales = await salesAPI.getByDateRange(
        today.toISOString(),
        endDate.toISOString()
      );

      // Filtrar apenas as vendas do funcionário logado
      const sales = allSales.filter((sale: SaleEntry & { employeeId: string }) => 
        sale.employeeId === user.id
      );

      return { sales };
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      return { sales: [] };
    }
  };

  const fetchTimeClockData = async () => {
    if (!user?.id) return { records: [] };
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7); // Últimos 7 dias

      const data = await timeClockAPI.getHistory(
        user.id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      return data;
    } catch (error) {
      console.error('Erro ao buscar ponto:', error);
      return { records: [] };
    }
  };

  const handleBaterPonto = () => {
    router.push('/employee/timeclock');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTimeLabel = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (dateString === today) return 'Hoje';
    if (dateString === yesterdayStr) return 'Ontem';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    []
  );

  const overviewCards = useMemo(() => [
    {
      title: 'Total vendido hoje',
      value: formatCurrency(salesStats.totalVendas),
      helper: `${formatNumber(salesStats.numeroVendas)} venda(s) realizada(s)`,
      icon: DollarSign,
    },
    {
      title: 'Horas trabalhadas',
      value: `${hoursWorkedToday.hours}h ${hoursWorkedToday.minutes}m`,
      helper: 'Meta: 8h diárias',
      icon: Clock,
    },
    {
      title: 'Ticket médio',
      value: formatCurrency(salesStats.ticketMedio),
      helper: 'Valor médio por venda',
      icon: Receipt,
    },
    {
      title: 'Status do ponto',
      value: workStatus,
      helper: `Próximo: ${nextAction}`,
      icon: User,
    },
  ], [salesStats, hoursWorkedToday, workStatus, nextAction]);

  const heroHighlights = useMemo(() => [
    {
      label: 'Meta do dia',
      value: formatCurrency(salesStats.metaDia),
      description: `${formatPercent(salesStats.progressoMeta)} da meta alcançada`,
      icon: Target,
    },
    {
      label: 'Vendas realizadas',
      value: formatNumber(salesStats.numeroVendas),
      description: realNotifications.filter(n => !n.isRead).length > 0
        ? `${formatNumber(realNotifications.filter(n => !n.isRead).length)} notificações não lidas`
        : 'Tudo atualizado',
      icon: ShoppingCart,
    },
    {
      label: 'Último ponto',
      value: lastTimeClock?.clockIn || lastTimeClock?.clockOut || '--:--',
      description: lastTimeClock?.clockOut ? 'Saída registrada' : lastTimeClock?.clockIn ? 'Entrada registrada' : 'Nenhum registro',
      icon: Clock,
    },
  ], [salesStats, realNotifications, lastTimeClock]);

  const quickActions = useMemo(() => [
    {
      name: 'Bater ponto',
      description: 'Registre sua entrada ou saída do trabalho.',
      href: '/employee/timeclock',
      indicator: workStatus === 'Trabalhando' ? 'Em serviço' : 'Fora de serviço',
      icon: Clock,
    },
    {
      name: 'Nova venda',
      description: 'Registre uma nova venda no PDV.',
      href: '/employee/pdv',
      indicator: `${formatNumber(salesStats.numeroVendas)} vendas hoje`,
      icon: ShoppingCart,
    },
    {
      name: 'Pedidos online',
      description: 'Gerencie pedidos para retirada na loja.',
      href: '/employee/orders-online',
      indicator: 'Acompanhar entregas',
      icon: Truck,
    },
    {
      name: 'Histórico de vendas',
      description: 'Visualize todas as suas vendas realizadas.',
      href: '/employee/sales',
      indicator: `${formatNumber(salesStats.numeroVendas)} registros`,
      icon: Receipt,
    },
  ], [salesStats, workStatus]);

  const operationalMetrics = useMemo(() => [
    {
      title: 'Progresso da meta diária',
      value: formatPercent(salesStats.progressoMeta),
      helper: `${formatCurrency(salesStats.totalVendas)} de ${formatCurrency(salesStats.metaDia)}`,
      progress: clampPercentage(salesStats.progressoMeta),
      tone: 'success' as const,
    },
    {
      title: 'Horas trabalhadas hoje',
      value: `${hoursWorkedToday.hours}h ${hoursWorkedToday.minutes}m`,
      helper: 'Meta: 8h diárias',
      progress: clampPercentage((hoursWorkedToday.hours * 60 + hoursWorkedToday.minutes) / 8 / 60 * 100),
      tone: 'default' as const,
    },
    {
      title: 'Taxa de conversão',
      value: salesStats.numeroVendas > 0 ? '100%' : '0%',
      helper: `${formatNumber(salesStats.numeroVendas)} venda(s) concluída(s)`,
      progress: salesStats.numeroVendas > 0 ? 100 : 0,
      tone: 'default' as const,
    },
  ], [salesStats, hoursWorkedToday]);

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
        <Button className="mt-6" onClick={() => fetchData()}>
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
              Painel do funcionário
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Bem-vindo ao seu painel de trabalho
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Acompanhe suas vendas, registre seu ponto e gerencie pedidos online em tempo real.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link href="/employee/pdv">
                  Nova venda
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={handleBaterPonto}
              >
                Bater ponto
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
                Atalhos diretos para as áreas mais acessadas do seu painel.
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
            <CardTitle className="text-lg font-semibold text-foreground">Indicadores operacionais</CardTitle>
            <CardDescription>Metas e desempenho acompanhados em tempo real.</CardDescription>
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
              <CardTitle className="text-lg font-semibold text-foreground">Vendas recentes</CardTitle>
              <CardDescription>Últimas vendas realizadas hoje com destaque para valores e clientes.</CardDescription>
            </div>
            <Button variant="ghost" className="text-sm text-primary hover:bg-primary/10" asChild>
              <Link href="/employee/sales">
                Ver todas
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {salesHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma venda registrada hoje.</p>
            ) : (
              salesHistory.map((sale) => (
                <div
                  key={sale.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card/80 p-4 transition hover:border-primary/40 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {sale.customer?.name || 'Cliente não identificado'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-start text-sm sm:items-end">
                    <span className="font-semibold text-foreground">{formatCurrency(sale.totalAmount)}</span>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs text-muted-foreground">Concluída</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Histórico de pontos</CardTitle>
            <CardDescription>Últimos registros de entrada e saída.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {timeClockHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro de ponto disponível.</p>
            ) : (
              timeClockHistory.map((entry, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {entry.clockIn ? 'Entrada' : entry.clockOut ? 'Saída' : '--'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTimeLabel(entry.date)}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-transparent text-xs text-primary">
                      {entry.clockIn || entry.clockOut || '--:--'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Registrado
                    </span>
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
