'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  ArrowLeft,
  Activity,
  Users,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface StoreStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastActivity: string;
  employees: number;
  products: number;
  sales: number;
  revenue: number;
}

export default function StoreStatusPage() {
  const { user, isAuthenticated, token } = useAppStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreStatus[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchStoreStatus();
  }, [isAuthenticated, user, router]);

  const fetchStoreStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/stores/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStores(data);
      } else {
        // Mock data para demonstração
        setStores([
          {
            id: '1',
            name: 'Loja Centro',
            status: 'active',
            lastActivity: '2024-01-15T10:30:00Z',
            employees: 8,
            products: 156,
            sales: 45,
            revenue: 125000
          },
          {
            id: '2',
            name: 'Loja Shopping',
            status: 'active',
            lastActivity: '2024-01-15T09:15:00Z',
            employees: 6,
            products: 142,
            sales: 32,
            revenue: 89000
          },
          {
            id: '3',
            name: 'Loja Norte',
            status: 'maintenance',
            lastActivity: '2024-01-14T16:45:00Z',
            employees: 4,
            products: 98,
            sales: 12,
            revenue: 35000
          }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar status das lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inativa</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Manutenção</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  if (!isAuthenticated || !user) {
    return <div>Carregando...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <p>Carregando status das lojas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => router.push('/admin/stores')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Status das Lojas</h1>
                <p className="text-sm text-gray-600">Monitoramento em tempo real</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card key={store.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Store className="h-5 w-5" />
                    <span>{store.name}</span>
                  </CardTitle>
                  {getStatusIcon(store.status)}
                </div>
                <CardDescription>
                  Última atividade: {formatDate(store.lastActivity)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    {getStatusBadge(store.status)}
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{store.employees}</p>
                        <p className="text-xs text-gray-500">Funcionários</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">{store.products}</p>
                        <p className="text-xs text-gray-500">Produtos</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">{store.sales}</p>
                        <p className="text-xs text-gray-500">Vendas</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">R$ {store.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Receita</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/stores/${store.id}`)}
                      className="w-full"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumo Geral */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Resumo Geral</CardTitle>
            <CardDescription>Estatísticas consolidadas de todas as lojas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stores.length}</p>
                <p className="text-sm text-gray-500">Total de Lojas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stores.filter(s => s.status === 'active').length}
                </p>
                <p className="text-sm text-gray-500">Lojas Ativas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {stores.reduce((sum, store) => sum + store.employees, 0)}
                </p>
                <p className="text-sm text-gray-500">Total de Funcionários</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  R$ {stores.reduce((sum, store) => sum + store.revenue, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Receita Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
