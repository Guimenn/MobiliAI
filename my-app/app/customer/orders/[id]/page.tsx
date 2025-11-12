'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { customerAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Package,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  Phone,
  Mail,
  User,
  AlertCircle,
  RefreshCw,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import ProductReviewModal from '@/components/ProductReviewModal';

const getStatusConfig = (status: string) => {
  const configs: { [key: string]: { label: string; color: string; icon: any; description: string } } = {
    PENDING: { 
      label: 'Pendente', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: Clock,
      description: 'Seu pedido está aguardando confirmação'
    },
    PREPARING: { 
      label: 'Preparando', 
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Package,
      description: 'Seu pedido está sendo preparado'
    },
    SHIPPED: { 
      label: 'Enviado', 
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: Truck,
      description: 'Seu pedido foi enviado e está a caminho'
    },
    DELIVERED: { 
      label: 'Entregue', 
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircle,
      description: 'Seu pedido foi entregue com sucesso'
    },
    CANCELLED: { 
      label: 'Cancelado', 
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: XCircle,
      description: 'Este pedido foi cancelado'
    },
    COMPLETED: { 
      label: 'Concluído', 
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircle,
      description: 'Pedido finalizado com sucesso'
    },
  };
  return configs[status] || { 
    label: status, 
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Package,
    description: 'Status do pedido'
  };
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

const getStatusTimeline = (status: string, createdAt: Date, shippedAt?: Date | null, deliveredAt?: Date | null) => {
  const timeline = [
    {
      step: 'PENDING',
      label: 'Pedido Realizado',
      completed: true,
      date: createdAt,
      icon: CheckCircle
    },
    {
      step: 'PREPARING',
      label: 'Preparando',
      completed: ['PREPARING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status),
      date: createdAt,
      icon: Package
    },
    {
      step: 'SHIPPED',
      label: 'Enviado',
      completed: ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status),
      date: shippedAt || null,
      icon: Truck
    },
    {
      step: 'DELIVERED',
      label: 'Entregue',
      completed: ['DELIVERED', 'COMPLETED'].includes(status),
      date: deliveredAt || null,
      icon: CheckCircle
    }
  ];

  if (status === 'CANCELLED') {
    timeline.forEach(item => {
      if (item.step !== 'PENDING') {
        item.completed = false;
      }
    });
  }

  return timeline;
};

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { user, isAuthenticated, token } = useAppStore();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [existingReviews, setExistingReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      router.push(`/login?redirect=/customer/orders/${orderId}`);
      return;
    }
  }, [isAuthenticated, user, token, router, orderId]);

  useEffect(() => {
    if (isAuthenticated && user && token && orderId) {
      loadOrder();
    }
  }, [isAuthenticated, user, token, orderId]);

  const loadOrder = async () => {
    if (!token || !orderId) return;
    
    setIsLoading(true);
    try {
      const orderData = await customerAPI.getOrderById(orderId);
      setOrder(orderData);
      
      // Carregar avaliações existentes após carregar o pedido
      if (orderData.status === 'DELIVERED' || orderData.status === 'COMPLETED') {
        await loadExistingReviewsForOrder(orderData);
      }
    } catch (error: any) {
      console.error('Erro ao carregar pedido:', error);
      if (error.response?.status === 403 || error.response?.status === 404) {
        toast.error('Pedido não encontrado ou você não tem permissão para visualizá-lo');
        router.push('/customer/orders');
      } else {
        toast.error('Erro ao carregar pedido. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingReviewsForOrder = async (orderData: any) => {
    if (!orderData.items || !user?.id) return;
    
    try {
      // Buscar todas as avaliações do usuário
      const myReviews = await customerAPI.getMyReviews(1, 100);
      const reviews: any[] = [];
      
      // Filtrar avaliações que pertencem a este pedido
      if (myReviews.reviews) {
        for (const item of orderData.items) {
          const reviewForProduct = myReviews.reviews.find(
            (r: any) => r.productId === item.productId && r.saleId === orderId
          );
          if (reviewForProduct) {
            reviews.push(reviewForProduct);
          }
        }
      }
      
      setExistingReviews(reviews);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      // Se falhar, tentar buscar avaliação por produto
      try {
        const reviews: any[] = [];
        for (const item of orderData.items) {
          try {
            const productReviews = await customerAPI.getProductReviews(item.productId, 1, 10);
            const reviewForThisOrder = productReviews.reviews?.find(
              (r: any) => r.saleId === orderId
            );
            if (reviewForThisOrder) {
              reviews.push(reviewForThisOrder);
            }
          } catch (err) {
            // Ignorar erros individuais
          }
        }
        setExistingReviews(reviews);
      } catch (err) {
        console.error('Erro ao buscar avaliações por produto:', err);
      }
    }
  };

  const handleOpenReview = (item: any) => {
    setSelectedProduct({
      id: item.productId,
      name: item.product?.name || 'Produto',
      imageUrl: item.product?.imageUrls?.[0]
    });
    setReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    loadExistingReviewsForOrder(order);
    loadOrder(); // Recarregar para atualizar informações
  };

  const isProductReviewed = (productId: string) => {
    return existingReviews.some(review => review.productId === productId);
  };

  const getUnreviewedProducts = () => {
    if (!order?.items) return [];
    return order.items.filter((item: any) => !isProductReviewed(item.productId));
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    const confirmed = window.confirm(
      'Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;

    setIsCancelling(true);
    try {
      await customerAPI.cancelOrder(order.id);
      toast.success('Pedido cancelado com sucesso');
      loadOrder(); // Recarregar para atualizar o status
    } catch (error: any) {
      console.error('Erro ao cancelar pedido:', error);
      toast.error(error.response?.data?.message || 'Erro ao cancelar pedido. Tente novamente.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isAuthenticated || !user || !token) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#3e2626] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando detalhes do pedido...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">Pedido não encontrado</p>
              <Button onClick={() => router.push('/customer/orders')}>
                Voltar para Meus Pedidos
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const timeline = getStatusTimeline(order.status, order.createdAt, order.shippedAt, order.deliveredAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/customer/orders')}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar para Meus Pedidos
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#3e2626] mb-2">
                Pedido #{order.saleNumber}
              </h1>
              <p className="text-gray-600">{statusConfig.description}</p>
            </div>
            <Badge className={`${statusConfig.color} border flex items-center gap-2 px-4 py-2`}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline do Status */}
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {timeline.map((step, index) => {
                    const StepIcon = step.icon;
                    const isLast = index === timeline.length - 1;
                    
                    return (
                      <div key={step.step} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              step.completed
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            <StepIcon className="h-5 w-5" />
                          </div>
                          {!isLast && (
                            <div
                              className={`w-1 min-h-[60px] mt-2 ${
                                step.completed ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                              style={{ height: '60px' }}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p
                                className={`font-semibold ${
                                  step.completed ? 'text-green-600' : 'text-gray-500'
                                }`}
                              >
                                {step.label}
                              </p>
                              {step.date && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {formatDate(step.date)}
                                </p>
                              )}
                            </div>
                            {step.completed && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {order.trackingCode && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-semibold text-purple-900">Código de Rastreamento</p>
                          <p className="text-purple-700 font-mono">{order.trackingCode}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Avaliação de Produtos - Mostrar apenas se pedido entregue */}
            {(order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-green-900">Avalie seus Produtos</CardTitle>
                      <p className="text-sm text-green-700 mt-1">
                        Compartilhe sua experiência com os produtos que você recebeu
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {getUnreviewedProducts().length > 0 ? (
                    <div className="space-y-3">
                      {getUnreviewedProducts().map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-green-200">
                          {(() => {
                            const imageUrl = (item.product?.imageUrls && item.product.imageUrls.length > 0) 
                              ? item.product.imageUrls[0] 
                              : item.product?.imageUrl;
                            return imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.product.name}
                                className="w-16 h-16 object-cover rounded-lg border-2 border-green-200"
                                onError={(e) => {
                                  console.error('Erro ao carregar imagem:', imageUrl);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : null;
                          })()}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{item.product?.name || 'Produto'}</p>
                            <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                          </div>
                          <Button
                            onClick={() => handleOpenReview(item)}
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                          >
                            <Star className="h-4 w-4" />
                            Avaliar
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="text-green-800 font-semibold">Todos os produtos foram avaliados!</p>
                      <p className="text-sm text-green-600 mt-1">Obrigado por compartilhar sua experiência.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Itens do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle>Itens do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item: any) => {
                    const isReviewed = isProductReviewed(item.productId);
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={(e) => {
                          // Só navegar se não clicar em botões
                          if ((e.target as HTMLElement).closest('button')) return;
                          if (item.productId) {
                            router.push(`/products/${item.productId}`);
                          }
                        }}
                      >
                        {(() => {
                          const imageUrl = (item.product?.imageUrls && item.product.imageUrls.length > 0) 
                            ? item.product.imageUrls[0] 
                            : item.product?.imageUrl;
                          return imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.product.name}
                              onError={(e) => {
                                console.error('Erro ao carregar imagem:', imageUrl);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : null;
                        })()}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800 hover:text-[#3e2626] transition-colors">
                              {item.product?.name || 'Produto não encontrado'}
                            </p>
                            {isReviewed && (order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
                              <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
                                <Star className="h-3 w-3 fill-green-600 text-green-600" />
                                Avaliado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.quantity} x {formatPrice(item.unitPrice)}
                          </p>
                          {item.product?.brand && (
                            <p className="text-xs text-gray-500 mt-1">Marca: {item.product.brand}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.productId) {
                                  router.push(`/products/${item.productId}`);
                                }
                              }}
                              className="text-[#3e2626] hover:text-[#5a3a3a] hover:bg-[#3e2626]/10 h-7 px-2 text-xs"
                            >
                              Ver Produto
                            </Button>
                            {!isReviewed && (order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenReview(item);
                                }}
                                className="flex items-center gap-2 h-7 px-2 text-xs"
                              >
                                <Star className="h-3 w-3" />
                                Avaliar
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-[#3e2626]">
                            {formatPrice(item.totalPrice)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-[#3e2626] text-2xl">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações da Loja */}
            {order.store && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Loja</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="font-semibold text-lg">{order.store.name}</p>
                    {order.store.address && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <span>{order.store.address}</span>
                      </div>
                    )}
                    {order.store.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{order.store.phone}</span>
                      </div>
                    )}
                    {order.store.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{order.store.email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Resumo do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Número do Pedido</span>
                  <span className="font-semibold">#{order.saleNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Data do Pedido</span>
                  <span className="font-semibold">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                </div>
                {order.deliveredAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Data de Entrega</span>
                    <span className="font-semibold">{formatDate(order.deliveredAt)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-xl font-bold text-[#3e2626]">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço de Entrega */}
            {order.shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle>Endereço de Entrega</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                      <div>
                        <p className="font-medium">{order.shippingAddress}</p>
                        <p className="text-gray-600">
                          {order.shippingCity} - {order.shippingState}
                        </p>
                        <p className="text-gray-600">CEP: {order.shippingZipCode}</p>
                        {order.shippingPhone && (
                          <p className="text-gray-600 mt-1">Telefone: {order.shippingPhone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ações */}
            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'COMPLETED' && (
              <Card>
                <CardContent className="p-6">
                  <Button
                    variant="outline"
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {isCancelling ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar Pedido
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Modal de Avaliação */}
      {selectedProduct && (
        <ProductReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          saleId={orderId}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}

