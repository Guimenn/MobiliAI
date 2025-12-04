'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { Loader } from '@/components/ui/ai/loader';
import { adminAPI } from '@/lib/api';

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    monthly: Array<{ month: string; value: number }>;
  };
  sales: {
    total: number;
    growth: number;
    daily: Array<{ date: string; value: number }>;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
  products: {
    total: number;
    topSelling: Array<{ name: string; quantity: number; revenue: number }>;
  };
  performance: {
    averageTicket: number;
    conversionRate: number;
    customerSatisfaction: number;
  };
}

interface StoreAnalyticsProps {
  storeId: string;
}

export default function StoreAnalytics({ storeId }: StoreAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [storeId, period]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await adminAPI.getStoreAnalytics(storeId, period);
      setAnalytics(data);
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader size={32} className="mx-auto mb-4" />
          <p className="text-gray-600">Carregando análises...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Dados não disponíveis</h3>
        <p className="text-gray-500">Não há dados suficientes para gerar análises.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Análises da Loja</h2>
          <p className="text-gray-600">Métricas e indicadores de performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.revenue.total)}
                </p>
                <p className="text-sm text-gray-500">Receita Total</p>
                <div className="flex items-center mt-1">
                  {analytics.revenue.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={`text-xs ${analytics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(analytics.revenue.growth)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900">{analytics.sales.total}</p>
                <p className="text-sm text-gray-500">Total de Vendas</p>
                <div className="flex items-center mt-1">
                  {analytics.sales.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={`text-xs ${analytics.sales.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(analytics.sales.growth)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900">{analytics.customers.total}</p>
                <p className="text-sm text-gray-500">Clientes</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-600">
                    {analytics.customers.new} novos
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.performance.averageTicket)}
                </p>
                <p className="text-sm text-gray-500">Ticket Médio</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-600">
                    {analytics.performance.conversionRate.toFixed(1)}% conversão
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Evolução da Receita
            </CardTitle>
            <CardDescription>
              Receita mensal nos últimos períodos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Gráfico de receita</p>
                <p className="text-sm text-gray-400">Implementar gráfico com biblioteca de visualização</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Vendas Diárias
            </CardTitle>
            <CardDescription>
              Número de vendas por dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Gráfico de vendas</p>
                <p className="text-sm text-gray-400">Implementar gráfico com biblioteca de visualização</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Produtos Mais Vendidos
          </CardTitle>
          <CardDescription>
            Ranking dos produtos com melhor performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.products.topSelling.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#3e2626] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity} unidades vendidas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(product.revenue)}
                  </p>
                  <p className="text-sm text-gray-500">receita</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Satisfação do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analytics.performance.customerSatisfaction.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-500">Baseado em avaliações</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analytics.performance.conversionRate.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-500">Visitantes que compram</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clientes Retornando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analytics.customers.returning}
              </div>
              <p className="text-sm text-gray-500">Clientes fiéis</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

