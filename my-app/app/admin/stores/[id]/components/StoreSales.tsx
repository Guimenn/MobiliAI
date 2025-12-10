'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Package,
  Eye,
  Download,
  BarChart3
} from 'lucide-react';
import { Loader } from '@/components/ui/ai/loader';
import { adminAPI } from '@/lib/api';
import SaleDetailsModal from '@/components/SaleDetailsModal';

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  discount: number;
  tax: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
  } | null;
  employee: {
    name: string;
  } | null;
  items: Array<{
    product: {
      id?: string;
      name: string;
    } | null;
    quantity: number;
    price: number;
  }>;
}

interface StoreSalesProps {
  storeId: string;
}

export default function StoreSales({ storeId }: StoreSalesProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [salesStats, setSalesStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalSales: 0,
    averageTicket: 0,
    growthRate: 0
  });
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    loadSales();
  }, [storeId]);

  useEffect(() => {
    if (sales.length > 0) {
      loadSalesStats();
    }
  }, [sales]);

  const loadSales = async () => {
    try {
      setIsLoading(true);
      const data = await adminAPI.getStoreSales(storeId);
      // Garantir que os dados sejam um array e validar estrutura
      const validSales = Array.isArray(data) ? data : [];
      setSales(validSales);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      setSales([]); // Garantir que sempre seja um array
    } finally {
      setIsLoading(false);
    }
  };

  const loadSalesStats = async () => {
    try {
      const stats = await adminAPI.getStoreSalesStats(storeId);

      // Garantir que os valores numéricos sejam válidos
      setSalesStats({
        totalRevenue: Number(stats?.totalRevenue) || 0,
        totalProfit: Number(stats?.totalProfit) || 0,
        totalSales: Number(stats?.totalSales) || 0,
        averageTicket: Number(stats?.averageTicket) || 0,
        growthRate: Number(stats?.growthRate) || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Valores padrão em caso de erro
      setSalesStats({
        totalRevenue: 0,
        totalProfit: 0,
        totalSales: 0,
        averageTicket: 0,
        growthRate: 0
      });
    }
  };

  const filteredSales = sales.filter(sale => {
    if (!sale || !sale.saleNumber) return false;
    
    const matchesSearch = !searchTerm || 
      sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (sale.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all' && sale.createdAt) {
      try {
        const saleDate = new Date(sale.createdAt);
        if (isNaN(saleDate.getTime())) {
          matchesDate = false;
        } else if (dateFilter === 'today') {
          matchesDate = isToday(saleDate);
        } else if (dateFilter === 'week') {
          matchesDate = isThisWeek(saleDate);
        } else if (dateFilter === 'month') {
          matchesDate = isThisMonth(saleDate);
        }
      } catch (error) {
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return date >= startOfWeek && date <= endOfWeek;
  };

  const isThisMonth = (date: Date) => {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Concluída', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
      refunded: { label: 'Reembolsada', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      CASH: { label: 'Dinheiro', className: 'bg-green-100 text-green-800' },
      CREDIT_CARD: { label: 'Cartão de Crédito', className: 'bg-blue-100 text-blue-800' },
      DEBIT_CARD: { label: 'Cartão de Débito', className: 'bg-purple-100 text-purple-800' },
      PIX: { label: 'PIX', className: 'bg-yellow-100 text-yellow-800' },
      PENDING: { label: 'Pendente', className: 'bg-gray-100 text-gray-800' },
      BOLETO: { label: 'Boleto', className: 'bg-orange-100 text-orange-800' },
      // Fallback para valores minúsculos (caso ainda existam)
      cash: { label: 'Dinheiro', className: 'bg-green-100 text-green-800' },
      credit_card: { label: 'Cartão de Crédito', className: 'bg-blue-100 text-blue-800' },
      debit_card: { label: 'Cartão de Débito', className: 'bg-purple-100 text-purple-800' },
      pix: { label: 'PIX', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.CASH;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader size={32} className="mx-auto mb-4" />
          <p className="text-gray-600">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <BarChart3 className="h-4 w-4 mr-2" />
          Relatório
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  R$ {salesStats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Receita Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600">
                  R$ {salesStats.totalProfit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0.00'}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Lucro Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{salesStats.totalSales}</p>
                <p className="text-xs sm:text-sm text-gray-500">Total de Vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  R$ {salesStats.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Ticket Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                {salesStats.growthRate >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {salesStats.growthRate >= 0 ? '+' : ''}{salesStats.growthRate.toFixed(1)}%
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Crescimento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
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
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Períodos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        {filteredSales.map((sale) => (
          <Card key={sale.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">#{sale.saleNumber || 'N/A'}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {sale.createdAt ? (() => {
                          try {
                            return new Date(sale.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          } catch {
                            return 'Data inválida';
                          }
                        })() : 'Data não disponível'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getPaymentMethodBadge(sale.paymentMethod)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs sm:text-sm">Cliente</p>
                      <p className="font-medium truncate">{sale.customer?.name ?? 'Cliente não identificado'}</p>
                      <p className="text-gray-600 text-xs truncate">{sale.customer?.email ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs sm:text-sm">Funcionário</p>
                      <p className="font-medium truncate">{sale.employee?.name ?? 'Funcionário não identificado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs sm:text-sm">Valor Total</p>
                      <p className="font-bold text-base sm:text-lg text-green-600">
                        R$ {Number(sale.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {sale.items && sale.items.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs sm:text-sm text-gray-500 mb-2">Produtos:</p>
                      <div className="flex flex-wrap gap-2">
                        {sale.items.map((item, index) => (
                          <Badge key={item.product?.id || index} variant="outline" className="text-xs">
                            <span className="truncate max-w-[150px] sm:max-w-none">{item.product?.name || 'Produto não identificado'}</span> x{item.quantity || 0}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="sm:ml-4 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setSelectedSaleId(sale.id);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Ver Detalhes</span>
                    <span className="sm:hidden">Detalhes</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma venda encontrada</h3>
          <p className="text-gray-500">Ajuste os filtros ou aguarde novas vendas.</p>
        </div>
      )}

      {/* Modal de Detalhes */}
      <SaleDetailsModal
        saleId={selectedSaleId}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedSaleId(null);
        }}
      />
    </div>
  );
}

