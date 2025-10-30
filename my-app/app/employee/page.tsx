'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Package,
  Calendar,
  Target,
  BarChart3,
  ArrowRight,
  Loader2,
  Plus
} from 'lucide-react';

interface TimeClockEntry {
  id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
}

interface SaleEntry {
  id: string;
  totalAmount: number;
  createdAt: string;
  customer?: { name: string };
  items?: Array<{ product: { name: string } }>;
}

export default function EmployeeDashboard() {
  const { user, isAuthenticated, token } = useAppStore();
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<'hoje' | '7dias' | '30dias'>('hoje');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVendas: 0,
    numeroVendas: 0,
    ticketMedio: 0,
    metaDia: 0
  });
  const [lastTimeClockEntries, setLastTimeClockEntries] = useState<any[]>([]);
  const [lastSales, setLastSales] = useState<any[]>([]);
  const [hasOpenEntry, setHasOpenEntry] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeClockEntry | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
  }, [user, isAuthenticated, router]);

  useEffect(() => {
    if (user?.id && token) {
      fetchDashboardData();
    }
  }, [user?.id, token, timeFilter]);

  const fetchDashboardData = async () => {
    if (!user?.id || !token) return;

    try {
      setLoading(true);

      // Buscar dados de vendas e ponto em paralelo
      const [salesData, timeClockData] = await Promise.all([
        fetchSalesData(),
        fetchTimeClockData()
      ]);

      // Atualizar estatísticas de vendas
      if (salesData.sales) {
        const total = salesData.sales.reduce((sum: number, sale: SaleEntry) => 
          sum + Number(sale.totalAmount), 0);
        const count = salesData.sales.length;
        const avg = count > 0 ? total / count : 0;
        
        setStats({
          totalVendas: total,
          numeroVendas: count,
          ticketMedio: avg,
          metaDia: 0 // Calcular meta se necessário
        });

        // Processar últimas vendas
        const formattedSales = salesData.sales
          .slice(0, 5)
          .map((sale: SaleEntry) => ({
            cliente: sale.customer?.name || 'Cliente Avulso',
            produto: sale.items?.[0]?.product?.name || 'Produto',
            preco: Number(sale.totalAmount),
            hora: new Date(sale.createdAt).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          }));
        
        setLastSales(formattedSales);
      }

      // Atualizar dados de ponto
      if (timeClockData.records) {
        // Encontrar entrada aberta
        const openEntry = timeClockData.records.find((entry: TimeClockEntry) => !entry.clockOut);
        setHasOpenEntry(!!openEntry);
        setCurrentEntry(openEntry || null);

        // Formatar últimos 5 dias de ponto
        const formattedEntries = timeClockData.records
          .slice(0, 5)
          .map((entry: TimeClockEntry) => {
            // Parse da data no formato YYYY-MM-DD
            const [year, month, day] = entry.date.split('-');
            const formattedDate = `${day}/${month}`;
            
            // Formatar total de horas
            let totalFormatted = '-- h';
            if (entry.totalHours !== null && entry.totalHours !== undefined) {
              const hours = Math.floor(entry.totalHours);
              const minutes = Math.round((entry.totalHours - hours) * 60);
              totalFormatted = `${hours}h ${minutes}m`;
            }
            
            return {
              date: formattedDate,
              entrada: entry.clockIn || '--',
              saida: entry.clockOut || '--',
              total: totalFormatted
            };
          });
        
        setLastTimeClockEntries(formattedEntries);
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
      const startDate = new Date();
      
      switch (timeFilter) {
        case 'hoje':
          startDate.setHours(0, 0, 0, 0);
          break;
        case '7dias':
          startDate.setDate(today.getDate() - 7);
          break;
        case '30dias':
          startDate.setDate(today.getDate() - 30);
          break;
      }

      // Buscar todas as vendas do período (filtra por loja automaticamente no backend)
      const allSales = await salesAPI.getByDateRange(
        startDate.toISOString(),
        today.toISOString()
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
      startDate.setDate(endDate.getDate() - 5); // Últimos 5 dias

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
      {/* Time Clock Card */}
      <Card className="bg-white shadow-xl border border-gray-200 rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#8B4513] text-white pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Clock className="h-7 w-7" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Controle de Ponto</CardTitle>
                <p className="text-sm text-white/80 mt-1">Registre sua entrada e saída</p>
              </div>
            </div>
            <Calendar className="h-10 w-10 text-white/50" />
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Bater Ponto Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleBaterPonto}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12 py-8 text-xl font-bold rounded-2xl shadow-2xl flex items-center space-x-4 transform hover:scale-105 transition-all duration-300 group"
              size="lg"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Clock className="h-6 w-6" />
              </div>
              <span>BATER PONTO AGORA</span>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>

          {/* Status Atual */}
          <div className={`rounded-2xl p-6 shadow-lg ${hasOpenEntry ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  {hasOpenEntry ? <CheckCircle className="h-8 w-8 text-white" /> : <XCircle className="h-8 w-8 text-white" />}
                </div>
                <div>
                  <p className="text-sm text-white/90">Status Atual</p>
                  {currentEntry ? (
                    <p className="text-xl font-bold text-white">
                      Entrada: {currentEntry.clockIn || '--'} | Saída: --
                    </p>
                  ) : (
                    <p className="text-xl font-bold text-white">Ponto fechado</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`w-4 h-4 ${hasOpenEntry ? 'bg-green-300' : 'bg-gray-300'} rounded-full animate-pulse shadow-lg`}></div>
                <p className="text-xs text-white/80 mt-2">{hasOpenEntry ? 'Em serviço' : 'Fora de serviço'}</p>
              </div>
            </div>
          </div>

          {/* Últimos 5 dias */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-5 w-5 text-[#3e2626]" />
              <h3 className="text-lg font-bold text-gray-900">Últimos registros</h3>
            </div>
            {lastTimeClockEntries.length > 0 ? (
              <div className="space-y-3">
                {lastTimeClockEntries.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between py-4 px-6 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl hover:shadow-lg hover:border-[#3e2626]/30 transition-all duration-300 group">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-2 h-2 bg-[#8B4513] rounded-full group-hover:bg-[#3e2626] transition-colors"></div>
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-base font-semibold text-gray-900 min-w-[80px]">{entry.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base text-gray-700 font-medium">{entry.entrada}</span>
                      <span className="text-gray-400">-</span>
                      <span className="text-base text-gray-700 font-medium">{entry.saida}</span>
                    </div>
                    <div className="w-24 text-right">
                      <span className="text-base font-bold text-[#3e2626]">{entry.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum registro de ponto encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Overview */}
      <Card className="bg-white shadow-xl border border-gray-200 rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Visão de Vendas</CardTitle>
                <p className="text-sm text-white/80 mt-1">Acompanhe seu desempenho</p>
              </div>
            </div>

          </div>
          
          {/* Time Filters */}
          <div className="flex space-x-3 mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimeFilter('hoje')}
              className={`text-white hover:text-white hover:bg-white/20 ${timeFilter === 'hoje' ? 'bg-white text-[#3e2626] font-semibold shadow-lg' : ''} rounded-xl transition-all duration-300`}
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimeFilter('7dias')}
              className={`text-white hover:text-white hover:bg-white/20 ${timeFilter === '7dias' ? 'bg-white text-[#3e2626] font-semibold shadow-lg' : ''} rounded-xl transition-all duration-300`}
            >
              7 dias
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimeFilter('30dias')}
              className={`text-white hover:text-white hover:bg-white/20 ${timeFilter === '30dias' ? 'bg-white text-[#3e2626] font-semibold shadow-lg' : ''} rounded-xl transition-all duration-300`}
            >
              30 dias
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative group">
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255,255,255,0.2) 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }}></div>
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="h-10 w-10 text-blue-200 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-blue-100 bg-white/20 px-3 py-1 rounded-full">+12%</span>
                </div>
                <p className="text-3xl font-bold mb-1">{formatCurrency(stats.totalVendas)}</p>
                <p className="text-sm text-blue-100 font-medium">Total Vendido</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative group">
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255,255,255,0.2) 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }}></div>
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <ShoppingCart className="h-10 w-10 text-green-200 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-green-100 bg-white/20 px-3 py-1 rounded-full">+8%</span>
                </div>
                <p className="text-3xl font-bold mb-1">{stats.numeroVendas}</p>
                <p className="text-sm text-green-100 font-medium">Nº de Vendas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative group">
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255,255,255,0.2) 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }}></div>
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <Receipt className="h-10 w-10 text-purple-200 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-purple-100 bg-white/20 px-3 py-1 rounded-full">+5%</span>
                </div>
                <p className="text-3xl font-bold mb-1">{formatCurrency(stats.ticketMedio)}</p>
                <p className="text-sm text-purple-100 font-medium">Ticket Médio</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden relative group">
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255,255,255,0.2) 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }}></div>
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <Target className="h-10 w-10 text-orange-200 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-orange-100 bg-white/20 px-3 py-1 rounded-full">85%</span>
                </div>
                <p className="text-3xl font-bold mb-1">{stats.metaDia}%</p>
                <p className="text-sm text-orange-100 font-medium">Meta do Dia</p>
              </CardContent>
            </Card>
          </div>

          {/* Últimas 5 Vendas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-[#3e2626]" />
                <h3 className="text-lg font-bold text-gray-900">Últimas Vendas</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/employee/sales')}
                className="text-[#3e2626] hover:bg-[#3e2626]/10"
              >
                Ver todas <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            {lastSales.length > 0 ? (
              <div className="space-y-3">
                {lastSales.map((sale, index) => (
                  <div key={index} className="flex items-center justify-between py-4 px-6 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl hover:shadow-lg hover:border-[#8B4513]/30 transition-all duration-300 group cursor-pointer">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#3e2626] to-[#8B4513] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-gray-900">{sale.cliente}</p>
                        <p className="text-sm text-gray-600">{sale.produto}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#3e2626]">{formatCurrency(sale.preco)}</p>
                      <p className="text-xs text-gray-500">{sale.hora}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma venda encontrada</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
