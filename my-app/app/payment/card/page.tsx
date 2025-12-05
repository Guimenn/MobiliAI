'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
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
import { customerAPI } from '@/lib/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCardForm from '@/components/StripeCardForm';

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

  // Aviso ao sair da página de pagamento - sempre ativo quando há um saleId
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Sempre verificar saleId diretamente do sessionStorage (mais confiável)
      const finalSaleId = sessionStorage.getItem('last-sale-id') || saleId;
      
      // Se houver um saleId, sempre mostrar aviso (exceto se pagamento foi concluído)
      if (finalSaleId) {
        // Verificar status atual do pagamento
        const currentStatus = paymentStatus;
        
        // Só não mostrar se o pagamento foi realmente concluído
        if (currentStatus !== 'succeeded') {
          // Padrão moderno para beforeunload
          e.preventDefault();
          // Chrome e outros navegadores modernos requerem returnValue
          e.returnValue = '';
          return '';
        }
      }
    };

    // Adicionar listener - garantir que está sendo registrado
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saleId, paymentStatus]);

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
          // Atualizar a URL sem recarregar a página
          router.replace(`/payment/card?saleId=${storedSaleId}`, { scroll: false });
        }
      }
      
      setIsInitializing(false);
      
      if (!finalSaleId) {
        setError('ID da venda não encontrado');
        setIsLoading(false);
        return;
      }

      if (!user || !token) {
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
                  onClick={() => router.push('/checkout')}
                  className="flex-1"
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
            <button onClick={() => router.push('/checkout')} className="hover:text-[#3e2626]">
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
                  onClick={() => router.push('/checkout')}
                  className="w-full"
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
    </div>
  );
}

