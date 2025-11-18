'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { customerAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Package,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';

const getStatusConfig = (status: string) => {
  const statusUpper = String(status).toUpperCase();
  const configs: { [key: string]: { label: string; color: string; icon: any } } = {
    PENDING: { label: 'Pendente', color: 'bg-[#3e2626]/10 text-[#3e2626] border-[#3e2626]/30', icon: Clock },
    PREPARING: { label: 'Preparando', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Package },
    SHIPPED: { label: 'Enviado', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Truck },
    DELIVERED: { label: 'Entregue', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
    COMPLETED: { label: 'Concluído', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  };
  return configs[statusUpper] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300', icon: Package };
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

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAppStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pageLimit, setPageLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      router.push('/login?redirect=/customer/orders');
      return;
    }
  }, [isAuthenticated, user, token, router]);

  useEffect(() => {
    if (isAuthenticated && user && token) {
      loadOrders();
    }
  }, [currentPage, pageLimit, statusFilter, isAuthenticated, token]);

  // Recarregar quando o termo de busca mudar (após um pequeno delay para evitar muitas requisições)
  useEffect(() => {
    if (isAuthenticated && user && token) {
      const timeoutId = setTimeout(() => {
        loadOrders();
      }, 300); // Debounce de 300ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm]);

  const loadOrders = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await customerAPI.getOrders(currentPage, pageLimit, statusFilter !== 'all' ? statusFilter : undefined);
      let filteredOrders = response.orders || [];
      
      // Aplicar busca (filtro local já que a API não tem busca)
      if (searchTerm) {
        filteredOrders = filteredOrders.filter((order: any) =>
          order.saleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.store?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setOrders(filteredOrders);
      setTotalOrders(response.pagination?.total || filteredOrders.length);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !user || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#3e2626] mb-2">Meus Pedidos</h1>
              <p className="text-gray-600">Acompanhe o histórico e status dos seus pedidos</p>
            </div>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Continuar Comprando
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center space-x-2 flex-1 w-full">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número do pedido ou loja..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center space-x-2">
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
                  <option value="COMPLETED">Concluído</option>
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
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pedidos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#3e2626] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando pedidos...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Nenhum pedido encontrado</p>
              <p className="text-gray-500 text-sm mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Você ainda não realizou nenhum pedido'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button
                  onClick={() => router.push('/')}
                  className="bg-[#3e2626] hover:bg-[#5a3a3a]"
                >
                  Começar a Comprar
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div>
                            <p className="text-sm text-gray-600">Pedido #{order.saleNumber}</p>
                            <p className="font-semibold text-lg text-[#3e2626] mt-1">
                              {order.store?.name || 'Loja não identificada'}
                            </p>
                          </div>
                          <Badge className={`${statusConfig.color} border flex items-center gap-2`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
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
                              <span className="font-medium">{order.trackingCode}</span>
                            </div>
                          )}
                        </div>

                        {order.shippingAddress && (
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mt-0.5" />
                            <span>
                              {order.shippingAddress}, {order.shippingCity} - {order.shippingState}
                            </span>
                          </div>
                        )}

                        {/* Timeline do Status */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                            {(() => {
                              const statusUpper = String(order.status).toUpperCase();
                              return (
                                <>
                                  <div className={`flex items-center gap-2 ${statusUpper !== 'CANCELLED' && ['PENDING', 'PREPARING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(statusUpper) ? 'text-green-600' : ''}`}>
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Pedido Realizado</span>
                                  </div>
                                  {!['PENDING', 'CANCELLED'].includes(statusUpper) && (
                                    <>
                                      <div className="h-1 w-1 bg-gray-300 rounded-full" />
                                      <div className={`flex items-center gap-2 ${['PREPARING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(statusUpper) ? 'text-green-600' : ''}`}>
                                        <CheckCircle className="h-3 w-3" />
                                        <span>Preparando</span>
                                      </div>
                                    </>
                                  )}
                                  {['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(statusUpper) && (
                                    <>
                                      <div className="h-1 w-1 bg-gray-300 rounded-full" />
                                      <div className={`flex items-center gap-2 ${['DELIVERED', 'COMPLETED'].includes(statusUpper) ? 'text-green-600' : ''}`}>
                                        <Truck className="h-3 w-3" />
                                        <span>Enviado</span>
                                      </div>
                                    </>
                                  )}
                                  {['DELIVERED', 'COMPLETED'].includes(statusUpper) && (
                                    <>
                                      <div className="h-1 w-1 bg-gray-300 rounded-full" />
                                      <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle className="h-3 w-3" />
                                        <span>Entregue</span>
                                      </div>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/customer/orders/${order.id}`)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && !isLoading && (
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

      <Footer />
    </div>
  );
}

