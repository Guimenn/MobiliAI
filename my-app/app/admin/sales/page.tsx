'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { salesAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  ShoppingCart,
  Receipt,
  Search,
  Eye,
  Download,
  Calendar,
  User,
  CreditCard,
} from 'lucide-react';

export default function SalesPage() {
  const router = useRouter();
  const { user: currentUser, token } = useAppStore();
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setIsLoading(true);
      
      try {
        const salesData = await salesAPI.getAll();
        setSales(Array.isArray(salesData) ? salesData : []);
      } catch (apiError) {
        console.log('API de vendas não disponível, usando dados mock');
        const mockSales = [
          {
            id: '1',
            customerName: 'João Silva',
            customerEmail: 'joao@email.com',
            totalAmount: 1250.00,
            status: 'COMPLETED',
            paymentMethod: 'pix',
            createdAt: new Date('2024-01-15'),
            items: [
              { productName: 'Sofá 3 Lugares', quantity: 1, price: 1250.00 }
            ]
          },
          {
            id: '2',
            customerName: 'Maria Santos',
            customerEmail: 'maria@email.com',
            totalAmount: 850.00,
            status: 'PENDING',
            paymentMethod: 'CARTÃO',
            createdAt: new Date('2024-01-14'),
            items: [
              { productName: 'Mesa de Jantar', quantity: 1, price: 850.00 }
            ]
          },
          {
            id: '3',
            customerName: 'Pedro Costa',
            customerEmail: 'pedro@email.com',
            totalAmount: 2100.00,
            status: 'COMPLETED',
            paymentMethod: 'pix',
            createdAt: new Date('2024-01-13'),
            items: [
              { productName: 'Conjunto Sala Completo', quantity: 1, price: 2100.00 }
            ]
          }
        ];
        setSales(mockSales);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do banco:', error);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((sum: number, sale: any) => {
      const amount = typeof sale.totalAmount === 'string' ? parseFloat(sale.totalAmount) : (sale.totalAmount || 0);
      return sum + amount;
    }, 0);
    
    const averageOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;
    const completedSales = sales.filter((sale: any) => sale.status === 'COMPLETED').length;
    const conversionRate = sales.length > 0 ? (completedSales / sales.length) * 100 : 0;
    
    return {
      totalSales: sales.length,
      totalRevenue,
      averageOrderValue,
      conversionRate,
      completedSales,
    };
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale: any) => {
      if (statusFilter !== 'all' && sale.status !== statusFilter) {
        return false;
      }
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const customerName = (sale.customer?.name || sale.customerName || '').toLowerCase();
        const customerEmail = (sale.customer?.email || sale.customerEmail || '').toLowerCase();
        const saleId = (sale.saleNumber || sale.id || '').toString().toLowerCase();
        
        if (!customerName.includes(term) && !customerEmail.includes(term) && !saleId.includes(term)) {
          return false;
        }
      }
      
      if (dateFilter !== 'all') {
        const saleDate = sale.createdAt ? new Date(sale.createdAt) : null;
        if (!saleDate) return false;
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        if (dateFilter === 'today' && saleDate < today) return false;
        if (dateFilter === 'yesterday' && (saleDate < yesterday || saleDate >= today)) return false;
        if (dateFilter === 'week' && saleDate < thisWeek) return false;
        if (dateFilter === 'month' && saleDate < thisMonth) return false;
      }
      
      return true;
    });
  }, [sales, searchTerm, statusFilter, dateFilter]);

  const handleViewSale = (saleId: string) => {
    router.push(`/admin/sales/${saleId}`);
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      COMPLETED: { label: 'Concluída', className: 'border-border bg-muted/50 text-foreground' },
      PENDING: { label: 'Pendente', className: 'border-border bg-muted/50 text-muted-foreground' },
      DELIVERED: { label: 'Entregue', className: 'border-border bg-muted/50 text-foreground' },
      CANCELLED: { label: 'Cancelada', className: 'border-border bg-muted/50 text-muted-foreground' },
      REFUNDED: { label: 'Reembolsada', className: 'border-border bg-muted/50 text-muted-foreground' },
    };
    const config = statusMap[status || 'PENDING'] || statusMap.PENDING;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Data não disponível';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-b-primary" />
          <p className="text-sm text-muted-foreground">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="rounded-3xl border border-border bg-[#3e2626] px-8 py-10 text-primary-foreground shadow-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <Badge
              variant="outline"
              className="border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground"
            >
              Gestão de Vendas
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Vendas e Transações
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Acompanhe todas as vendas realizadas, monitore receitas e gerencie transações do sistema.
              </p>
            </div>
          </div>

          <SalesStats stats={stats} />
        </div>
      </section>

      {/* Filters */}
      <Card className="border border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por cliente, email ou número da venda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label htmlFor="status-filter" className="text-sm mb-2 block">Status</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Todos os status</option>
                <option value="COMPLETED">Concluída</option>
                <option value="PENDING">Pendente</option>
                <option value="DELIVERED">Entregue</option>
                <option value="CANCELLED">Cancelada</option>
                <option value="REFUNDED">Reembolsada</option>
              </select>
            </div>
            <div className="md:w-48">
              <Label htmlFor="date-filter" className="text-sm mb-2 block">Período</Label>
              <select
                id="date-filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Todos os períodos</option>
                <option value="today">Hoje</option>
                <option value="yesterday">Ontem</option>
                <option value="week">Últimos 7 dias</option>
                <option value="month">Este mês</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma venda encontrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Tente ajustar os filtros para encontrar vendas.'
                : 'As vendas aparecerão aqui quando forem realizadas.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSales.map((sale: any) => (
            <Card 
              key={sale.id} 
              className="border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewSale(sale.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-foreground flex-shrink-0">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          Venda #{sale.saleNumber || sale.id}
                        </h3>
                        {getStatusBadge(sale.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          <span>{sale.customer?.name || sale.customerName || 'Cliente'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(sale.createdAt)}</span>
                        </div>
                        {sale.paymentMethod && (
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-4 w-4" />
                            <span className="capitalize">{sale.paymentMethod}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xl font-semibold text-foreground">
                        {formatPrice(typeof sale.totalAmount === 'string' ? parseFloat(sale.totalAmount) : (sale.totalAmount || 0))}
                      </p>
                      {sale.items && sale.items.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSale(sale.id);
                      }}
                      className="h-10 w-10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SalesStats({ stats }: any) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-4 sm:grid-cols-2 lg:max-w-xl">
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold leading-tight">{stats.totalSales}</p>
        <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Total de Vendas</p>
      </div>
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
          <DollarSign className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold leading-tight">{formatPrice(stats.totalRevenue)}</p>
        <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Receita Total</p>
      </div>
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
          <TrendingUp className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold leading-tight">{formatPrice(stats.averageOrderValue)}</p>
        <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Ticket Médio</p>
      </div>
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
          <BarChart3 className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold leading-tight">{stats.conversionRate.toFixed(1)}%</p>
        <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Taxa de Conversão</p>
      </div>
    </div>
  );
}
