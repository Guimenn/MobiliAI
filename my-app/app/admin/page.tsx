'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Settings,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, token } = useAppStore();
  const [stats, setStats] = useState({
    totalStores: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    monthlyRevenue: 0,
    activeStores: 0
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      window.location.href = '/login';
      return;
    }
    
    // Carregar estatísticas do dashboard
    loadDashboardStats();
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      // Aqui você integraria com as APIs do backend
      // Por enquanto, dados mockados
      setStats({
        totalStores: 5,
        totalUsers: 25,
        totalProducts: 150,
        totalSales: 1250,
        monthlyRevenue: 45000,
        activeStores: 4
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  if (user?.role !== 'admin') {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-gray-600">Gestão completa do sistema</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Bem-vindo, {user.name}</span>
              <Button variant="outline" size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Lojas</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStores}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeStores} ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Funcionários cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Em estoque
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="stores">Lojas</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Sales */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendas Recentes</CardTitle>
                  <CardDescription>
                    Últimas vendas realizadas no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Venda #{1000 + i}</p>
                          <p className="text-sm text-gray-600">Loja Centro - R$ {(Math.random() * 500 + 100).toFixed(2)}</p>
                        </div>
                        <span className="text-sm text-green-600">PIX</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Store Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance das Lojas</CardTitle>
                  <CardDescription>
                    Ranking de vendas por loja
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Loja Centro', sales: 1250, revenue: 45000 },
                      { name: 'Loja Norte', sales: 980, revenue: 38000 },
                      { name: 'Loja Sul', sales: 750, revenue: 32000 },
                      { name: 'Loja Leste', sales: 650, revenue: 28000 }
                    ].map((store, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{store.name}</p>
                          <p className="text-sm text-gray-600">{store.sales} vendas</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">R$ {store.revenue.toLocaleString()}</p>
                          <p className="text-sm text-green-600">+{Math.floor(Math.random() * 20 + 5)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stores Tab */}
          <TabsContent value="stores" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestão de Lojas</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Loja
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Loja Centro', address: 'Rua Principal, 123', city: 'São Paulo', status: 'Ativa', sales: 1250 },
                { name: 'Loja Norte', address: 'Av. Norte, 456', city: 'São Paulo', status: 'Ativa', sales: 980 },
                { name: 'Loja Sul', address: 'Rua Sul, 789', city: 'São Paulo', status: 'Ativa', sales: 750 },
                { name: 'Loja Leste', address: 'Av. Leste, 321', city: 'São Paulo', status: 'Ativa', sales: 650 },
                { name: 'Loja Oeste', address: 'Rua Oeste, 654', city: 'São Paulo', status: 'Inativa', sales: 0 }
              ].map((store, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {store.name}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        store.status === 'Ativa' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {store.status}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {store.address}, {store.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Vendas:</span>
                        <span className="font-medium">{store.sales}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Editar</Button>
                        <Button size="sm" variant="outline">Relatórios</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestão de Usuários</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Funcionários</CardTitle>
                <CardDescription>
                  Lista de todos os funcionários do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'João Silva', email: 'joao@loja.com', role: 'Gerente', store: 'Loja Centro', status: 'Ativo' },
                    { name: 'Maria Santos', email: 'maria@loja.com', role: 'Vendedor', store: 'Loja Centro', status: 'Ativo' },
                    { name: 'Pedro Costa', email: 'pedro@loja.com', role: 'Vendedor', store: 'Loja Norte', status: 'Ativo' },
                    { name: 'Ana Lima', email: 'ana@loja.com', role: 'Gerente', store: 'Loja Sul', status: 'Inativo' }
                  ].map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-600">{user.role} - {user.store}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.status === 'Ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                        <Button size="sm" variant="outline">Editar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestão Financeira</h2>
              <div className="flex space-x-2">
                <Button variant="outline">Fluxo de Caixa</Button>
                <Button variant="outline">Relatórios</Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fluxo de Caixa - Últimos 30 dias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Entradas:</span>
                      <span className="text-green-600 font-medium">R$ 125.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saídas:</span>
                      <span className="text-red-600 font-medium">R$ 85.000</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Saldo:</span>
                      <span className="font-bold text-green-600">R$ 40.000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Despesas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { category: 'Aluguel', amount: 15000, percentage: 35 },
                      { category: 'Salários', amount: 25000, percentage: 58 },
                      { category: 'Luz', amount: 3000, percentage: 7 },
                      { category: 'Outros', amount: 2000, percentage: 5 }
                    ].map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm">{item.category}</span>
                          <span className="text-sm font-medium">R$ {item.amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Relatórios</h2>
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Período</CardTitle>
                  <CardDescription>Relatório de vendas detalhado</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Visualizar Relatório
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fluxo de Caixa</CardTitle>
                  <CardDescription>Entradas e saídas por período</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Visualizar Relatório
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance por Loja</CardTitle>
                  <CardDescription>Comparativo entre filiais</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Visualizar Relatório
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
