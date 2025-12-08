'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { customerAPI, paymentAPI } from '@/lib/api';
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
  Star,
  CreditCard,
  ArrowRight,
  Store
} from 'lucide-react';
import { toast } from 'sonner';
import ProductReviewModal from '@/components/ProductReviewModal';
import OrderCancelModal from '@/components/OrderCancelModal';

const getStatusConfig = (status: string) => {
  const statusUpper = String(status).toUpperCase();
  const configs: { [key: string]: { label: string; color: string; icon: any; description: string } } = {
    PENDING: { 
      label: 'Pendente', 
      color: 'bg-[#3e2626]/10 text-[#3e2626] border-[#3e2626]/30',
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
  return configs[statusUpper] || { 
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
  const statusUpper = String(status).toUpperCase();
  const timeline = [
    {
      step: 'PENDING',
      label: 'Pedido Realizado',
      // Sempre concluído, pois o pedido foi criado
      completed: true,
      date: createdAt,
      icon: CheckCircle
    },
    {
      step: 'PREPARING',
      label: 'Preparando',
      // Só marca como completo se realmente estiver em PREPARING, SHIPPED ou DELIVERED
      // COMPLETED significa apenas pagamento confirmado, não que está preparando
      completed: ['PREPARING', 'SHIPPED', 'DELIVERED'].includes(statusUpper),
      date: createdAt,
      icon: Package
    },
    {
      step: 'SHIPPED',
      label: 'Enviado',
      // Só marca como enviado se realmente estiver em SHIPPED ou DELIVERED
      completed: ['SHIPPED', 'DELIVERED'].includes(statusUpper),
      date: shippedAt || null,
      icon: Truck
    },
    {
      step: 'DELIVERED',
      label: 'Entregue',
      // Só marca como entregue se realmente estiver em DELIVERED
      // COMPLETED não significa entregue, apenas pagamento confirmado
      completed: statusUpper === 'DELIVERED',
      date: deliveredAt || null,
      icon: CheckCircle
    }
  ];

  if (statusUpper === 'CANCELLED') {
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
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
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

  // Verificar status do pedido periodicamente se estiver PENDING ou COMPLETED (para detectar quando pagamento é confirmado)
  useEffect(() => {
    // Verificar se o pedido está PENDING (aguardando pagamento) ou COMPLETED (pode precisar atualizar para PREPARING)
    if (!order || (order.status !== 'PENDING' && order.status !== 'COMPLETED') || !orderId || !token) {
      return;
    }

    const checkOrderStatus = async () => {
      try {
        console.log(`[Order Status Check] Verificando status do pedido ${orderId}...`);
        
        // Primeiro, verificar o status do pagamento no backend (isso pode atualizar o status automaticamente)
        // Isso funciona tanto para PIX quanto para cartão
        try {
          // Verificar status do pagamento PIX se houver paymentReference
          if (order.paymentMethod === 'PIX' || !order.paymentMethod) {
            console.log(`[Order Status Check] Verificando pagamento PIX para pedido ${orderId}...`);
            const paymentStatus = await customerAPI.checkPixPaymentStatus(orderId);
            console.log(`[Order Status Check] Status do pagamento PIX:`, paymentStatus);
          } else if (order.paymentMethod === 'CREDIT_CARD' && order.paymentReference) {
            // Verificar status do pagamento Stripe se houver paymentReference
            console.log(`[Order Status Check] Verificando pagamento Stripe para pedido ${orderId}...`);
            try {
              const stripeStatus = await paymentAPI.checkStripePaymentStatus(order.paymentReference);
              console.log(`[Order Status Check] Status do pagamento Stripe:`, stripeStatus);
              
              // Se o pagamento foi confirmado, confirmar no backend para atualizar o status
              if (stripeStatus.status === 'succeeded') {
                console.log(`[Order Status Check] Pagamento Stripe confirmado, confirmando no backend...`);
                await paymentAPI.confirmStripePayment(order.paymentReference);
              }
            } catch (stripeError: any) {
              console.warn('[Order Status Check] Erro ao verificar status do pagamento Stripe:', stripeError?.response?.data || stripeError?.message);
            }
          }
        } catch (paymentError: any) {
          // Ignorar erros de verificação de pagamento (pode não ter paymentReference ainda)
          console.warn('[Order Status Check] Erro ao verificar status do pagamento:', paymentError?.response?.data || paymentError?.message);
        }

        // Depois, buscar o pedido atualizado do backend
        const updatedOrder = await customerAPI.getOrderById(orderId);
        console.log(`[Order Status Check] Status atual do pedido: ${updatedOrder.status} (anterior: ${order.status})`);
        
        // Se o status mudou, atualizar o pedido
        if (updatedOrder.status !== order.status) {
          console.log(`[Order Status Check] ✅ Status do pedido atualizado: ${order.status} -> ${updatedOrder.status}`);
          setOrder(updatedOrder);
          
          // Se mudou para PREPARING, mostrar mensagem de sucesso
          if (updatedOrder.status === 'PREPARING') {
            toast.success('Pagamento confirmado! Seu pedido está sendo preparado.');
          }
        } else if (updatedOrder.status === 'PENDING') {
          console.log(`[Order Status Check] Pedido ainda está PENDING, aguardando pagamento...`);
        } else if (updatedOrder.status === 'COMPLETED') {
          console.log(`[Order Status Check] Pedido está COMPLETED, verificando se precisa atualizar para PREPARING...`);
        }
      } catch (error: any) {
        console.error('[Order Status Check] Erro ao verificar status do pedido:', error?.response?.data || error?.message);
      }
    };

    // Verificar imediatamente ao montar o componente
    checkOrderStatus();

    // Verificar a cada 3 segundos se o pedido ainda está PENDING
    const statusInterval = setInterval(checkOrderStatus, 3000);

    return () => clearInterval(statusInterval);
  }, [order, orderId, token]);

  // Atualizar contador de tempo restante para pedidos PENDING
  useEffect(() => {
    if (!order || order.status !== 'PENDING') {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const orderDate = new Date(order.createdAt);
      const expirationDate = new Date(orderDate.getTime() + 60 * 60 * 1000); // 1 hora
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expirationDate.getTime() - now.getTime()) / 1000));
      setTimeLeft(remaining);
    };

    // Atualizar imediatamente
    updateTimer();

    // Atualizar a cada segundo
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [order]);

  const loadOrder = async (checkPaymentStatus = false) => {
    if (!token || !orderId) return;
    
    setIsLoading(true);
    try {
      // Se o pedido está PENDING ou COMPLETED, verificar o status do pagamento primeiro
      if (checkPaymentStatus && (order?.status === 'PENDING' || order?.status === 'COMPLETED')) {
        try {
          if (order.paymentMethod === 'PIX' || !order.paymentMethod) {
            await customerAPI.checkPixPaymentStatus(orderId);
          } else if (order.paymentMethod === 'CREDIT_CARD' && order.paymentReference) {
            // Verificar status do pagamento Stripe se houver paymentReference
            try {
              const stripeStatus = await paymentAPI.checkStripePaymentStatus(order.paymentReference);
              // Se o pagamento foi confirmado, confirmar no backend para atualizar o status
              if (stripeStatus.status === 'succeeded') {
                await paymentAPI.confirmStripePayment(order.paymentReference);
              }
            } catch (stripeError) {
              console.warn('Erro ao verificar status do pagamento Stripe:', stripeError);
            }
          }
        } catch (paymentError) {
          console.warn('Erro ao verificar status do pagamento:', paymentError);
        }
      }

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

  const handleCancelOrder = () => {
    if (!order) return;
    setCancelModalOpen(true);
  };

  const handleOrderCancelled = async () => {
    loadOrder(); // Recarregar para atualizar o status

    // Recarregar carrinho se produtos foram adicionados
    try {
      await useAppStore.getState().loadCart();
    } catch (error) {
      console.error('Erro ao recarregar carrinho:', error);
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
            {order.status === 'DELIVERED' && (
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
            <Card className="shadow-xl border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5" />
                  </div>
                  Produtos do Pedido
                </CardTitle>
                <p className="text-white/80 text-sm mt-2">
                  Todos os produtos são processados pela loja responsável ({order.store?.name})
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {order.items?.map((item: any) => {
                    const isReviewed = isProductReviewed(item.productId);
                    const imageUrl = (item.product?.imageUrls && item.product.imageUrls.length > 0) 
                      ? item.product.imageUrls[0] 
                      : item.product?.imageUrl;
                    
                    return (
                      <div 
                        key={item.id} 
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-[#3e2626]/30 hover:shadow-md transition-all"
                      >
                        {/* Imagem do Produto */}
                        <div className="flex-shrink-0">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.product?.name || 'Produto'}
                              className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border-2 border-gray-200"
                              onError={(e) => {
                                console.error('Erro ao carregar imagem:', imageUrl);
                                e.currentTarget.src = '/placeholder-product.png';
                                e.currentTarget.onerror = null;
                              }}
                            />
                          ) : (
                            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Informações do Produto */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg text-[#3e2626] mb-1 line-clamp-2">
                                {item.product?.name || 'Produto não encontrado'}
                              </h3>
                              {item.product?.brand && (
                                <p className="text-sm text-gray-600 mb-2">
                                  Marca: <span className="font-semibold">{item.product.brand}</span>
                                </p>
                              )}
                            </div>
                            {isReviewed && order.status === 'DELIVERED' && (
                              <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1 flex-shrink-0">
                                <Star className="h-3 w-3 fill-green-600 text-green-600" />
                                Avaliado
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="font-medium">
                                Qtd: <span className="text-[#3e2626] font-bold">{item.quantity}</span>
                              </span>
                              <span className="font-medium">
                                Unit: <span className="text-[#3e2626] font-bold">{formatPrice(item.unitPrice)}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.productId) {
                                  router.push(`/products/${item.productId}`);
                                }
                              }}
                              className="text-[#3e2626] hover:text-[#5a3a3a] hover:bg-[#3e2626]/10"
                            >
                              Ver Produto
                            </Button>
                            {!isReviewed && order.status === 'DELIVERED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenReview(item);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Star className="h-4 w-4" />
                                Avaliar
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Preço Total do Item */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm text-gray-500 mb-1">Subtotal</p>
                          <p className="font-bold text-xl text-[#3e2626]">
                            {formatPrice(item.totalPrice || (Number(item.unitPrice) * item.quantity))}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total do Pedido */}
                <div className="mt-8 pt-6 border-t-2 border-[#3e2626]/20">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Total:</span>
                    <span className="text-2xl font-bold text-[#3e2626]">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações da Loja */}
            {order.store && (
              <Card className="border-2 border-[#3e2626]/20">
                <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Store className="h-5 w-5" />
                    </div>
                    Loja Responsável pelo Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] rounded-xl flex items-center justify-center shadow-lg">
                        <Store className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-xl text-[#3e2626]">
                          {order.storeDisplayName || order.store?.name || 'Loja não identificada'}
                        </p>
                        <p className="text-sm text-gray-600">Todos os produtos deste pedido vêm desta loja</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      {order.store.address && (
                        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-blue-900 text-sm">Endereço</p>
                            <p className="text-blue-800 text-sm">
                              {order.storeDisplayAddress || order.store.address}
                            </p>
                          </div>
                        </div>
                      )}
                      {order.store.phone && (
                        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <Phone className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-green-900 text-sm">Telefone</p>
                            <p className="text-green-800 text-sm">{order.store.phone}</p>
                          </div>
                        </div>
                      )}
                      {order.store.email && (
                        <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200 md:col-span-2">
                          <Mail className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-purple-900 text-sm">E-mail</p>
                            <p className="text-purple-800 text-sm">{order.store.email}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-900 text-sm">Importante</p>
                          <p className="text-amber-800 text-sm">
                            Todos os produtos deste pedido são processados e enviados por esta loja.
                            Em caso de dúvidas, entre em contato diretamente com a loja responsável.
                          </p>
                        </div>
                      </div>
                    </div>
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

            {/* Retomar Pagamento - Mostrar apenas se pedido estiver PENDING */}
            {order.status === 'PENDING' && (() => {
              const hours = Math.floor(timeLeft / 3600);
              const minutes = Math.floor((timeLeft % 3600) / 60);
              const seconds = timeLeft % 60;
              const isExpiringSoon = timeLeft < 30 * 60 && timeLeft > 0; // Menos de 30 minutos
              
              return (
                <Card className={`border-2 ${isExpiringSoon ? 'border-red-300 bg-gradient-to-br from-red-50 to-orange-50' : 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50'}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${isExpiringSoon ? 'bg-red-500' : 'bg-yellow-500'} rounded-lg flex items-center justify-center`}>
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className={isExpiringSoon ? 'text-red-900' : 'text-yellow-900'}>
                          Pagamento Pendente
                        </CardTitle>
                        <p className={`text-sm mt-1 ${isExpiringSoon ? 'text-red-700' : 'text-yellow-700'}`}>
                          {timeLeft > 0 
                            ? `Tempo restante: ${hours}h ${minutes}m ${seconds}s`
                            : 'Tempo esgotado! O pedido será cancelado em breve.'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isExpiringSoon && timeLeft > 0 && (
                      <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertCircle className="h-4 w-4" />
                          <p className="text-sm font-semibold">
                            Atenção! Restam menos de 30 minutos para concluir o pagamento.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-white rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Valor a pagar:</span>
                        <span className="text-xl font-bold text-[#3e2626]">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                      {order.paymentMethod && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <CreditCard className="h-4 w-4" />
                          <span>
                            Método: {order.paymentMethod === 'PIX' ? 'PIX' : 
                                     order.paymentMethod === 'CREDIT_CARD' ? 'Cartão de Crédito' :
                                     order.paymentMethod === 'DEBIT_CARD' ? 'Cartão de Débito' :
                                     order.paymentMethod}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => {
                        // Redirecionar para a página de pagamento baseado no método escolhido
                        const paymentMethod = order.paymentMethod?.toLowerCase() || 'pix';
                        if (paymentMethod === 'credit_card' || paymentMethod === 'creditcard') {
                          router.push(`/payment/card?saleId=${order.id}`);
                        } else {
                          router.push(`/payment/pix?saleId=${order.id}`);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white hover:from-[#2a1f1f] hover:to-[#3e2626] flex items-center justify-center gap-2"
                    >
                      <CreditCard className="h-5 w-5" />
                      Retomar Pagamento
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    
                    <p className="text-xs text-yellow-700 text-center">
                      {timeLeft > 0 
                        ? 'Seu pedido será processado assim que o pagamento for confirmado'
                        : 'O pedido será cancelado automaticamente por falta de pagamento'}
                    </p>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Ações */}
            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'COMPLETED' && order.status !== 'PENDING' && order.status !== 'SHIPPED' && (
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
            
            {/* Cancelar Pedido - Mostrar também quando PENDING (mas depois do botão de pagamento) */}
            {order.status === 'PENDING' && (
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

      {/* Modal de Cancelamento */}
      <OrderCancelModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        order={order}
        onOrderCancelled={handleOrderCancelled}
      />

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

      {/* Modal de Cancelamento */}
      {order && (
        <OrderCancelModal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          order={order}
          onOrderCancelled={handleOrderCancelled}
        />
      )}
    </div>
  );
}

