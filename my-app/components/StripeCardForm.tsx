'use client';

import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { Loader } from '@/components/ui/ai/loader';
interface StripeCardFormProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  amount: number;
}

export default function StripeCardForm({
  clientSecret,
  onSuccess,
  onError,
  amount,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (elements) {
      setIsReady(true);
    }
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

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
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
          ) : (
            'Pagar com Cartão'
          )}
        </Button>
      </div>
    </form>
  );
}

