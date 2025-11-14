'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { salesAPI, timeClockAPI } from '@/lib/api';
import { 
  Clock, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Receipt,
  Target,
  ArrowRight,
  Loader2,
  User,
  AlertTriangle,
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

export default function EmployeeDashboard() {
  const { user, isAuthenticated, token } = useAppStore();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Time Clock Data
  const [lastTimeClock, setLastTimeClock] = useState<TimeClockEntry | null>(null);
  const [hoursWorkedToday, setHoursWorkedToday] = useState({ hours: 0, minutes: 0 });
  const [hasOpenEntry, setHasOpenEntry] = useState(false);
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

  useEffect(() => {
    if (user?.id && token) {
      fetchDashboardData();
      // Atualizar dados a cada 30 segundos
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id, token]);

  const fetchDashboardData = async () => {
    if (!user?.id || !token) return;

    try {
      setLoading(true);

      // Buscar dados de vendas e ponto em paralelo
      const [salesData, timeClockData] = await Promise.all([
        fetchSalesData(),
        fetchTimeClockData()
      ]);

      // Processar dados de ponto
      if (timeClockData.records && timeClockData.records.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const todayEntry = timeClockData.records.find((entry: TimeClockEntry) => entry.date === today);
        
        if (todayEntry) {
          setLastTimeClock(todayEntry);
          setHasOpenEntry(!todayEntry.clockOut);
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
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#3e2626] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Seção de Ponto */}
      <div className="space-y-6">
        {/* Cards Superiores - Ponto */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Último Ponto */}
          <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium mb-2">Último Ponto</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {lastTimeClock?.clockIn || lastTimeClock?.clockOut || '--:--'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">
                      {lastTimeClock?.clockOut ? 'Saída registrada' : lastTimeClock?.clockIn ? 'Entrada registrada' : 'Nenhum registro'}
                    </span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horas Trabalhadas */}
          <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium mb-2">Horas Trabalhadas</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {hoursWorkedToday.hours}h {hoursWorkedToday.minutes}m
                  </p>
                  <p className="text-sm text-gray-600">Meta: 8h</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium mb-2">Status</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{workStatus}</p>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Próximo: {nextAction}</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="h-7 w-7 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relógio e Botão Bater Ponto */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Relógio Grande */}
          <Card className="lg:col-span-2 bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="text-7xl font-bold text-[#3e2626] mb-4">
                  {formatTime(currentTime)}
                </div>
                <p className="text-lg text-gray-600 font-medium">Horário atual</p>
                <div className="mt-8">
                  <Button
                    onClick={handleBaterPonto}
                    className="bg-[#3e2626] hover:bg-[#2a1f1f] text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-xl flex items-center space-x-3 mx-auto transform hover:scale-105 transition-all duration-300"
                    size="lg"
                  >
                    <Clock className="h-6 w-6" />
                    <span>Bater Ponto</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Pontos */}
          <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Histórico de Pontos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {timeClockHistory.length > 0 ? (
                timeClockHistory.map((entry, index) => (
                  <div key={index} className="space-y-2 pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        {entry.clockIn ? 'Entrada' : entry.clockOut ? 'Saída' : '--'}
                      </span>
                      <span className="text-xs text-gray-500">{getTimeLabel(entry.date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium text-gray-700">
                        {entry.clockIn || entry.clockOut || '--:--'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">Registrado</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhum registro</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção de Vendas */}
      <div className="space-y-6">
        <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden">
          <CardHeader className="bg-[#3e2626] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">Vendas do Dia</CardTitle>
                  <p className="text-sm text-white/80 mt-1">Acompanhe seu desempenho</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Cards de Métricas de Vendas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Vendido */}
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <DollarSign className="h-8 w-8 text-blue-200" />
                    <span className="text-xs font-semibold text-blue-100 bg-white/20 px-2 py-1 rounded-full">
                      {salesStats.progressoMeta.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold mb-1">{formatCurrency(salesStats.totalVendas)}</p>
                  <p className="text-xs text-blue-100 font-medium">Total Vendido</p>
                </CardContent>
              </Card>

              {/* Nº de Vendas */}
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <ShoppingCart className="h-8 w-8 text-green-200" />
                    <span className="text-xs font-semibold text-green-100 bg-white/20 px-2 py-1 rounded-full">
                      +{salesStats.numeroVendas}
                    </span>
                  </div>
                  <p className="text-2xl font-bold mb-1">{salesStats.numeroVendas}</p>
                  <p className="text-xs text-green-100 font-medium">Nº de Vendas</p>
                </CardContent>
              </Card>

              {/* Ticket Médio */}
              <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Receipt className="h-8 w-8 text-purple-200" />
                    <span className="text-xs font-semibold text-purple-100 bg-white/20 px-2 py-1 rounded-full">
                      Média
                    </span>
                  </div>
                  <p className="text-2xl font-bold mb-1">{formatCurrency(salesStats.ticketMedio)}</p>
                  <p className="text-xs text-purple-100 font-medium">Ticket Médio</p>
                </CardContent>
              </Card>

              {/* Meta do Dia */}
              <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Target className="h-8 w-8 text-orange-200" />
                    <span className="text-xs font-semibold text-orange-100 bg-white/20 px-2 py-1 rounded-full">
                      {salesStats.progressoMeta.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold mb-1">{formatCurrency(salesStats.metaDia)}</p>
                  <p className="text-xs text-orange-100 font-medium">Meta do Dia</p>
                </CardContent>
              </Card>
            </div>

            {/* Grid com Histórico de Vendas e Ações Rápidas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Histórico de Vendas */}
              <Card className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-gray-900">Histórico de Vendas</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => router.push('/employee/sales')}
                      className="text-[#3e2626] hover:bg-[#3e2626]/10"
                    >
                      Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {salesHistory.length > 0 ? (
                    salesHistory.map((sale, index) => (
                      <div key={index} className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-[#3e2626] rounded-lg flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">
                              {sale.customer?.name || 'Cliente Avulso'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-[#3e2626]">{formatCurrency(Number(sale.totalAmount))}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600 font-medium">Concluída</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Nenhuma venda hoje</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ação Rápida - Nova Venda */}
              <Card className="bg-[#3e2626] text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto">
                      <ShoppingCart className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">Nova Venda</h3>
                      <p className="text-sm text-white/90 mb-4">
                        Registre uma nova venda rapidamente
                      </p>
                      <Button
                        onClick={() => router.push('/employee/pdv')}
                        className="bg-white text-[#3e2626] hover:bg-white/90 w-full font-semibold mb-2"
                      >
                        Criar Venda
                      </Button>
                      <Button
                        onClick={() => router.push('/employee/orders-online')}
                        variant="outline"
                        className="bg-white/10 text-white border-white/30 hover:bg-white/20 w-full font-semibold"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Pedidos Online
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}