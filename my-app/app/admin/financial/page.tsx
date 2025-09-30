'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { adminAPI } from '@/lib/api-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Download,
  Calendar,
  Store,
  ShoppingCart,
  Users,
  Package
} from 'lucide-react';

interface FinancialData {
  period: {
    startDate: string;
    endDate: string;
  };
  consolidated: {
    totalSales: number;
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    totalStores: number;
  };
  byStore: Array<{
    store: {
      id: string;
      name: string;
      city: string;
    };
    sales: {
      total: number;
      count: number;
    };
    cashFlow: {
      income: number;
      expenses: number;
      net: number;
    };
  }>;
}

export default function AdminFinancial() {
  const { user, isAuthenticated, token } = useAppStore();
  const router = useRouter();
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('2025-09-01');
  const [endDate, setEndDate] = useState('2025-09-30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchFinancialData();
  }, [isAuthenticated, user, router, startDate, endDate]);

  const fetchFinancialData = async () => {
    try {
      const response = await adminAPI.getFinancialData(token, startDate, endDate);

      if (response.ok) {
        const data = await response.json();
        setFinancialData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
              <p className="text-sm text-gray-600">Visão consolidada das finanças da empresa</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Período de Análise</CardTitle>
              <CardDescription>Selecione o período para análise dos dados financeiros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <span className="text-gray-500">até</span>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <Button onClick={fetchFinancialData}>
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="stores">Por Loja</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(financialData?.consolidated.totalSales || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Período selecionado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(financialData?.consolidated.totalIncome || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Entradas de caixa
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(financialData?.consolidated.totalExpenses || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saídas de caixa
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fluxo Líquido</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    (financialData?.consolidated.netCashFlow || 0) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(financialData?.consolidated.netCashFlow || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Resultado líquido
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Period Info */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Período</CardTitle>
                <CardDescription>
                  {formatDate(startDate)} até {formatDate(endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {financialData?.consolidated.totalStores || 0}
                    </div>
                    <div className="text-sm text-gray-600">Lojas Ativas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(financialData?.consolidated.totalSales || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Vendas Totais</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(financialData?.consolidated.netCashFlow || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Fluxo Líquido</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stores Tab */}
          <TabsContent value="stores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Loja</CardTitle>
                <CardDescription>Análise detalhada de cada loja no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialData?.byStore.map((store, index) => (
                    <Card key={store.store.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Store className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-lg">{store.store.name}</h3>
                            <p className="text-sm text-gray-600">{store.store.city}</p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          #{index + 1}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(store.sales.total)}
                          </div>
                          <div className="text-sm text-gray-600">Vendas ({store.sales.count})</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">
                            {formatCurrency(store.cashFlow.income)}
                          </div>
                          <div className="text-sm text-gray-600">Receitas</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${
                            store.cashFlow.net >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(store.cashFlow.net)}
                          </div>
                          <div className="text-sm text-gray-600">Resultado</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Vendas</CardTitle>
                  <CardDescription>Tendências de vendas no período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Gráfico de vendas em desenvolvimento</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fluxo de Caixa</CardTitle>
                  <CardDescription>Entradas vs Saídas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Gráfico de fluxo em desenvolvimento</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
