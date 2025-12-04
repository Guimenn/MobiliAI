'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { env } from '@/lib/env';
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  RefreshCw,
  QrCode,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Loader } from '@/components/ui/ai/loader';
import { customerAPI } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

export default function PixPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAppStore();
  const saleIdFromUrl = searchParams.get('saleId');
  const [saleId, setSaleId] = useState<string | null>(saleIdFromUrl);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'EXPIRED'>('PENDING');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState<string>('');
  const [simulationError, setSimulationError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  const isProductionEnv =
    env.ABACATEPAY_ENVIRONMENT === 'production' || env.NODE_ENV === 'production';

  // ===== Utilitários para gerar BR Code PIX estático com valor dinâmico (fallback) =====
  type EmvFieldId = string;

  function emv(id: EmvFieldId, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  }

  function crc16Ccitt(payload: string): string {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
        crc &= 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function buildStaticPixBrCode(amount: number): string {
    const amountStr = (Number(amount) || 0).toFixed(2).replace(',', '.');
    const gui = emv('00', 'br.gov.bcb.pix');
    const key = emv('01', '59370893830'); // chave fixa CPF
    const mai = gui + key;
    const maiField = emv('26', mai);

    const payloadWithoutCrc =
      emv('00', '01') +
      emv('01', '11') +
      maiField +
      emv('52', '0000') +
      emv('53', '986') +
      emv('54', amountStr) +
      emv('58', 'BR') +
      emv('59', 'GUILHERME V MEN') +
      emv('60', 'SAO BERNARDO') +
      emv('62', emv('05', '***')) +
      '6304';

    const crc = crc16Ccitt(payloadWithoutCrc);
    return payloadWithoutCrc + crc;
  }

  const fallbackPixCode = useMemo(() => {
    if (env.PIX_FALLBACK_BR_CODE) {
      return env.PIX_FALLBACK_BR_CODE;
    }
    return buildStaticPixBrCode(Number(paymentData?.amount) || 0);
  }, [paymentData?.amount]);

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
          router.replace(`/payment/pix?saleId=${storedSaleId}`, { scroll: false });
        }
      }
      
      setIsInitializing(false);
      
      if (!finalSaleId) {
        setError('ID da venda não encontrado. Redirecionando...');
        setTimeout(() => router.push('/checkout'), 2000);
        return;
      }
      
      if (!user || !token) {
        setError('Você precisa estar autenticado para realizar o pagamento. Redirecionando...');
        setTimeout(() => router.push('/checkout'), 2000);
        return;
      }
    }, 500);

    return () => clearTimeout(checkDependencies);
  }, [saleIdFromUrl, saleId, user, token, router]);

  // Carregar dados do pagamento
  useEffect(() => {
    if (isInitializing) {
      return;
    }

    // Usar o saleId do estado (que pode vir da URL ou sessionStorage)
    const finalSaleId = saleId || (typeof window !== 'undefined' ? sessionStorage.getItem('last-sale-id') : null);
    
    if (!finalSaleId || !user || !token) {
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const loadPayment = async (attemptNumber = 1) => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setError('');
      
      // Timeout de segurança - se demorar mais de 30 segundos, mostrar erro
      timeoutId = setTimeout(() => {
        if (isMounted) {
          setError('O carregamento está demorando mais que o esperado. Tente novamente.');
          setIsLoading(false);
        }
      }, 30000);
      
      try {
        const data = await customerAPI.createPixPayment(finalSaleId, {
          name: user.name,
          email: user.email,
          phone: user.phone,
          cpf: user.cpf,
        });
        
        if (!isMounted) return;
        
        clearTimeout(timeoutId);
        setPaymentData(data);
        setRetryCount(0); // Reset retry count on success
        
        // Calcular tempo restante
        if (data.expiresAt) {
          const expiresAt = new Date(data.expiresAt).getTime();
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeLeft(remaining);
        }
      } catch (err: any) {
        if (!isMounted) return;
        
        clearTimeout(timeoutId);
        console.error(`Erro ao carregar pagamento (tentativa ${attemptNumber}):`, err);
        
        // Extrair mensagem de erro mais detalhada
        let errorMessage = 'Erro ao gerar QR code PIX';
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        // Tentar novamente se for erro de rede/404 e ainda não excedeu o limite de tentativas
        // 404 pode acontecer se a venda ainda não estiver disponível no backend
        const isNetworkError = !err.response || err.response?.status >= 500;
        const isNotFound = err.response?.status === 404;
        const maxRetries = 5;
        
        if ((isNetworkError || isNotFound) && attemptNumber < maxRetries) {
          // Delay crescente: 1s, 2s, 3s, 4s, 5s
          const waitTime = attemptNumber * 1000;
          console.log(`Venda pode ainda não estar disponível. Tentando novamente em ${waitTime}ms... (tentativa ${attemptNumber + 1}/${maxRetries})`);
          setRetryCount(attemptNumber);
          
          setTimeout(() => {
            if (isMounted) {
              loadPayment(attemptNumber + 1);
            }
          }, waitTime);
          
          return; // Não definir erro ainda
        }
        
        setError(errorMessage);
        setRetryCount(0);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Aguardar um tempo antes de tentar criar o pagamento
    // Isso dá tempo para a venda estar completamente disponível no backend
    // Delay maior na primeira tentativa para dar mais tempo
    const initialDelay = 1500; // 1.5 segundos
    const timer = setTimeout(() => {
      if (isMounted) {
        loadPayment();
      }
    }, initialDelay);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearTimeout(timeoutId);
    };
  }, [saleId, user, token, isInitializing]);

  // Atualizar contador de tempo
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPaymentStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (!saleId || paymentStatus === 'PAID' || paymentStatus === 'EXPIRED') return;

    const checkInterval = setInterval(async () => {
      setIsCheckingPayment(true);
      try {
        const status = await customerAPI.checkPixPaymentStatus(saleId);
        setPaymentStatus(status.status || 'PENDING');
        
        if (status.status === 'PAID') {
          // Redirecionar para página de sucesso após 2 segundos
          setTimeout(() => {
            router.push(`/customer/orders/${saleId}`);
          }, 2000);
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      } finally {
        setIsCheckingPayment(false);
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(checkInterval);
  }, [saleId, paymentStatus, router]);

  const handleCopyCode = async () => {
    const code = paymentData?.qrCode 
      || paymentData?.providerResponse?.pix?.brCode 
      || paymentData?.providerResponse?.brCode 
      || paymentData?.code
      || fallbackPixCode;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar código:', err);
    }
  };

  const handleRefresh = async () => {
    if (!saleId) return;
    
    setIsCreatingPayment(true);
    setError('');
    setSimulationMessage('');
    setSimulationError('');
    try {
      const data = await customerAPI.createPixPayment(saleId, {
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        cpf: user?.cpf,
      });
      setPaymentData(data);
      
      if (data.expiresAt) {
        const expiresAt = new Date(data.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeft(remaining);
      }
      
      setPaymentStatus('PENDING');
    } catch (err: any) {
      console.error('Erro ao recriar pagamento:', err);
      setError(err.response?.data?.message || 'Erro ao gerar QR code PIX');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!saleId) return;

    setSimulationMessage('');
    setSimulationError('');
    setIsSimulatingPayment(true);

    try {
      const result = await customerAPI.simulatePixPayment(saleId);
      const status = result?.status?.toUpperCase?.() || 'PAID';

      if (status === 'PAID') {
        setPaymentStatus('PAID');
        setSimulationMessage('Pagamento simulado com sucesso. Redirecionando...');
        setTimeout(() => {
          router.push(`/customer/orders/${saleId}`);
        }, 1500);
      } else {
        setSimulationMessage(`Simulação concluída com status: ${status}.`);
      }
    } catch (err: any) {
      console.error('Erro ao simular pagamento:', err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Erro ao simular pagamento PIX';
      setSimulationError(message);
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(secs).padStart(2, '0')}`;
  };

  if (isInitializing || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#3e2626] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">
                {isInitializing 
                  ? 'Carregando informações...' 
                  : retryCount > 0 
                    ? `Verificando venda e gerando QR code PIX... (tentativa ${retryCount + 1}/5)`
                    : 'Aguardando venda estar disponível...'}
              </p>
              {retryCount > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Isso pode levar alguns segundos. Por favor, aguarde...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>Erro ao gerar pagamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex gap-4">
                <Button onClick={handleRefresh} disabled={isCreatingPayment}>
                  {isCreatingPayment ? (
                    <>
                      <Loader size={16} className="mr-2" />
                      Tentando novamente...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar novamente
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => router.push('/checkout')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
              <ArrowLeft className="h-4 w-4 inline mr-1" />
              Voltar para a página de pedidos
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Painel Esquerdo - QR Code e Código PIX */}
          <Card className="shadow-xl border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5" />
                  <span>Total</span>
                </CardTitle>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    R$ {paymentData?.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Timer */}
              {timeLeft > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-red-600" />
                      <span className="text-sm text-gray-700">Por favor, conclua o pagamento dentro de</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {formatTime(timeLeft).split(' : ').map((part, idx) => (
                        <div key={idx} className="bg-red-600 text-white px-3 py-1 rounded font-mono font-bold text-lg">
                          {part}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Instruções */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#3e2626]">
                  Existem duas formas de pagar com Pix
                </h3>

                {/* Opção 1: QR Code */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    1. Digitalize o QR Code com seu aplicativo bancário:
                  </p>
                  {(paymentData?.qrCode 
                    || paymentData?.providerResponse?.pix?.brCode 
                    || paymentData?.providerResponse?.brCode 
                    || paymentData?.code 
                    || fallbackPixCode) && (
                    <div className="flex justify-center p-4 bg-white border-2 border-gray-200 rounded-lg">
                      <QRCodeSVG
                        value={paymentData?.qrCode 
                          || paymentData?.providerResponse?.pix?.brCode 
                          || paymentData?.providerResponse?.brCode 
                          || paymentData?.code 
                          || fallbackPixCode}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  )}
                </div>

                {/* Separador */}
                <div className="flex items-center space-x-2 my-4">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-sm text-gray-500">ou</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Opção 2: Código PIX */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    2. Copie e cole o código Pix no seu aplicativo do banco:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={paymentData?.qrCode 
                        || paymentData?.providerResponse?.pix?.brCode 
                        || paymentData?.providerResponse?.brCode 
                        || paymentData?.code 
                        || fallbackPixCode}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-mono bg-gray-50"
                    />
                    <Button
                      onClick={handleCopyCode}
                      className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] px-6"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar código
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Botão de atualizar */}
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isCreatingPayment || isCheckingPayment}
                    className="w-full"
                  >
                    {isCreatingPayment ? (
                      <>
                        <Loader size={16} className="mr-2" />
                        Atualizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Já pagou? Atualizar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Painel Direito - Instruções */}
          <Card className="shadow-xl border-2 border-gray-200">
            <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white rounded-t-lg">
              <CardTitle>Com o PIX, o fluxo de pagamento é o seguinte:</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#3e2626] text-white rounded-full flex items-center justify-center font-bold shrink-0">
                    1
                  </div>
                  <p className="text-gray-700 pt-1">Abra o aplicativo de seu banco</p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#3e2626] text-white rounded-full flex items-center justify-center font-bold shrink-0">
                    2
                  </div>
                  <p className="text-gray-700 pt-1">
                    Leia o código QR ou copie o ID com o botão "Copiar código"
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#3e2626] text-white rounded-full flex items-center justify-center font-bold shrink-0">
                    3
                  </div>
                  <p className="text-gray-700 pt-1">Confirme seu pagamento</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Se você não pagou com Pix, você pode{' '}
                  <button
                    onClick={() => router.push('/checkout')}
                    className="text-[#3e2626] hover:underline font-medium"
                  >
                    alterar sua forma de pagamento
                  </button>{' '}
                  para usar outra forma de pagamento para finalizar o pagamento.
                </p>
              </div>

              {/* Status do pagamento */}
              {isCheckingPayment && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Loader size={16} />
                    <span>Verificando pagamento...</span>
                  </div>
                </div>
              )}

              {paymentStatus === 'PAID' && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Pagamento confirmado! Redirecionando...</span>
                    </div>
                  </div>
                </div>
              )}

              {paymentStatus === 'EXPIRED' && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-semibold">QR Code expirado. Clique em "Já pagou? Atualizar" para gerar um novo.</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {!isProductionEnv && paymentData && (
          <div className="max-w-6xl mx-auto mt-6">
            <Card className="border border-blue-200 bg-blue-50">
              <CardContent className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-blue-900 font-semibold">
                    Ambiente de desenvolvimento
                  </p>
                  <p className="text-sm text-blue-800">
                    Use o botão abaixo para simular a confirmação do pagamento diretamente pela AbacatePay.
                  </p>
                  {simulationMessage && (
                    <p className="text-sm font-medium text-green-700">{simulationMessage}</p>
                  )}
                  {simulationError && (
                    <p className="text-sm font-medium text-red-700">{simulationError}</p>
                  )}
                </div>
                <Button
                  onClick={handleSimulatePayment}
                  disabled={isSimulatingPayment || paymentStatus === 'PAID'}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSimulatingPayment ? (
                    <>
                      <Loader size={16} className="mr-2" />
                      Simulando pagamento...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Simular pagamento PIX
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

