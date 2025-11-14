'use client';

import { useState, useEffect } from 'react';
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
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
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

  // Verificar autenticação
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
      // Não exibir erro se não houver token, apenas logar
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
      // Se já está selecionado, fecha (toggle)
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
      
      // Atualizar o pedido selecionado se for o mesmo
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
    const statusConfig: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      PREPARING: { label: 'Preparando', color: 'bg-blue-100 text-blue-800' },
      SHIPPED: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
      DELIVERED: { label: 'Entregue', color: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
      COMPLETED: { label: 'Completo', color: 'bg-green-100 text-green-800' }
    };
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
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

  // Mostrar loading se não estiver autenticado ou se ainda estiver carregando
  if (!isAuthenticated || !user || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando autenticação...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se um pedido está selecionado, mostrar apenas os detalhes em tela cheia
  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header fixo */}
        <div className="bg-[#3e2626] text-white py-6 px-6 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedOrder(null);
                  setTrackingCode('');
                }}
                className="text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Voltar para Lista
              </Button>
              <div className="h-6 w-px bg-white/30 mx-4" />
              <div>
                <h1 className="text-2xl font-bold">Pedido #{selectedOrder.saleNumber}</h1>
                <p className="text-sm text-white/80 mt-1">
                  {selectedOrder.customer?.name || 'Cliente não identificado'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo em tela cheia */}
        <div className="p-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 space-y-6">
              {/* Status e Ações */}
              <div className="flex items-center justify-between flex-wrap gap-6 pb-6 border-b border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(selectedOrder.status)}
                    {selectedOrder.store && (
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {selectedOrder.store.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Criado em {formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    {selectedOrder.trackingCode && (
                      <div className="flex items-center gap-2 text-purple-600">
                        <Truck className="h-4 w-4" />
                        <span className="font-medium">Código: {selectedOrder.trackingCode}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="status-select" className="font-semibold">Alterar Status:</Label>
                    <select
                      id="status-select"
                      value={selectedOrder.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        if (newStatus === 'SHIPPED' && !selectedOrder.trackingCode && !trackingCode) {
                          const tracking = prompt('Digite o código de rastreamento:');
                          if (tracking) {
                            setTrackingCode(tracking);
                            handleUpdateStatus(selectedOrder.id, newStatus, tracking);
                          }
                        } else {
                          handleUpdateStatus(selectedOrder.id, newStatus);
                        }
                      }}
                      disabled={isUpdatingStatus || selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'CANCELLED'}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626] bg-white disabled:bg-gray-100 disabled:cursor-not-allowed min-w-[180px]"
                    >
                      <option value="PENDING">Pendente</option>
                      <option value="PREPARING">Preparando</option>
                      <option value="SHIPPED">Enviado</option>
                      <option value="DELIVERED">Entregue</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </div>
                  {selectedOrder.status === 'PREPARING' && (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Código de rastreamento (opcional)"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        className="w-64"
                      />
                      <Button
                        onClick={() => {
                          if (trackingCode) {
                            handleUpdateStatus(selectedOrder.id, 'SHIPPED', trackingCode);
                          } else {
                            handleUpdateStatus(selectedOrder.id, 'SHIPPED');
                          }
                        }}
                        disabled={isUpdatingStatus}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Marcar como Enviado
                      </Button>
                    </div>
                  )}
                  {selectedOrder.status === 'SHIPPED' && !selectedOrder.trackingCode && (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Adicionar código de rastreamento"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        className="w-64"
                      />
                      <Button
                        onClick={() => {
                          if (trackingCode) {
                            handleUpdateStatus(selectedOrder.id, 'SHIPPED', trackingCode);
                          }
                        }}
                        disabled={isUpdatingStatus || !trackingCode}
                        variant="outline"
                        size="sm"
                      >
                        Atualizar Código
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  Informações do Cliente
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <User className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nome</p>
                      <p className="font-medium text-gray-800">{selectedOrder.customer?.name || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Mail className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">E-mail</p>
                      <p className="font-medium text-gray-800">{selectedOrder.customer?.email || 'Não informado'}</p>
                    </div>
                  </div>
                  {selectedOrder.customer?.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Phone className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p className="font-medium text-gray-800">{selectedOrder.customer.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Endereço de Entrega */}
              {selectedOrder.shippingAddress && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    Endereço de Entrega
                  </h3>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                      <MapPin className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-800">{selectedOrder.shippingAddress}</p>
                      <p className="text-gray-600">
                        {selectedOrder.shippingCity} - {selectedOrder.shippingState}
                      </p>
                      <p className="text-sm text-gray-500">CEP: {selectedOrder.shippingZipCode}</p>
                      {selectedOrder.shippingPhone && (
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-2">
                          <Phone className="h-3 w-3" />
                          {selectedOrder.shippingPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Itens do Pedido */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  Itens do Pedido
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                      {(() => {
                        const imageUrl = (item.product?.imageUrls && item.product.imageUrls.length > 0) 
                          ? item.product.imageUrls[0] 
                          : item.product?.imageUrl;
                        return imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-gray-100"
                            onError={(e) => {
                              console.error('Erro ao carregar imagem:', imageUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null;
                      })()}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.product?.name || 'Produto não encontrado'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.quantity} x {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-[#3e2626]">
                          {formatPrice(item.totalPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-purple-200">
                  <div className="flex justify-between items-center bg-white rounded-xl p-4 shadow-sm">
                    <span className="text-lg font-semibold text-gray-700">Total do Pedido:</span>
                    <span className="text-2xl font-bold text-[#3e2626]">
                      {formatPrice(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View padrão com lista de pedidos
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
        <div className="bg-[#3e2626] text-white py-12 px-4 rounded-2xl mb-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold">Pedidos Online</h1>
                <p className="text-white/80 text-lg">Gerencie pedidos realizados pelos clientes online</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Total</p>
                <p className="text-3xl font-bold text-[#3e2626]">{totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-[#3e2626]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Enviados</p>
                <p className="text-3xl font-bold text-purple-600">
                  {orders.filter(o => o.status === 'SHIPPED').length}
                </p>
              </div>
              <Truck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Entregues</p>
                <p className="text-3xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'DELIVERED').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center space-x-2 flex-1">
              <Filter className="h-4 w-4 text-gray-400" />
              <Label htmlFor="store-filter">Loja:</Label>
              <select
                id="store-filter"
                value={storeFilter}
                onChange={(e) => {
                  setStoreFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
              >
                <option value="all">Todas as lojas</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <Label htmlFor="status-filter">Status:</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
              >
                <option value="all">Todos</option>
                <option value="PENDING">Pendente</option>
                <option value="PREPARING">Preparando</option>
                <option value="SHIPPED">Enviado</option>
                <option value="DELIVERED">Entregue</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="page-limit">Itens por página:</Label>
              <select
                id="page-limit"
                value={pageLimit}
                onChange={(e) => {
                  setPageLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
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

      {/* Lista de Pedidos */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Nenhum pedido encontrado</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Pedido #{order.saleNumber}</p>
                        <p className="font-semibold text-lg text-[#3e2626]">
                          {order.customer?.name || 'Cliente não identificado'}
                        </p>
                        {order.store && (
                          <p className="text-xs text-gray-500 mt-1">
                            Loja: {order.store.name}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatPrice(order.totalAmount)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Package className="h-4 w-4" />
                        <span>{order.items?.length || 0} item(ns)</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      {order.trackingCode && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <Truck className="h-4 w-4" />
                          <span>{order.trackingCode}</span>
                        </div>
                      )}
                    </div>

                    {order.shippingAddress && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <span>
                          {order.shippingAddress}, {order.shippingCity} - {order.shippingState}, {order.shippingZipCode}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        if (newStatus === 'SHIPPED' && !order.trackingCode) {
                          // Se for marcar como enviado sem código, pedir o código
                          const tracking = prompt('Digite o código de rastreamento:');
                          if (tracking) {
                            handleUpdateStatus(order.id, newStatus, tracking);
                          }
                        } else {
                          handleUpdateStatus(order.id, newStatus);
                        }
                      }}
                      disabled={isUpdatingStatus || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626] bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-gray-600">
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
                <span className="text-sm text-gray-700 px-4">
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
    </div>
  );
}
