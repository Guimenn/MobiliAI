'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { Loader } from '@/components/ui/ai/loader';
import { customerAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
interface StripeCardFormProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  amount: number;
  saleId?: string | null;
}

export default function StripeCardForm({
  clientSecret,
  onSuccess,
  onError,
  amount,
  saleId,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'boleto'>('card');
  const [isSimulatingBoleto, setIsSimulatingBoleto] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState<string>('');
  const [simulationError, setSimulationError] = useState<string>('');
  const paymentElementRef = useRef<any>(null);
  const tabsListenerAdded = useRef<boolean>(false);

  useEffect(() => {
    if (!elements) return;
    
    setIsReady(true);
    
    // Função para adicionar listeners nas abas
    const addTabListeners = () => {
      if (tabsListenerAdded.current) return;
      
      const tabs = document.querySelectorAll('[role="tab"]');
      if (tabs.length > 0) {
        tabsListenerAdded.current = true;
        tabs.forEach((tab) => {
          const handleTabClick = () => {
            setTimeout(() => {
              const activeTab = document.querySelector('[role="tab"][aria-selected="true"]');
              if (activeTab) {
                const tabText = activeTab.textContent?.toLowerCase() || '';
                console.log('Tab clicked, text:', tabText);
                if (tabText.includes('boleto')) {
                  setSelectedPaymentMethod('boleto');
                } else if (tabText.includes('cartão') || tabText.includes('card')) {
                  setSelectedPaymentMethod('card');
                }
              }
            }, 100);
          };
          tab.addEventListener('click', handleTabClick);
        });
      }
    };
    
    // Aguardar o PaymentElement estar pronto
    const checkPaymentElement = () => {
      const paymentElement = elements.getElement('payment');
      if (paymentElement && !paymentElementRef.current) {
        paymentElementRef.current = paymentElement;
        
        const handleChange = (event: any) => {
          console.log('PaymentElement change event:', event);
          const paymentMethodType = event.value?.type;
          console.log('Payment method type:', paymentMethodType);
          
          if (paymentMethodType === 'boleto') {
            console.log('Setting payment method to boleto');
            setSelectedPaymentMethod('boleto');
          } else if (paymentMethodType === 'card') {
            console.log('Setting payment method to card');
            setSelectedPaymentMethod('card');
          }
        };
        
        // Escutar mudanças
        paymentElement.on('change', handleChange);
        
        // Verificar valor inicial após um pequeno delay
        setTimeout(() => {
          try {
            const value = paymentElement.getValue();
            console.log('PaymentElement initial value:', value);
            if (value?.type === 'boleto') {
              setSelectedPaymentMethod('boleto');
            }
          } catch (err) {
            console.log('Could not get initial value:', err);
          }
        }, 1000);
      }
    };
    
    // Tentar imediatamente
    checkPaymentElement();
    addTabListeners();
    
    // Tentar novamente após um delay
    const timeoutId = setTimeout(() => {
      checkPaymentElement();
      addTabListeners();
    }, 500);
    
    // Também usar MutationObserver para detectar quando o elemento é adicionado ao DOM
    const observer = new MutationObserver(() => {
      checkPaymentElement();
      addTabListeners();
    });
    
    const container = document.getElementById('payment-element-container') || document.body;
    
    if (container) {
      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-selected', 'class'],
      });
    }
    
    // Verificação periódica como fallback
    const intervalId = setInterval(() => {
      const activeTab = document.querySelector('[role="tab"][aria-selected="true"]');
      if (activeTab) {
        const tabText = activeTab.textContent?.toLowerCase() || '';
        if (tabText.includes('boleto')) {
          setSelectedPaymentMethod('boleto');
        } else if (tabText.includes('cartão') || tabText.includes('card')) {
          setSelectedPaymentMethod('card');
        }
      }
    }, 500);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      observer.disconnect();
      tabsListenerAdded.current = false;
      if (paymentElementRef.current) {
        paymentElementRef.current = null;
      }
    };
  }, [elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe não está carregado. Aguarde um momento.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Erro ao processar formulário');
        setIsProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          // Não usar return_url aqui, vamos fazer o redirecionamento manualmente
          // para garantir que o saleId seja passado corretamente
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Erro ao processar pagamento');
        onError(confirmError.message || 'Erro ao processar pagamento');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else {
        setError('Pagamento não foi processado corretamente');
        setIsProcessing(false);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro inesperado ao processar pagamento';
      setError(errorMessage);
      onError(errorMessage);
      setIsProcessing(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader size={24} className="text-[#3e2626]" />
        <span className="ml-2 text-gray-600">Carregando formulário de pagamento...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="border border-gray-200 rounded-lg p-4 bg-white" id="payment-element-container">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-600">Total a pagar</p>
          <p className="text-2xl font-bold text-[#3e2626]">
            R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white hover:from-[#2a1f1f] hover:to-[#3e2626] px-8"
        >
          {isProcessing ? (
            <>
              <Loader size={16} className="mr-2" />
              Processando...
            </>
          ) : selectedPaymentMethod === 'boleto' ? (
            'Pagar com Boleto'
          ) : (
            'Pagar com Cartão'
          )}
        </Button>
      </div>

      {/* Botão de simular pagamento para boleto */}
      {selectedPaymentMethod === 'boleto' && saleId && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 mb-3">
            <strong>Modo de Desenvolvimento:</strong> Use o botão abaixo para simular a confirmação do pagamento do boleto.
          </p>
          {simulationMessage && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              {simulationMessage}
            </div>
          )}
          {simulationError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {simulationError}
            </div>
          )}
          <Button
            type="button"
            onClick={async () => {
              if (!saleId) return;
              
              setSimulationMessage('');
              setSimulationError('');
              setIsSimulatingBoleto(true);

              try {
                const result = await customerAPI.simulateBoletoPayment(saleId);
                const status = result?.status?.toUpperCase?.() || 'SUCCEEDED';

                if (status === 'SUCCEEDED' || result?.success) {
                  setSimulationMessage('Pagamento simulado com sucesso. Redirecionando...');
                  setTimeout(() => {
                    router.push(`/checkout/success?saleId=${saleId}`);
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
                  'Erro ao simular pagamento de boleto';
                setSimulationError(message);
              } finally {
                setIsSimulatingBoleto(false);
              }
            }}
            disabled={isSimulatingBoleto}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSimulatingBoleto ? (
              <>
                <Loader size={16} className="mr-2" />
                Simulando pagamento...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Simular pagamento Boleto
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}

