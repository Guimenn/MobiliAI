'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { customerAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { env } from '@/lib/env';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCardForm from '@/components/StripeCardForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Loader } from '@/components/ui/ai/loader';
const stripePromise = loadStripe(env.STRIPE_PUBLISHABLE_KEY);

export default function CardPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAppStore();
  const saleIdFromUrl = searchParams.get('saleId');
  const [saleId, setSaleId] = useState<string | null>(saleIdFromUrl);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [saleNumber, setSaleNumber] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const pendingNavigation = useRef<string | null>(null);

  // Garantir que o carrinho local preserve itens não selecionados mesmo se o backend estiver sem eles
  useEffect(() => {
    const mergeCartFromBackend = async () => {
      try {
        const store = useAppStore.getState();
        const localCart = store.cart || [];

        // Reidratar itens restantes salvos no checkout (fallback antecipado)
        let persistedRemaining: any[] = [];
        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem('checkout-remaining-items');
          if (stored) {
            try {
              persistedRemaining = JSON.parse(stored);
            } catch (e) {
              console.warn('Erro ao parsear checkout-remaining-items', e);
            }
          }
        }

        // Se houver itens persistidos, aplica imediatamente no store e reenvia ao backend
        if (persistedRemaining.length > 0) {
          useAppStore.setState((state) => {
            const merged = [...state.cart];
            const existingIds = new Set(merged.map(ci => ci.product.id));
            for (const pr of persistedRemaining) {
              if (!existingIds.has(pr.product.id)) {
                merged.push(pr);
              }
            }
            const cartTotal = merged.reduce((sum, it) => sum + (it.subtotal || (Number(it.product.price) * it.quantity)), 0);
            return { cart: merged, cartTotal };
          });

          // reenviar para backend antes do fetch oficial
          for (const pr of persistedRemaining) {
            try {
              await customerAPI.addToCart(pr.product.id, pr.quantity || 1);
            } catch (e) {
              console.warn('Erro ao reenviar item restante ao backend', e);
            }
          }
        }

        // Buscar backend após reenvio
        const cartData = await customerAPI.getCart();
        const backendItems = cartData?.items || [];

        const backendMap = new Map<string, any>();
        backendItems.forEach((item: any) => backendMap.set(item.product.id, item));

        const merged: any[] = [];
        for (const localItem of localCart) {
          const backendItem = backendMap.get(localItem.product.id);
          if (backendItem) {
            merged.push({
              id: backendItem.id,
              product: backendItem.product,
              quantity: backendItem.quantity,
              subtotal: Number(backendItem.product.price) * backendItem.quantity,
            });
            backendMap.delete(localItem.product.id);
          } else {
            merged.push(localItem);
          }
        }

        for (const item of backendMap.values()) {
          merged.push({
            id: item.id,
            product: item.product,
            quantity: item.quantity,
            subtotal: Number(item.product.price) * item.quantity,
          });
        }

        const cartTotal = merged.reduce((sum, it) => sum + (it.subtotal || (Number(it.product.price) * it.quantity)), 0);
        useAppStore.setState({ cart: merged, cartTotal });

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('checkout-remaining-items');
        }
      } catch (err) {
        console.error('Erro ao mesclar carrinho no payment (card):', err);
      }
    };

    mergeCartFromBackend();
  }, []);

  // Estado para rastrear se o usuário interagiu com a página (necessário para beforeunload funcionar)
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Registrar interação do usuário
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserInteraction = () => {
      setHasUserInteracted(true);
    };

    // Registrar qualquer interação do usuário
    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('keydown', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Função para cancelar pedido e restaurar produtos no carrinho
  const handleCancelOrder = async () => {
    const finalSaleId = saleId || (typeof window !== 'undefined' ? sessionStorage.getItem('last-sale-id') : null);
    
    if (!finalSaleId || paymentStatus === 'succeeded') {
      return;
    }

    setIsCancelling(true);
    setError(''); // Limpar erros anteriores
    
    try {
      console.log('🔄 Iniciando cancelamento do pedido:', finalSaleId);
      
      // Buscar os itens do pedido antes de cancelar
      const order = await customerAPI.getOrderById(finalSaleId);
      console.log('📦 Pedido encontrado:', {
        id: order.id,
        status: order.status,
        itemsCount: order.items?.length || 0
      });
      
      // Verificar se o pedido pode ser cancelado
      if (order.status === 'CANCELLED') {
        console.warn('⚠️ Pedido já está cancelado');
        setError('Este pedido já foi cancelado.');
        setIsCancelling(false);
        return;
      }
      
      if (order.status === 'COMPLETED') {
        console.warn('⚠️ Pedido já está finalizado');
        setError('Este pedido já foi finalizado e não pode ser cancelado.');
        setIsCancelling(false);
        return;
      }
      
      // Cancelar o pedido
      console.log('🚫 Cancelando pedido...');
      try {
        await customerAPI.cancelOrder(finalSaleId, 'Cancelado pelo cliente ao sair da página de pagamento');
        console.log('✅ Pedido cancelado com sucesso');
      } catch (cancelErr: any) {
        console.error('❌ Erro ao cancelar pedido:', {
          message: cancelErr.message,
          response: cancelErr.response?.data,
          status: cancelErr.response?.status,
          statusText: cancelErr.response?.statusText
        });
        const errorMessage = cancelErr.response?.data?.message || cancelErr.message || 'Erro ao cancelar pedido';
        throw new Error(errorMessage);
      }
      
      // Restaurar produtos no carrinho
      if (order.items && order.items.length > 0) {
        console.log(`Restaurando ${order.items.length} produtos ao carrinho...`);
        
        // Adicionar produtos ao carrinho usando a API diretamente
        // Isso adiciona no backend e o store será atualizado automaticamente
        for (const item of order.items) {
          try {
            // Usar a API diretamente com productId
            await customerAPI.addToCart(item.productId, item.quantity);
            console.log(`✅ Produto ${item.productId} (qtd: ${item.quantity}) adicionado ao carrinho no backend`);
            
            // Pequeno delay entre adições para evitar sobrecarga
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err: any) {
            console.error(`❌ Erro ao adicionar produto ${item.productId} ao carrinho:`, err);
            // Continuar mesmo se um produto falhar
          }
        }
        
        // Aguardar um pouco para garantir que o backend processou tudo
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Recarregar carrinho do backend para atualizar o store
        try {
          const cartData = await customerAPI.getCart();
          if (cartData?.items) {
            // Obter carrinho atual para preservar dados locais
            const currentCart = useAppStore.getState().cart;
            
            const cartItems = cartData.items.map((item: any) => {
              // Tentar encontrar produto correspondente no carrinho local
              const localItem = currentCart.find(ci => ci.product.id === item.product.id);
              const localProduct = localItem?.product;
              
              // Mesclar dados do backend com dados locais
              const mergedProduct = {
                id: item.product.id,
                name: item.product.name,
                description: item.product.description || '',
                category: item.product.category?.toLowerCase() || 'sofa',
                price: Number(item.product.price),
                stock: item.product.stock || 0,
                imageUrl: item.product.imageUrls?.[0] || '',
                imageUrls: item.product.imageUrls || [],
                colorName: item.product.colorName,
                colorHex: item.product.colorHex,
                brand: item.product.brand,
                storeId: item.product.storeId || '',
                // Preservar dados locais de ofertas
                isOnSale: localProduct?.isOnSale !== undefined ? localProduct.isOnSale : (item.product.isOnSale || false),
                salePrice: localProduct?.salePrice || (item.product.salePrice ? Number(item.product.salePrice) : undefined),
                saleDiscountPercent: localProduct?.saleDiscountPercent || (item.product.saleDiscountPercent ? Number(item.product.saleDiscountPercent) : undefined),
                isFlashSale: localProduct?.isFlashSale !== undefined ? localProduct.isFlashSale : (item.product.isFlashSale || false),
                flashSalePrice: localProduct?.flashSalePrice || (item.product.flashSalePrice ? Number(item.product.flashSalePrice) : undefined),
                flashSaleDiscountPercent: localProduct?.flashSaleDiscountPercent || (item.product.flashSaleDiscountPercent ? Number(item.product.flashSaleDiscountPercent) : undefined),
              };
              
              return {
                id: item.id,
                product: mergedProduct,
                quantity: item.quantity,
              };
            });
            
            const cartTotal = cartItems.reduce(
              (total, item) => total + (Number(item.product.price) * item.quantity),
              0
            );
            
            // Atualizar o store usando set diretamente
            useAppStore.setState({ cart: cartItems, cartTotal });
            console.log('✅ Carrinho atualizado no store:', cartItems.length, 'itens');
          }
        } catch (err) {
          console.error('Erro ao recarregar carrinho:', err);
          // Não bloquear a navegação se falhar
        }
        
        console.log('✅ Todos os produtos foram restaurados ao carrinho');
      }
      
      // Limpar sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('last-sale-id');
      }
      
      // Se havia uma navegação pendente, executá-la
      if (pendingNavigation.current) {
        router.push(pendingNavigation.current);
        pendingNavigation.current = null;
      } else {
        router.push('/checkout');
      }
    } catch (err: any) {
      console.error('Erro ao cancelar pedido:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao cancelar pedido. Por favor, entre em contato com o suporte.';
      setError(errorMessage);
      setIsCancelling(false);
    }
  };

  // Interceptar tentativas de navegação
  useEffect(() => {
    if (typeof window === 'undefined' || paymentStatus === 'succeeded') return;

    const finalSaleId = saleId || sessionStorage.getItem('last-sale-id');
    if (!finalSaleId) return;

    // Interceptar cliques em links
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href) {
        const url = new URL(link.href);
        // Ignorar links externos ou que não sejam navegação interna
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          e.preventDefault();
          pendingNavigation.current = url.pathname + url.search;
          setShowExitConfirm(true);
        }
      }
    };

    // Interceptar beforeunload (fechar aba/navegador)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (paymentStatus !== 'succeeded') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // Interceptar botão voltar do navegador
    const handlePopState = (e: PopStateEvent) => {
      if (paymentStatus !== 'succeeded') {
        e.preventDefault();
        pendingNavigation.current = '/checkout';
        setShowExitConfirm(true);
        // Adicionar estado de volta para manter na página
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleLinkClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [saleId, paymentStatus, router]);

  // Função wrapper para navegação segura
  const safeNavigate = (url: string, method: 'push' | 'replace' = 'push') => {
    if (paymentStatus === 'succeeded') {
      if (method === 'push') {
        router.push(url);
      } else {
        router.replace(url);
      }
      return;
    }

    const finalSaleId = saleId || (typeof window !== 'undefined' ? sessionStorage.getItem('last-sale-id') : null);
    if (!finalSaleId) {
      if (method === 'push') {
        router.push(url);
      } else {
        router.replace(url);
      }
      return;
    }

    // Permitir navegação para página de sucesso sem confirmação
    if (url.includes('/checkout/success')) {
      if (method === 'push') {
        router.push(url);
      } else {
        router.replace(url);
      }
      return;
    }

    // Para outras navegações, mostrar confirmação
    pendingNavigation.current = url;
    setShowExitConfirm(true);
  };

  // Verificar se temos todas as dependências necessárias e buscar saleId do sessionStorage se necessário
  useEffect(() => {
    // Aguardar um pouco para garantir que o store tenha carregado
    const checkDependencies = setTimeout(() => {
      let finalSaleId = saleId;
      
      // Se não tiver saleId na URL, tentar buscar do sessionStorage
      if (!finalSaleId && typeof window !== 'undefined') {
        const storedSaleId = sessionStorage.getItem('last-sale-id');
        if (storedSaleId) {
          finalSaleId = storedSaleId;
          setSaleId(storedSaleId);
          // Atualizar a URL sem recarregar a página (permitir sem confirmação)
          const currentUrl = `/payment/card?saleId=${storedSaleId}`;
          if (window.location.pathname + window.location.search !== currentUrl) {
            router.replace(currentUrl, { scroll: false });
          }
        }
      }
      
      setIsInitializing(false);
      
      if (!finalSaleId) {
        setError('ID da venda não encontrado');
        setIsLoading(false);
        return;
      }

      if (!user || !token) {
        // Permitir navegação para login sem confirmação
        router.push('/login?redirect=/payment/card&saleId=' + finalSaleId);
        return;
      }

      // Criar PaymentIntent após confirmar que temos tudo
      createPaymentIntent(finalSaleId);
    }, 500);

    return () => clearTimeout(checkDependencies);
  }, [saleIdFromUrl, saleId, user, token, router]);

  const createPaymentIntent = async (saleIdToUse?: string | null) => {
    // Usar o saleId passado como parâmetro, ou do estado, ou do sessionStorage
    const finalSaleId = saleIdToUse || saleId || (typeof window !== 'undefined' ? sessionStorage.getItem('last-sale-id') : null);
    
    if (!finalSaleId) {
      setError('ID da venda não encontrado');
      setIsLoading(false);
      return;
    }

    if (!user || !token) {
      // Permitir navegação para login sem confirmação
      router.push('/login?redirect=/payment/card&saleId=' + finalSaleId);
      return;
    }

    setIsCreatingIntent(true);
    setError('');

    try {
      const response = await customerAPI.createStripePaymentIntent(
        finalSaleId,
        {
          name: user.name,
          email: user.email,
          phone: user.phone,
          cpf: user.cpf,
        }
      );

      setClientSecret(response.clientSecret);
      setAmount(response.amount);
      setSaleNumber(response.saleNumber || '');
      setIsLoading(false);
    } catch (err: any) {
      console.error('Erro ao criar PaymentIntent:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao criar pagamento.';
      
      // Mensagem mais amigável para erro de venda não encontrada
      if (errorMessage.includes('não encontrada') || errorMessage.includes('not found')) {
        setError(
          'Pedido não encontrado. Isso pode acontecer se o pedido não foi criado corretamente. ' +
          'Por favor, volte ao checkout e tente novamente.'
        );
      } else {
        setError(errorMessage + ' Tente novamente ou entre em contato com o suporte.');
      }
      
      setIsLoading(false);
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Marcar status como succeeded para remover o aviso de saída
      setPaymentStatus('succeeded');
      
      // Confirmar pagamento no backend e obter o saleId
      const confirmationResult = await customerAPI.confirmStripePayment(paymentIntentId);
      
      // Usar o saleId retornado, ou do estado, ou do sessionStorage
      const finalSaleId = confirmationResult?.saleId || saleId || (typeof window !== 'undefined' ? sessionStorage.getItem('last-sale-id') : null);
      
      if (!finalSaleId) {
        console.error('SaleId não encontrado após confirmação do pagamento', {
          confirmationResult,
          saleId,
          sessionStorageSaleId: typeof window !== 'undefined' ? sessionStorage.getItem('last-sale-id') : null,
        });
        setError('Erro ao obter ID do pedido. Entre em contato com o suporte.');
        return;
      }
      
      // Salvar saleId no sessionStorage como backup
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('last-sale-id', finalSaleId);
      }
      
      // Redirecionar para página de sucesso com o saleId
      router.push(`/checkout/success?saleId=${finalSaleId}`);
    } catch (err: any) {
      console.error('Erro ao confirmar pagamento:', err);
      setError('Erro ao confirmar pagamento. Entre em contato com o suporte.');
      setPaymentStatus(''); // Resetar status em caso de erro
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (isInitializing || isLoading || isCreatingIntent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#3e2626] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">
                {isCreatingIntent ? 'Criando pagamento...' : 'Carregando...'}
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Card className="max-w-2xl mx-auto shadow-xl border-2 border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>Erro ao processar pagamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-6">{error}</p>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    pendingNavigation.current = '/checkout';
                    setShowExitConfirm(true);
                  }}
                  className="flex-1"
                  disabled={isCancelling}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Checkout
                </Button>
                <Button
                  onClick={() => createPaymentIntent()}
                  className="flex-1 bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white"
                >
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button 
              onClick={() => {
                pendingNavigation.current = '/checkout';
                setShowExitConfirm(true);
              }} 
              className="hover:text-[#3e2626]"
            >
              Checkout
            </button>
            <span>/</span>
            <span className="text-[#3e2626] font-semibold">Pagamento com Cartão</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Pagamento com Cartão de Crédito</span>
              </CardTitle>
              <CardDescription className="text-white/90">
                Pedido #{saleNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#3e2626',
                        colorBackground: '#ffffff',
                        colorText: '#1f2937',
                        colorDanger: '#ef4444',
                        fontFamily: 'system-ui, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '8px',
                      },
                    },
                  }}
                >
                  <StripeCardForm
                    clientSecret={clientSecret}
                    amount={amount}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    saleId={saleId}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <Loader size={32} className="text-[#3e2626] mx-auto mb-4" />
                  <p className="text-gray-600">Preparando formulário de pagamento...</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    pendingNavigation.current = '/checkout';
                    setShowExitConfirm(true);
                  }}
                  className="w-full"
                  disabled={isCancelling}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Checkout
                </Button>
              </div>

              {/* Informações de segurança */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Pagamento Seguro
                    </p>
                    <p className="text-xs text-gray-600">
                      Seus dados são protegidos com criptografia SSL. Não armazenamos informações do seu cartão.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dados de teste do Stripe (apenas em desenvolvimento) */}
              {env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        💳 Dados de Teste do Stripe
                      </p>
                      <div className="space-y-2 text-xs text-blue-800">
                        <div>
                          <span className="font-semibold">Cartão de Sucesso:</span>
                          <p className="font-mono bg-white p-2 rounded mt-1">
                            4242 4242 4242 4242
                          </p>
                          <p className="mt-1">Data: Qualquer data futura (ex: 12/25)</p>
                          <p>CVC: Qualquer 3 dígitos (ex: 123)</p>
                          <p>CEP: Qualquer CEP válido (ex: 12345-678)</p>
                        </div>
                        <div className="pt-2 border-t border-blue-200">
                          <span className="font-semibold">Cartão que Requer Autenticação:</span>
                          <p className="font-mono bg-white p-2 rounded mt-1">
                            4000 0025 0000 3155
                          </p>
                        </div>
                        <div className="pt-2 border-t border-blue-200">
                          <span className="font-semibold">Cartão Recusado:</span>
                          <p className="font-mono bg-white p-2 rounded mt-1">
                            4000 0000 0000 0002
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />

      {/* Modal de confirmação de saída */}
      <ConfirmDialog
        open={showExitConfirm}
        onOpenChange={setShowExitConfirm}
        title="Cancelar pagamento?"
        message="Se você sair agora, o pedido será cancelado e os produtos voltarão para o carrinho. Deseja realmente sair?"
        confirmText="Sim, sair"
        cancelText="Continuar pagamento"
        onConfirm={handleCancelOrder}
        onCancel={() => {
          pendingNavigation.current = null;
          setShowExitConfirm(false);
        }}
        variant="destructive"
      />
    </div>
  );
}

