'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Search, 
  Eye, 
  DollarSign,
  Calendar,
  User,
  Store,
  Package,
  ArrowLeft,
  Filter,
  Download,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setIsLoading(true);
      const data = await adminAPI.getRecentSales();
      setSales(data);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.id.toString().includes(searchTerm) ||
                         sale.store?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
    
    const now = new Date();
    const saleDate = new Date(sale.createdAt);
    const matchesPeriod = filterPeriod === 'all' || 
      (filterPeriod === 'today' && saleDate.toDateString() === now.toDateString()) ||
      (filterPeriod === 'week' && (now.getTime() - saleDate.getTime()) <= 7 * 24 * 60 * 60 * 1000) ||
      (filterPeriod === 'month' && saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear());
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const calculateTotalRevenue = () => {
    return sales
      .filter(sale => sale.status === 'completed')
      .reduce((sum, sale) => sum + sale.total, 0);
  };

  const calculateAverageTicket = () => {
    const completedSales = sales.filter(sale => sale.status === 'completed');
    if (completedSales.length === 0) return 0;
    return calculateTotalRevenue() / completedSales.length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Vendas</h1>
                <p className="text-sm text-gray-600">Acompanhe todas as vendas realizadas</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar vendas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos os Status</option>
              <option value="completed">Concluídas</option>
              <option value="pending">Pendentes</option>
              <option value="cancelled">Canceladas</option>
            </select>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos os Períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
                  <p className="text-sm text-gray-500">Total de Vendas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(calculateTotalRevenue())}
                  </p>
                  <p className="text-sm text-gray-500">Receita Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(calculateAverageTicket())}
                  </p>
                  <p className="text-sm text-gray-500">Ticket Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {sales.filter(s => s.status === 'completed').length}
                  </p>
                  <p className="text-sm text-gray-500">Vendas Concluídas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Vendas</CardTitle>
            <CardDescription>Histórico completo de vendas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#3e2626] rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">Venda #{sale.id}</h3>
                        <Badge className={getStatusColor(sale.status)}>
                          {getStatusLabel(sale.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {sale.customer?.name || 'Cliente não identificado'}
                        </div>
                        <div className="flex items-center">
                          <Store className="h-4 w-4 mr-1" />
                          {sale.store?.name || 'Loja não identificada'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(sale.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          {sale.items?.length || 0} itens
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatPrice(sale.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredSales.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma venda encontrada</h3>
                <p className="text-gray-500">Tente ajustar os filtros para encontrar vendas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
