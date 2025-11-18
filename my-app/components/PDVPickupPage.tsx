'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { salesAPI } from '@/lib/api';
import { showAlert } from '@/lib/alerts';
import {
  Package,
  CheckCircle,
  Loader2,
  Clock,
  DollarSign,
  ShoppingBag,
  User,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';

interface PDVPickupPageProps {
  pickupOrders: any[];
  onOrderPickedUp?: (orderId: string) => void;
}

export default function PDVPickupPage({ pickupOrders, onOrderPickedUp }: PDVPickupPageProps) {
  const [orders, setOrders] = useState<any[]>(pickupOrders || []);
  const [markingAsPickedUp, setMarkingAsPickedUp] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setOrders(pickupOrders || []);
  }, [pickupOrders]);

  const handleMarkAsPickedUp = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    
    // Verificar se o pedido está com status DELIVERED
    if (!order) {
      showAlert('error', 'Pedido não encontrado');
      return;
    }
    
    const orderStatus = String(order.status).toUpperCase();
    if (orderStatus !== 'DELIVERED') {
      showAlert('error', `Este pedido não pode ser retirado. Status atual: ${orderStatus === 'PENDING' ? 'Pendente' : orderStatus === 'PREPARING' ? 'Preparando' : orderStatus === 'SHIPPED' ? 'Enviado' : orderStatus}. O pedido precisa estar como "Entregue" para ser retirado.`);
      return;
    }
    
    try {
      setMarkingAsPickedUp(orderId);
      await salesAPI.update(orderId, {
        status: 'completed',
      });
      
      // Remover da lista
      setOrders(prev => prev.filter(order => order.id !== orderId));
      
      // Notificar callback
      if (onOrderPickedUp) {
        onOrderPickedUp(orderId);
      }
      
      showAlert('success', 'Pedido marcado como retirado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao marcar pedido como retirado:', error);
      showAlert('error', 'Erro ao marcar pedido como retirado. Tente novamente.');
    } finally {
      setMarkingAsPickedUp(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = String(status).toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return <Badge className="bg-[#3e2626] text-white">Pendente</Badge>;
      case 'PREPARING':
        return <Badge className="bg-blue-500 text-white">Preparando</Badge>;
      case 'SHIPPED':
        return <Badge className="bg-purple-500 text-white">Enviado</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-green-500 text-white">Entregue</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-600 text-white">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canPickup = (status: string) => {
    return String(status).toUpperCase() === 'DELIVERED';
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#3e2626]/10 rounded-full mb-4">
            <Package className="h-12 w-12 text-[#3e2626]" />
          </div>
          <h3 className="text-2xl font-bold text-[#3e2626]">Nenhum pedido para retirada</h3>
          <p className="text-gray-600">
            Quando houver pedidos online aguardando retirada na loja, eles aparecerão aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#3e2626] flex items-center gap-3">
            <div className="p-3 bg-[#3e2626] rounded-xl">
              <Package className="h-6 w-6 text-white" />
            </div>
            Pedidos para Retirada
          </h2>
          <p className="text-gray-600 mt-1">
            {orders.length} pedido{orders.length !== 1 ? 's' : ''} aguardando retirada
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Lista de Pedidos */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {orders.map((order) => (
          <Card
            key={order.id}
            className="border-2 border-[#3e2626]/20 bg-gradient-to-br from-[#3e2626]/5 to-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white rounded-t-lg pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  Pedido #{order.saleNumber}
                </CardTitle>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Informações do Pedido */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#3e2626]/20">
                    <div className="p-2 bg-[#3e2626]/10 rounded-lg">
                      <DollarSign className="h-5 w-5 text-[#3e2626]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Valor Total</p>
                      <p className="text-lg font-bold text-[#3e2626]">
                        {formatCurrency(Number(order.totalAmount))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#3e2626]/20">
                    <div className="p-2 bg-[#3e2626]/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-[#3e2626]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Data do Pedido</p>
                      <p className="text-sm font-semibold text-[#3e2626]">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  {order.customer && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#3e2626]/20">
                      <div className="p-2 bg-[#3e2626]/10 rounded-lg">
                        <User className="h-5 w-5 text-[#3e2626]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Cliente</p>
                        <p className="text-sm font-semibold text-[#3e2626] truncate">
                          {order.customer.name || 'Não informado'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Itens do Pedido */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-[#3e2626] mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Itens do Pedido ({order.items.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {order.items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#3e2626]/30 transition-colors"
                        >
                          {item.product?.imageUrl ? (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-100">
                              <Image
                                src={item.product.imageUrl}
                                alt={item.product.name || 'Produto'}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#3e2626] truncate">
                              {item.product?.name || 'Produto não encontrado'}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-600">
                                Qtd: <span className="font-semibold">{item.quantity}</span>
                              </span>
                              <span className="text-sm text-gray-600">
                                Unit: {formatCurrency(Number(item.unitPrice))}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#3e2626]">
                              {formatCurrency(Number(item.unitPrice) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observações */}
                {order.notes && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 mb-1">Observações:</p>
                    <p className="text-sm text-blue-800">{order.notes}</p>
                  </div>
                )}

                {/* Botão de Ação */}
                <div className="pt-4 border-t border-[#3e2626]/20">
                  {canPickup(order.status) ? (
                    <Button
                      onClick={() => handleMarkAsPickedUp(order.id)}
                      disabled={markingAsPickedUp === order.id}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold shadow-lg transition-all"
                    >
                      {markingAsPickedUp === order.id ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Marcar como Retirado
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-yellow-900 mb-1">
                              Pedido não disponível para retirada
                            </p>
                            <p className="text-xs text-yellow-800">
                              Este pedido precisa estar com status "Entregue" antes de ser marcado como retirado. 
                              Status atual: <span className="font-semibold">
                                {String(order.status).toUpperCase() === 'PENDING' ? 'Pendente' :
                                 String(order.status).toUpperCase() === 'PREPARING' ? 'Preparando' :
                                 String(order.status).toUpperCase() === 'SHIPPED' ? 'Enviado' :
                                 String(order.status).toUpperCase() === 'DELIVERED' ? 'Entregue' :
                                 String(order.status).toUpperCase() === 'COMPLETED' ? 'Concluído' :
                                 order.status}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        disabled
                        className="w-full bg-gray-400 cursor-not-allowed text-white h-12 text-lg font-semibold"
                      >
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Aguardando Entrega
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

