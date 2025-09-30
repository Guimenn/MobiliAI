'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'cashier' | 'customer';
  storeId?: string;
}

interface ReportData {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
}

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const mockReportData: ReportData = {
    totalSales: 15750.80,
    totalOrders: 45,
    averageTicket: 350.02,
    topProducts: [
      { id: '1', name: 'Tinta Acrílica Premium Branco Gelo', quantity: 12, revenue: 1078.80 },
      { id: '2', name: 'Kit Pintura Completo Verde Menta', quantity: 8, revenue: 2399.20 },
      { id: '3', name: 'Esmalte Sintético Azul Royal', quantity: 15, revenue: 1882.50 },
      { id: '4', name: 'Primer Universal Branco', quantity: 20, revenue: 900.00 },
      { id: '5', name: 'Pincel Chato 2" Profissional', quantity: 25, revenue: 397.50 }
    ],
    dailySales: [
      { date: '2024-01-15', sales: 3200.50, orders: 12 },
      { date: '2024-01-16', sales: 2850.30, orders: 10 },
      { date: '2024-01-17', sales: 4100.75, orders: 15 },
      { date: '2024-01-18', sales: 3600.25, orders: 13 },
      { date: '2024-01-19', sales: 2000.00, orders: 8 }
    ],
    paymentMethods: [
      { method: 'PIX', count: 25, amount: 8750.40 },
      { method: 'Cartão', count: 15, amount: 5250.30 },
      { method: 'Dinheiro', count: 5, amount: 1750.10 }
    ]
  };

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('loja-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
    loadReportData();
  }, []);

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('loja-user');
  };

  const loadReportData = async () => {
    setIsLoading(true);
    // Simular carregamento de dados
    await new Promise(resolve => setTimeout(resolve, 1000));
    setReportData(mockReportData);
    setIsLoading(false);
  };

  const handleExportReport = () => {
    // Simular exportação de relatório
    alert('Relatório exportado com sucesso!');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa fazer login para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'cashier') {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
          <p className="text-gray-600">Esta página é apenas para funcionários.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      user={user}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="mr-3 h-8 w-8" />
              Relatórios de Vendas
            </h1>
            <p className="text-gray-600 mt-2">
              Acompanhe o desempenho das vendas e métricas da loja
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="quarter">Este Trimestre</option>
            </select>
            
            <Button onClick={loadReportData} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <Button onClick={handleExportReport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : reportData ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Vendas Totais</p>
                      <p className="text-2xl font-bold text-gray-900">
                        R$ {reportData.totalSales.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pedidos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.totalOrders}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                      <p className="text-2xl font-bold text-gray-900">
                        R$ {reportData.averageTicket.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Clientes Atendidos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.totalOrders}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Produtos Mais Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              {product.quantity} unidades vendidas
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            R$ {product.revenue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Métodos de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.paymentMethods.map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary">{method.method}</Badge>
                          <div>
                            <p className="font-medium text-gray-900">
                              {method.count} transações
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">
                            R$ {method.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Vendas Diárias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.dailySales.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(day.date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {day.orders} pedidos
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          R$ {day.sales.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum dado encontrado
              </h3>
              <p className="text-gray-600">
                Não há dados de vendas para o período selecionado.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
