'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { employeeAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import {
  Package,
  Truck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export default function EmployeeOrdersOnlinePage() {
  const router = useRouter();
  const { token } = useAppStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pageLimit, setPageLimit] = useState(50);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [currentPage, pageLimit, statusFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await employeeAPI.getStoreOnlineOrders(
        currentPage,
        pageLimit,
        statusFilter !== 'all' ? statusFilter : undefined
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
      const order = await employeeAPI.getStoreOnlineOrderById(orderId);
      setSelectedOrder(order);
      setIsModalOpen(true);
    } catch (error: any) {
      toast.error('Erro ao carregar pedido', {
        description: error.message || 'Tente novamente mais tarde.'
      });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      
      await employeeAPI.updateStoreOnlineOrderStatus(
        orderId,
        newStatus,
        newStatus === 'SHIPPED' ? trackingCode : undefined
      );
      
      toast.success('Status atualizado com sucesso!', {
        description: `Pedido ${newStatus === 'PREPARING' ? 'em preparação' : newStatus === 'SHIPPED' ? 'enviado' : 'entregue'}`
      });
      
      setTrackingCode('');
      setIsModalOpen(false);
      loadOrders();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white py-12 px-4 rounded-2xl mb-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold">Pedidos Online da Loja</h1>
                <p className="text-white/80 text-lg">Gerencie pedidos online da sua loja</p>
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

      {/* Modal de Detalhes do Pedido */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#3e2626]">
                  Pedido #{selectedOrder.saleNumber}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status e Ações */}
              <div className="flex items-center justify-between">
                <div>
                  {getStatusBadge(selectedOrder.status)}
                  <p className="text-sm text-gray-600 mt-2">
                    Criado em {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedOrder.status === 'PENDING' && (
                    <Button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                      disabled={isUpdatingStatus}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Marcar como Preparando
                    </Button>
                  )}
                  {selectedOrder.status === 'PREPARING' && (
                    <div className="flex flex-col gap-2">
                      <Input
                        placeholder="Código de rastreamento"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        className="w-64"
                      />
                      <Button
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'SHIPPED')}
                        disabled={isUpdatingStatus || !trackingCode}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Marcar como Enviado
                      </Button>
                    </div>
                  )}
                  {selectedOrder.status === 'SHIPPED' && (
                    <Button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                      disabled={isUpdatingStatus}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Marcar como Entregue
                    </Button>
                  )}
                </div>
              </div>

              {/* Informações do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedOrder.customer?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedOrder.customer?.email}</span>
                  </div>
                  {selectedOrder.customer?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedOrder.customer.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Endereço de Entrega */}
              {selectedOrder.shippingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Endereço de Entrega</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <div>
                        <p>{selectedOrder.shippingAddress}</p>
                        <p>
                          {selectedOrder.shippingCity} - {selectedOrder.shippingState}
                        </p>
                        <p>CEP: {selectedOrder.shippingZipCode}</p>
                        {selectedOrder.shippingPhone && (
                          <p>Telefone: {selectedOrder.shippingPhone}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Itens do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        {item.product?.imageUrl && (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">{item.product?.name}</p>
                          <p className="text-sm text-gray-600">
                            Quantidade: {item.quantity} x {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-bold text-lg">
                          {formatPrice(item.totalPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-[#3e2626]">
                        {formatPrice(selectedOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

