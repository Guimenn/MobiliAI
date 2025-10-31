'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
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
  Store,
  CreditCard,
  Clock,
  Trophy,
  Activity
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3e2626', '#6b4e3d', '#8b6f47', '#a67c52', '#c49a6a'];

export default function ReportsPage() {
  const { token } = useAppStore();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentReport, setCurrentReport] = useState<any | null>(null);
  const [salesByPeriod, setSalesByPeriod] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setIsLoading(true);
      
      // Verificar se existe relatório do dia atual
      const savedReports = await adminAPI.getReports();
      const reportsArray = Array.isArray(savedReports) ? savedReports : [];

      const today = new Date().toISOString().split('T')[0];
      let currentReport = reportsArray.find((r: any) => r.period === today && r.type === 'daily');
      
      // Se não houver relatório do dia atual, gerar automaticamente
      if (!currentReport) {
        try {
          const generatedReport = await adminAPI.generateDailyReport();
          currentReport = generatedReport;
        } catch (error) {
          console.error('Erro ao gerar relatório automaticamente:', error);
          // Se falhar ao gerar, usar o relatório mais recente se houver
          if (reportsArray.length > 0) {
            currentReport = reportsArray.sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
          }
        }
      }

      // Parsear data se for string JSON
      if (currentReport && typeof currentReport.data === 'string') {
        try {
          currentReport.data = JSON.parse(currentReport.data);
        } catch (e) {
          console.error('Erro ao parsear dados do relatório:', e);
        }
      }

      // Garantir que o summary tenha valores calculados
      if (currentReport && currentReport.data) {
        const calculatedSummary = calculateSummaryFromData(currentReport);
        if (calculatedSummary) {
          currentReport.data.summary = {
            ...(currentReport.data.summary || {}),
            ...calculatedSummary
          };
        }
      }

      setCurrentReport(currentReport);

      // Usar dados do relatório para gráficos (já processados no backend)
      const reportData = currentReport?.data || {};
      if (reportData.charts) {
        if (reportData.charts.salesByPeriod && Array.isArray(reportData.charts.salesByPeriod)) {
          setSalesByPeriod(reportData.charts.salesByPeriod);
        }
        if (reportData.charts.topProductsChart && Array.isArray(reportData.charts.topProductsChart)) {
          setTopProducts(reportData.charts.topProductsChart);
        }
      } else {
        // Fallback: processar dados se não vierem do backend
        const sales = await adminAPI.getSales();
        const salesArray = Array.isArray(sales) ? sales : [];
        setSalesData(salesArray);
        processSalesByPeriod(salesArray);
        processTopProducts(salesArray);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processSalesByPeriod = (sales: any[]) => {
    // Agrupar vendas por data
    const salesMap = new Map();
    
    sales.forEach(sale => {
      const date = new Date(sale.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (salesMap.has(date)) {
        salesMap.set(date, salesMap.get(date) + Number(sale.totalAmount));
      } else {
        salesMap.set(date, Number(sale.totalAmount));
      }
    });

    // Converter para array e ordenar por data
    const sortedSales = Array.from(salesMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('-');
        const dateB = b.date.split('/').reverse().join('-');
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      })
      .slice(-7); // Últimos 7 dias

    setSalesByPeriod(sortedSales);
    return sortedSales;
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
            quantity: current.quantity + item.quantity,
            revenue: current.revenue + Number(item.totalPrice)
          });
        } else {
          productsMap.set(productName, {
            name: productName,
            quantity: item.quantity,
            revenue: Number(item.totalPrice)
          });
        }
      });
    });

    // Converter para array, ordenar por receita e pegar top 5
    const sortedProducts = Array.from(productsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setTopProducts(sortedProducts);
    return sortedProducts;
  };

  const handleDownloadReport = () => {
    if (!currentReport) return;
    
    const dataStr = JSON.stringify(currentReport.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-completo-${currentReport.period || new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const calculateSummaryFromData = (report: any) => {
    if (!report) return null;
    
    // Parsear data se for string JSON
    let reportData = report.data;
    if (typeof reportData === 'string') {
      try {
        reportData = JSON.parse(reportData);
      } catch (e) {
        console.error('Erro ao parsear dados do relatório:', e);
        return null;
      }
    }
    
    if (!reportData) return null;

    // Calcular a partir das lojas se o summary estiver vazio
    const stores = reportData.stores || [];
    const totalRevenue = stores.reduce((sum: number, store: any) => 
      sum + Number(store.totalRevenue || 0), 0
    );
    const totalSales = stores.reduce((sum: number, store: any) => 
      sum + Number(store.totalSales || 0), 0
    );
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const activeStores = stores.filter((s: any) => s.isActive !== false).length;
    const totalStores = stores.length;

    // Se o summary existir e tiver valores, usar ele, senão usar os calculados
    const summary = reportData.summary || {};
    
    // Sempre usar os valores calculados se o summary estiver zerado ou não existir
    const useCalculated = !summary.totalRevenue || summary.totalRevenue === 0;
    
    return {
      totalRevenue: useCalculated ? totalRevenue : (summary.totalRevenue || 0),
      totalSales: useCalculated ? totalSales : (summary.totalSales || 0),
      averageTicket: useCalculated ? averageTicket : (summary.averageTicket || 0),
      totalStores: summary.totalStores || totalStores,
      activeStores: useCalculated ? activeStores : (summary.activeStores || activeStores)
    };
  };

  const handleGenerateDailyReport = async () => {
    try {
      setIsLoading(true);
      const report = await adminAPI.generateDailyReport();
      
      if (report) {
        // Parsear data se for string JSON
        if (typeof report.data === 'string') {
          try {
            report.data = JSON.parse(report.data);
          } catch (e) {
            console.error('Erro ao parsear dados do relatório:', e);
          }
        }

        // Garantir que o summary tenha valores calculados
        const calculatedSummary = calculateSummaryFromData(report);
        if (calculatedSummary) {
          report.data.summary = {
            ...(report.data.summary || {}),
            ...calculatedSummary
          };
        }
        
        setCurrentReport(report);
        // Usar dados do relatório para gráficos (já processados no backend)
        const reportDataCharts = report.data?.charts;
        if (reportDataCharts) {
          if (reportDataCharts.salesByPeriod && Array.isArray(reportDataCharts.salesByPeriod)) {
            setSalesByPeriod(reportDataCharts.salesByPeriod);
          }
          if (reportDataCharts.topProductsChart && Array.isArray(reportDataCharts.topProductsChart)) {
            setTopProducts(reportDataCharts.topProductsChart);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao gerar relatório diário:', error);
      alert('Erro ao gerar relatório diário');
    } finally {
      setIsLoading(false);
    }
  };

    return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Moderno */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Relatório Completo</h1>
              <p className="mt-2 text-sm text-gray-600">
                {currentReport ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(currentReport.period || currentReport.createdAt).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="text-gray-500">
                      Gerado em {new Date(currentReport.createdAt).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </>
                ) : (
                  'Nenhum relatório disponível'
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {currentReport && (
                <Button 
                  onClick={handleDownloadReport}
                  variant="outline"
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              )}
              <Button 
                onClick={handleGenerateDailyReport}
                disabled={isLoading}
                className="bg-[#3e2626] hover:bg-[#2d1c1c] text-white shadow-lg gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Gerando...
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

        {isLoading && !currentReport ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-100 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-[#3e2626] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Gerando relatório completo...</p>
              <p className="text-sm text-gray-500 mt-1">Aguarde enquanto os dados são processados</p>
            </div>
          </div>
        ) : !currentReport ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-20 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum relatório disponível</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">Clique no botão acima para gerar um relatório completo do dia.</p>
              <Button 
                onClick={handleGenerateDailyReport}
                className="bg-[#3e2626] hover:bg-[#2d1c1c] text-white gap-2"
              >
                <Calendar className="h-4 w-4" />
                Gerar Relatório Agora
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Cards de Resumo Geral - Estilo Horizon */}
            {(() => {
              // Calcular summary se não existir ou estiver vazio
              const summary = currentReport.data?.summary || calculateSummaryFromData(currentReport) || {};
              
              return (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Receita Total</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold text-gray-900">
                        R$ {Number(summary.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total de Vendas</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-amber-700" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold text-gray-900">
                        {summary.totalSales || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-[#3e2626]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold text-gray-900">
                        R$ {Number(summary.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Lojas Ativas</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Store className="h-5 w-5 text-orange-700" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold text-gray-900">
                        {summary.activeStores || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* Gráficos Modernos */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">Receita por Período</CardTitle>
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
                  <CardTitle className="text-base font-semibold text-gray-900">Top 5 Produtos</CardTitle>
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

              {/* Receita por Loja */}
              {currentReport.data?.stores && currentReport.data.stores.length > 0 && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">Receita por Loja</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Comparativo de receita entre lojas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart 
                        data={currentReport.data.stores.map((store: any) => ({
                          name: store.storeName.length > 15 ? store.storeName.substring(0, 15) + '...' : store.storeName,
                          receita: Number(store.totalRevenue),
                          vendas: store.totalSales,
                          ticketMedio: Number(store.averageTicket)
                        }))}
                        layout="vertical"
                      >
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
                          formatter={(value: any, name: string, props: any) => {
                            const data = props.payload;
                            return [
                              `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                              `Receita • ${data.vendas} vendas • Ticket: R$ ${Number(data.ticketMedio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            ];
                          }}
                          labelFormatter={(label) => `Loja: ${label}`}
                        />
                        <Bar 
                          dataKey="receita" 
                          fill="#3e2626"
                          radius={[0, 8, 8, 0]}
                          name="Receita"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Ticket Médio por Loja */}
              {currentReport.data?.stores && currentReport.data.stores.length > 0 && (
                <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">Ticket Médio por Loja</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Comparativo de ticket médio entre lojas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart 
                        data={currentReport.data.stores.map((store: any) => ({
                          name: store.storeName.length > 15 ? store.storeName.substring(0, 15) + '...' : store.storeName,
                          ticketMedio: Number(store.averageTicket),
                          receita: Number(store.totalRevenue),
                          vendas: store.totalSales
                        }))}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          type="number" 
                          stroke="#6b7280" 
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                          label={{ value: 'Ticket Médio (R$)', position: 'insideBottom', offset: -5 }}
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
                          formatter={(value: any, name: string, props: any) => {
                            const data = props.payload;
                            return [
                              `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                              `Ticket Médio • Receita: R$ ${Number(data.receita).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • ${data.vendas} vendas`
                            ];
                          }}
                          labelFormatter={(label) => `Loja: ${label}`}
                        />
                        <Bar 
                          dataKey="ticketMedio" 
                          fill="#8b6f47"
                          radius={[0, 8, 8, 0]}
                          name="Ticket Médio"
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Métricas de Pagamento */}
            {currentReport.data?.paymentMethods && currentReport.data.paymentMethods.length > 0 && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">Métodos de Pagamento</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Distribuição por método</CardDescription>
          </CardHeader>
          <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {currentReport.data.paymentMethods.map((pm: any, idx: number) => (
                      <div 
                        key={pm.method} 
                        className="p-4 bg-white rounded-lg border border-gray-100"
                      >
                        <p className="text-xs font-medium text-gray-600 mb-2 uppercase">
                          {pm.method.replace('_', ' ')}
                        </p>
                        <p className="text-xl font-semibold text-gray-900 mb-1">{pm.count}</p>
                        <p className="text-sm font-medium text-emerald-600">
                          R$ {Number(pm.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
          </CardContent>
        </Card>
                    )}

                    {/* Performance por Loja */}
            {currentReport.data?.stores && currentReport.data.stores.length > 0 && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">Performance por Loja</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Comparativo de vendas e receita</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loja</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendas</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Médio</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                      <tbody className="divide-y divide-gray-100">
                        {currentReport.data.stores.map((store: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/30">
                            <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{store.storeName}</div>
                                  </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{store.totalSales}</div>
                                  </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                R$ {Number(store.totalRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                                  </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                R$ {Number(store.averageTicket).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                                  </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                store.hasCashOpen 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {store.hasCashOpen ? 'Aberto' : 'Fechado'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                </CardContent>
              </Card>
                    )}

            {/* Top Vendedores e Produtos */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Top Vendedores */}
              {currentReport.data?.topEmployees && currentReport.data.topEmployees.length > 0 && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">Top Vendedores</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Ranking por receita</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentReport.data.topEmployees.slice(0, 5).map((emp: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100"
                        >
                          <div className="flex-shrink-0 w-8">
                            {idx === 0 && <span className="text-xl">🥇</span>}
                            {idx === 1 && <span className="text-xl">🥈</span>}
                            {idx === 2 && <span className="text-xl">🥉</span>}
                            {idx > 2 && <span className="text-sm text-gray-500">{idx + 1}º</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{emp.employeeName}</p>
                            <p className="text-xs text-gray-500 truncate">{emp.storeName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              R$ {Number(emp.totalRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                                    </div>
                        </div>
                      ))}
                      </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Produtos */}
              {currentReport.data?.topProducts && currentReport.data.topProducts.length > 0 && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">Top Produtos</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Mais vendidos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentReport.data.topProducts.slice(0, 5).map((product: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100"
                        >
                          <div className="flex-shrink-0 w-8">
                            {idx === 0 && <span className="text-xl">🥇</span>}
                            {idx === 1 && <span className="text-xl">🥈</span>}
                            {idx === 2 && <span className="text-xl">🥉</span>}
                            {idx > 2 && <span className="text-sm text-gray-500">{idx + 1}º</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.productName}</p>
                            <p className="text-xs text-gray-500">Qtd: {product.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              R$ {Number(product.revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Métricas de Presença e Clientes */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Métricas de Presença */}
              {currentReport.data?.attendance && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">Métricas de Presença</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Análise de presença e pontualidade</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Presentes</p>
                        <p className="text-2xl font-semibold text-gray-900">{currentReport.data.attendance.totalEmployees || 0}</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Atrasos</p>
                        <p className="text-2xl font-semibold text-gray-900">{currentReport.data.attendance.totalLates || 0}</p>
                                    </div>
                      <div className="p-4 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Horas Extras</p>
                        <p className="text-2xl font-semibold text-gray-900">{currentReport.data.attendance.totalOvertime || 0}</p>
                        </div>
                      <div className="p-4 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Média de Horas</p>
                        <p className="text-2xl font-semibold text-gray-900">{Number(currentReport.data.attendance.averageHours || 0).toFixed(1)}h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                    )}

                    {/* Análise de Clientes */}
              {currentReport.data?.customers && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">Análise de Clientes</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Métricas de clientes únicos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Clientes Únicos</p>
                        <p className="text-2xl font-semibold text-gray-900">{currentReport.data.customers.total || 0}</p>
                          </div>
                      <div className="p-4 bg-white rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-600 mb-1">Novos Clientes</p>
                        <p className="text-2xl font-semibold text-emerald-600">{currentReport.data.customers.newCustomers || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )}
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
