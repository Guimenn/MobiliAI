'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Store, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Activity,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalProducts: 0,
    monthlyRevenue: 0,
    activeStores: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    const loadStats = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalUsers: 156,
        totalStores: 8,
        totalProducts: 1247,
        monthlyRevenue: 125000,
        activeStores: 6
      });
      setIsLoading(false);
    };

    loadStats();
  }, []);

  const quickActions = [
    { name: 'Gerenciar Lojas', href: '/admin/stores', icon: Store, color: 'bg-blue-500' },
    { name: 'Gerenciar Usuários', href: '/admin/users', icon: Users, color: 'bg-green-500' },
    { name: 'Gerenciar Produtos', href: '/admin/products', icon: Package, color: 'bg-purple-500' },
    { name: 'Ver Relatórios', href: '/admin/reports', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white py-8 px-6 rounded-2xl">
        <h1 className="text-3xl font-bold mb-2">Bem-vindo ao Painel Administrativo</h1>
        <p className="text-white/80 text-lg">Gerencie sua empresa de forma eficiente</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-green-600">+12% este mês</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 mt-2">Total de Usuários</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStores}</p>
                <p className="text-sm text-green-600">+2 novas lojas</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-gray-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 mt-2">Total de Lojas</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">R$ {stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600">+8% este mês</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-gray-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 mt-2">Receita Mensal</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Produtos ativos</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 mt-2">Total de Produtos</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Ações Rápidas</CardTitle>
          <CardDescription>Acesse rapidamente as principais funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.name}
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-lg transition-shadow"
                  onClick={() => window.location.href = action.href}
                >
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{action.name}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Atividade Recente</CardTitle>
          <CardDescription>Últimas ações realizadas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Nova loja cadastrada</p>
                <p className="text-xs text-gray-500">Loja Centro - São Paulo</p>
              </div>
              <span className="text-xs text-gray-400">2 min atrás</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Usuário criado</p>
                <p className="text-xs text-gray-500">João Silva - Funcionário</p>
              </div>
              <span className="text-xs text-gray-400">15 min atrás</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Produto atualizado</p>
                <p className="text-xs text-gray-500">Sofá 3 Lugares - Estoque</p>
              </div>
              <span className="text-xs text-gray-400">1 hora atrás</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}