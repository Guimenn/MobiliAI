'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { managerAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Package, 
  DollarSign, 
  ShoppingCart,
  TrendingUp,
  ArrowUp,
  Truck
} from 'lucide-react';

export default function ManagerDashboard() {
  const { user, isAuthenticated } = useAppStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [storeStats, setStoreStats] = useState({
    totalEmployees: 0,
    totalProducts: 0,
    totalSales: 0,
    monthlyRevenue: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [error, setError] = useState('');

  const fetchStoreData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const dashboardData = await managerAPI.getDashboard();

      if (dashboardData.overview) {
        setStoreStats(dashboardData.overview);
      }

      if (dashboardData.recentSales) {
        setRecentSales(dashboardData.recentSales);
      }
    } catch (err: any) {
      console.error('Erro ao buscar dados da loja:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados da loja');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && user.role === 'STORE_MANAGER') {
      fetchStoreData();
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user || user.role !== 'STORE_MANAGER') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-[#3e2626]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#3e2626]">Funcionários</CardTitle>
            <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-[#3e2626]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#3e2626]">{storeStats.totalEmployees}</div>
            <div className="flex items-center mt-2">
              <ArrowUp className="h-4 w-4 text-[#3e2626] mr-1" />
              <p className="text-sm text-[#3e2626]/80">Funcionários da loja</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-[#3e2626]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#3e2626]">Produtos</CardTitle>
            <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-[#3e2626]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#3e2626]">{storeStats.totalProducts}</div>
            <div className="flex items-center mt-2">
              <ArrowUp className="h-4 w-4 text-[#3e2626] mr-1" />
              <p className="text-sm text-[#3e2626]/80">Produtos em estoque</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-[#3e2626]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#3e2626]">Vendas do Mês</CardTitle>
            <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-[#3e2626]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#3e2626]">R$ {storeStats.monthlyRevenue.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <ArrowUp className="h-4 w-4 text-[#3e2626] mr-1" />
              <p className="text-sm text-[#3e2626]/80">Receita mensal</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-[#3e2626]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#3e2626]">Total de Vendas</CardTitle>
            <div className="w-8 h-8 bg-[#3e2626]/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-[#3e2626]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#3e2626]">{storeStats.totalSales}</div>
            <div className="flex items-center mt-2">
              <ArrowUp className="h-4 w-4 text-[#3e2626] mr-1" />
              <p className="text-sm text-[#3e2626]/80">Vendas realizadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
                onClick={() => router.push('/manager/pdv')}
                className="bg-white text-[#3e2626] hover:bg-white/90 w-full font-semibold mb-2"
              >
                Criar Venda
              </Button>
              <Button
                onClick={() => router.push('/manager/orders-online')}
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

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-[#3e2626]" />
            Vendas Recentes da Loja
          </CardTitle>
          <CardDescription>Últimas vendas realizadas na sua loja</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3e2626]"></div>
              </div>
            ) : recentSales.length > 0 ? recentSales.map((sale: any) => (
              <div key={sale.id} className="flex items-center space-x-3 p-3 bg-[#3e2626]/5 rounded-lg border border-[#3e2626]/10 hover:bg-[#3e2626]/10 transition-colors">
                <div className="w-2 h-2 bg-[#3e2626] rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#3e2626]">Nova venda - R$ {sale.items?.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}</p>
                  <p className="text-xs text-[#3e2626]/70">{sale.customer?.name} - {new Date(sale.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma venda recente na loja</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
