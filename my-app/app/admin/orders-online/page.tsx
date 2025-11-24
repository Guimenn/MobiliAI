'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminAPI } from '@/lib/api-admin';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import {
  Package,
  Truck,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  DollarSign,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
} from 'lucide-react';

export default function OrdersOnlinePage() {
  const router = useRouter();
  const { token, user, isAuthenticated } = useAppStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pageLimit, setPageLimit] = useState(50);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      router.push('/login');
      return;
    }

    if (user.role !== 'ADMIN' && user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, token, router]);

  useEffect(() => {
    if (isAuthenticated && user && token) {
      loadStores();
    }
  }, [isAuthenticated, user, token]);

  useEffect(() => {
    if (isAuthenticated && user && token) {
      loadOrders();
    }
  }, [currentPage, pageLimit, statusFilter, storeFilter, isAuthenticated, token]);

  const loadStores = async () => {
    if (!token) return;
    
    try {
      const storesData = await adminAPI.getStores();
      setStores(Array.isArray(storesData) ? storesData : []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      if (token) {
        toast.error('Erro ao carregar lojas');
      }
    }
  };

  const loadOrders = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const data = await adminAPI.getOnlineOrders(
        currentPage,
        pageLimit,
        statusFilter !== 'all' ? statusFilter : undefined,
        storeFilter !== 'all' ? storeFilter : undefined
      );
      
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalOrders(data.pagination?.total || 0);
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos', {
        description: error.message || 'Tente novamente mais tarde.'
      });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrder = async (orderId: string) => {
    try {
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
        setTrackingCode('');
        return;
      }
      
      const order = await adminAPI.getOnlineOrderById(orderId);
      setSelectedOrder(order);
      setTrackingCode(order.trackingCode || '');
    } catch (error: any) {
      toast.error('Erro ao carregar pedido', {
        description: error.message || 'Tente novamente mais tarde.'
      });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string, tracking?: string) => {
    try {
      setIsUpdatingStatus(true);
      
      await adminAPI.updateOrderStatus(
        orderId,
        newStatus,
        newStatus === 'SHIPPED' ? (tracking || trackingCode) : undefined
      );
      
      const statusMessages: Record<string, string> = {
        'PENDING': 'marcado como pendente',
        'PREPARING': 'em preparação',
        'SHIPPED': 'enviado',
        'DELIVERED': 'entregue',
        'CANCELLED': 'cancelado'
      };
      
      toast.success('Status atualizado com sucesso!', {
        description: `Pedido ${statusMessages[newStatus] || newStatus}`
      });
      
      setTrackingCode('');
      loadOrders();
      
      if (selectedOrder?.id === orderId) {
        const updatedOrder = await adminAPI.getOnlineOrderById(orderId);
        setSelectedOrder(updatedOrder);
      }
    } catch (error: any) {
      toast.error('Erro ao atualizar status', {
        description: error.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pendente', className: 'border-border bg-muted/50 text-muted-foreground' },
      PREPARING: { label: 'Preparando', className: 'border-border bg-muted/50 text-foreground' },
      SHIPPED: { label: 'Enviado', className: 'border-border bg-muted/50 text-foreground' },
      DELIVERED: { label: 'Entregue', className: 'border-border bg-muted/50 text-foreground' },
      CANCELLED: { label: 'Cancelado', className: 'border-border bg-muted/50 text-muted-foreground' },
      COMPLETED: { label: 'Completo', className: 'border-border bg-muted/50 text-foreground' }
    };
    
    const config = statusMap[status] || { label: status, className: 'border-border bg-muted/50 text-muted-foreground' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numPrice);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = useMemo(() => {
    return {
      total: totalOrders,
      pending: orders.filter(o => o.status === 'PENDING').length,
      shipped: orders.filter(o => o.status === 'SHIPPED').length,
      delivered: orders.filter(o => o.status === 'DELIVERED').length,
    };
  }, [orders, totalOrders]);

  if (!isAuthenticated || !user || !token) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-b-primary" />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-b-primary" />
          <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-border bg-[#3e2626] px-8 py-10 text-primary-foreground shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedOrder(null);
                setTrackingCode('');
              }}
              className="h-10 w-10 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Pedido #{selectedOrder.saleNumber}
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base mt-1">
                {selectedOrder.customer?.name || 'Cliente não identificado'}
              </p>
            </div>
          </div>
        </section>

        <OrderDetails 
          order={selectedOrder}
          trackingCode={trackingCode}
          setTrackingCode={setTrackingCode}
          onUpdateStatus={handleUpdateStatus}
          isUpdatingStatus={isUpdatingStatus}
          getStatusBadge={getStatusBadge}
          formatPrice={formatPrice}
          formatDate={formatDate}
        />
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
              Pedidos Online
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Gerenciar Pedidos
              </h1>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Gerencie pedidos realizados pelos clientes online. Acompanhe status, envios e entregas.
              </p>
            </div>
          </div>

          <OrdersStats stats={stats} />
        </div>
      </section>

      {/* Filters */}
      <Card className="border border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="md:w-48">
              <Label htmlFor="store-filter" className="text-sm mb-2 block">Loja</Label>
              <select
                id="store-filter"
                value={storeFilter}
                onChange={(e) => {
                  setStoreFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Todas as lojas</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:w-48">
              <Label htmlFor="status-filter" className="text-sm mb-2 block">Status</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="PENDING">Pendente</option>
                <option value="PREPARING">Preparando</option>
                <option value="SHIPPED">Enviado</option>
                <option value="DELIVERED">Entregue</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
            <div className="md:w-48">
              <Label htmlFor="page-limit" className="text-sm mb-2 block">Itens por página</Label>
              <select
                id="page-limit"
                value={pageLimit}
                onChange={(e) => {
                  setPageLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <Button
              variant="outline"
              onClick={loadOrders}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum pedido encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Os pedidos aparecerão aqui quando forem realizados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Card 
                key={order.id} 
                className="border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <p className="text-sm text-muted-foreground">Pedido #{order.saleNumber}</p>
                          <p className="font-semibold text-lg text-foreground mt-1">
                            {order.customer?.name || 'Cliente não identificado'}
                          </p>
                          {order.store && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Loja: {order.store.name}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatPrice(order.totalAmount)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>{order.items?.length || 0} item(ns)</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        {order.trackingCode && (
                          <div className="flex items-center gap-2 text-foreground">
                            <Truck className="h-4 w-4" />
                            <span className="font-medium">{order.trackingCode}</span>
                          </div>
                        )}
                      </div>

                      {order.shippingAddress && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>
                            {order.shippingAddress}, {order.shippingCity} - {order.shippingState}, {order.shippingZipCode}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus === 'SHIPPED' && !order.trackingCode) {
                            const tracking = prompt('Digite o código de rastreamento:');
                            if (tracking) {
                              handleUpdateStatus(order.id, newStatus, tracking);
                            }
                          } else {
                            handleUpdateStatus(order.id, newStatus);
                          }
                        }}
                        disabled={isUpdatingStatus || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="PREPARING">Preparando</option>
                        <option value="SHIPPED">Enviado</option>
                        <option value="DELIVERED">Entregue</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="border border-border shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * pageLimit) + 1} - {Math.min(currentPage * pageLimit, totalOrders)} de {totalOrders} pedidos
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-foreground px-4">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function OrdersStats({ stats }: any) {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-4 sm:grid-cols-2 lg:max-w-xl">
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
          <Package className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold leading-tight">{stats.total}</p>
        <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Total</p>
      </div>
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
          <Clock className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold leading-tight">{stats.pending}</p>
        <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Pendentes</p>
      </div>
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
          <Truck className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold leading-tight">{stats.shipped}</p>
        <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Enviados</p>
      </div>
      <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground mb-3">
          <CheckCircle className="h-5 w-5" />
        </div>
        <p className="text-2xl font-semibold leading-tight">{stats.delivered}</p>
        <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Entregues</p>
      </div>
    </div>
  );
}

function OrderDetails({ 
  order, 
  trackingCode, 
  setTrackingCode, 
  onUpdateStatus, 
  isUpdatingStatus,
  getStatusBadge,
  formatPrice,
  formatDate
}: any) {
  return (
    <>
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {getStatusBadge(order.status)}
              {order.store && (
                <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground">
                  {order.store.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="status-select" className="text-sm">Alterar Status:</Label>
              <select
                id="status-select"
                value={order.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  if (newStatus === 'SHIPPED' && !order.trackingCode && !trackingCode) {
                    const tracking = prompt('Digite o código de rastreamento:');
                    if (tracking) {
                      setTrackingCode(tracking);
                      onUpdateStatus(order.id, newStatus, tracking);
                    }
                  } else {
                    onUpdateStatus(order.id, newStatus);
                  }
                }}
                disabled={isUpdatingStatus || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="PENDING">Pendente</option>
                <option value="PREPARING">Preparando</option>
                <option value="SHIPPED">Enviado</option>
                <option value="DELIVERED">Entregue</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Criado em {formatDate(order.createdAt)}</span>
            </div>
            {order.trackingCode && (
              <div className="flex items-center gap-2 text-foreground">
                <Truck className="h-4 w-4" />
                <span className="font-medium">Código: {order.trackingCode}</span>
              </div>
            )}
          </div>

          {order.status === 'PREPARING' && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Código de rastreamento (opcional)"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  if (trackingCode) {
                    onUpdateStatus(order.id, 'SHIPPED', trackingCode);
                  } else {
                    onUpdateStatus(order.id, 'SHIPPED');
                  }
                }}
                disabled={isUpdatingStatus}
              >
                Marcar como Enviado
              </Button>
            </div>
          )}

          {order.status === 'SHIPPED' && !order.trackingCode && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Adicionar código de rastreamento"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  if (trackingCode) {
                    onUpdateStatus(order.id, 'SHIPPED', trackingCode);
                  }
                }}
                disabled={isUpdatingStatus || !trackingCode}
                variant="outline"
              >
                Atualizar Código
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <User className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium text-foreground">{order.customer?.name || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Mail className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium text-foreground">{order.customer?.email || 'Não informado'}</p>
            </div>
          </div>
          {order.customer?.phone && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Phone className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium text-foreground">{order.customer.phone}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {order.shippingAddress && (
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted flex-shrink-0">
                <MapPin className="h-5 w-5 text-foreground" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">{order.shippingAddress}</p>
                <p className="text-muted-foreground">
                  {order.shippingCity} - {order.shippingState}
                </p>
                <p className="text-sm text-muted-foreground">CEP: {order.shippingZipCode}</p>
                {order.shippingPhone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                    <Phone className="h-3 w-3" />
                    {order.shippingPhone}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Itens do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
              {(() => {
                const imageUrl = (item.product?.imageUrls && item.product.imageUrls.length > 0) 
                  ? item.product.imageUrls[0] 
                  : item.product?.imageUrl;
                return imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null;
              })()}
              <div className="flex-1">
                <p className="font-semibold text-foreground">{item.product?.name || 'Produto não encontrado'}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.quantity} x {formatPrice(item.unitPrice)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-foreground">
                  {formatPrice(item.totalPrice)}
                </p>
              </div>
            </div>
          ))}
          <div className="pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-foreground">Total do Pedido:</span>
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
