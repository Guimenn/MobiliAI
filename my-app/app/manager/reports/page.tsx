'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { managerAPI, salesAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { 
  DollarSign, 
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  BarChart,
  Download,
  RefreshCw,
  Calendar,
  CreditCard,
  Clock,
  Trophy,
  Activity,
  Loader2
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';

const COLORS = ['#3e2626', '#6b4e3d', '#8b6f47', '#a67c52', '#c49a6a'];

export default function ManagerReportsPage() {
  const { user, isAuthenticated } = useAppStore();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [salesByPeriod, setSalesByPeriod] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated && user && user.role === 'STORE_MANAGER') {
      loadReportsData();
    }
  }, [isAuthenticated, user]);

  const loadReportsData = async () => {
    if (!user?.storeId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Buscar vendas da loja
      const sales = await salesAPI.getAll(user.storeId);
      const salesArray = Array.isArray(sales) ? sales : [];
      setSalesData(salesArray);

      // Processar dados
      processSalesByPeriod(salesArray);
      processTopProducts(salesArray);
      calculateSummary(salesArray);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar relatórios', {
        description: error.response?.data?.message || 'Tente novamente mais tarde'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processSalesByPeriod = (sales: any[]) => {
    // Agrupar vendas por data (últimos 7 dias)
    const salesMap = new Map();
    const today = new Date();
    
    // Inicializar últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      salesMap.set(dateKey, 0);
    }
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt);
      const dateKey = saleDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (salesMap.has(dateKey)) {
        const current = salesMap.get(dateKey);
        salesMap.set(dateKey, current + Number(sale.totalAmount || 0));
      }
    });

    // Converter para array e ordenar por data
    const sortedSales = Array.from(salesMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });

    setSalesByPeriod(sortedSales);
  };

  const processTopProducts = (sales: any[]) => {
    // Agrupar produtos vendidos
    const productsMap = new Map();
    
    sales.forEach(sale => {
      sale.items?.forEach((item: any) => {
        const productName = item.product?.name || 'Produto sem nome';
        if (productsMap.has(productName)) {
          const current = productsMap.get(productName);
          productsMap.set(productName, {
            name: productName,
            quantity: current.quantity + (item.quantity || 0),
            revenue: current.revenue + Number(item.totalPrice || item.unitPrice * item.quantity || 0)
          });
        } else {
          productsMap.set(productName, {
            name: productName,
            quantity: item.quantity || 0,
            revenue: Number(item.totalPrice || item.unitPrice * item.quantity || 0)
          });
        }
      });
    });

    // Converter para array, ordenar por receita e pegar top 5
    const sortedProducts = Array.from(productsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setTopProducts(sortedProducts);
  };

  const calculateSummary = (sales: any[]) => {
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
    const totalSales = sales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calcular por método de pagamento
    const paymentMethods = new Map();
    sales.forEach(sale => {
      const method = sale.paymentMethod || 'OUTRO';
      if (paymentMethods.has(method)) {
        const current = paymentMethods.get(method);
        paymentMethods.set(method, {
          method,
          count: current.count + 1,
          total: current.total + Number(sale.totalAmount || 0)
        });
      } else {
        paymentMethods.set(method, {
          method,
          count: 1,
          total: Number(sale.totalAmount || 0)
        });
      }
    });

    setSummary({
      totalRevenue,
      totalSales,
      averageTicket,
      paymentMethods: Array.from(paymentMethods.values())
    });
  };

  const handleDownloadReport = () => {
    const reportData = {
      period: new Date().toISOString().split('T')[0],
      summary,
      salesByPeriod,
      topProducts,
      sales: salesData
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-loja-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado com sucesso!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (!isAuthenticated || !user || user.role !== 'STORE_MANAGER') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Moderno */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#3e2626]">Relatórios da Loja</h1>
              <p className="mt-2 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date().toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
                <span className="mx-2">•</span>
                <span className="text-gray-500">
                  Dados atualizados em tempo real
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleDownloadReport}
                variant="outline"
                disabled={isLoading || !summary}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button 
                onClick={loadReportsData}
                disabled={isLoading}
                className="bg-[#3e2626] hover:bg-[#2d1c1c] text-white shadow-lg gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Atualizar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-100 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-[#3e2626] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Carregando relatórios...</p>
              <p className="text-sm text-gray-500 mt-1">Aguarde enquanto os dados são processados</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cards de Resumo Geral */}
            {summary && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#3e2626]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[#3e2626]">Receita Total</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-[#3e2626]/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-[#3e2626]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#3e2626]">
                      {formatCurrency(summary.totalRevenue)}
                    </div>
                    <p className="text-xs text-[#3e2626]/70 mt-1">Total de receitas</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#3e2626]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[#3e2626]">Total de Vendas</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-[#3e2626]/10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-[#3e2626]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#3e2626]">
                      {summary.totalSales || 0}
                    </div>
                    <p className="text-xs text-[#3e2626]/70 mt-1">Vendas realizadas</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#3e2626]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[#3e2626]">Ticket Médio</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-[#3e2626]/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-[#3e2626]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#3e2626]">
                      {formatCurrency(summary.averageTicket)}
                    </div>
                    <p className="text-xs text-[#3e2626]/70 mt-1">Valor médio por venda</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-[#3e2626]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-[#3e2626]">Produtos Vendidos</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-[#3e2626]/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-[#3e2626]" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-[#3e2626]">
                      {topProducts.reduce((sum, p) => sum + p.quantity, 0)}
                    </div>
                    <p className="text-xs text-[#3e2626]/70 mt-1">Itens vendidos</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gráficos Modernos */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-[#3e2626]">Receita por Período</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Últimos 7 dias de receita</CardDescription>
                </CardHeader>
                <CardContent>
                  {salesByPeriod.length === 0 ? (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-400">Nenhum dado disponível</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={salesByPeriod}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          label={{ value: 'Data', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                          label={{ value: 'Receita (R$)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                          labelFormatter={(label) => `Data: ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3e2626" 
                          strokeWidth={3}
                          dot={{ fill: '#3e2626', r: 5 }}
                          activeDot={{ r: 7 }}
                          name="Receita"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-[#3e2626]">Top 5 Produtos</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Ranking por receita gerada</CardDescription>
                </CardHeader>
                <CardContent>
                  {topProducts.length === 0 ? (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-400">Nenhum dado disponível</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          type="number" 
                          stroke="#6b7280" 
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                          label={{ value: 'Receita (R$)', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={140}
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            padding: '12px'
                          }}
                          formatter={(value: any, name: string, props: any) => [
                            `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                            `Receita • Qtd: ${props.payload.quantity}`
                          ]}
                          labelFormatter={(label) => `Produto: ${label}`}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="#3e2626"
                          radius={[0, 8, 8, 0]}
                          name="Receita"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Métricas de Pagamento */}
            {summary?.paymentMethods && summary.paymentMethods.length > 0 && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-[#3e2626]">Métodos de Pagamento</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Distribuição por método</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {summary.paymentMethods.map((pm: any, idx: number) => (
                      <div 
                        key={pm.method} 
                        className="p-4 bg-white rounded-lg border border-gray-100 hover:border-[#3e2626]/30 transition-colors"
                      >
                        <p className="text-xs font-medium text-[#3e2626] mb-2 uppercase">
                          {pm.method.replace('_', ' ')}
                        </p>
                        <p className="text-xl font-semibold text-[#3e2626] mb-1">{pm.count}</p>
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(pm.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Produtos Detalhado */}
            {topProducts.length > 0 && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-[#3e2626]">Top Produtos</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Mais vendidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topProducts.map((product, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#3e2626]/30 transition-colors"
                      >
                        <div className="flex-shrink-0 w-8">
                          {idx === 0 && <span className="text-xl">🥇</span>}
                          {idx === 1 && <span className="text-xl">🥈</span>}
                          {idx === 2 && <span className="text-xl">🥉</span>}
                          {idx > 2 && <span className="text-sm text-[#3e2626]/70">{idx + 1}º</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#3e2626] truncate">{product.name}</p>
                          <p className="text-xs text-[#3e2626]/70">Qtd: {product.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[#3e2626]">
                            {formatCurrency(product.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
