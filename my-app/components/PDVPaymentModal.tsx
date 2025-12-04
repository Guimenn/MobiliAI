'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';
import { customerAPI, salesAPI } from '@/lib/api';
import { showAlert } from '@/lib/alerts';
import {
  QrCode,
  Copy,
  CheckCircle,
  RefreshCw,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  Radio,
} from 'lucide-react';
import { env } from '@/lib/env';
import { mqttAPI } from '@/lib/mqtt-api';
import { Loader } from '@/components/ui/ai/loader';
const stripePromise = loadStripe(env.STRIPE_PUBLISHABLE_KEY);

interface PDVPaymentModalProps {
  open: boolean;
  onClose: () => void;
  saleId: string;
  amount: number;
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD';
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
  };
  onPaymentSuccess: () => void;
}

export default function PDVPaymentModal({
  open,
  onClose,
  saleId,
  amount,
  paymentMethod,
  customerInfo,
  onPaymentSuccess,
}: PDVPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'EXPIRED'>('PENDING');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [waitingForRFID, setWaitingForRFID] = useState(false);
  const [rfidRead, setRfidRead] = useState(false);
  const [rfidTag, setRfidTag] = useState<string | null>(null);
  const [mqttConnected, setMqttConnected] = useState(false);

  useEffect(() => {
    if (open && saleId) {
      if (paymentMethod === 'PIX') {
        createPixPayment();
      } else if (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') {
        // Limpar tag RFID antes de começar a aguardar nova leitura
        mqttAPI.clearLastRfid().catch(err => {
          console.warn('Erro ao limpar tag RFID (não crítico):', err);
        });
        // Delay maior para garantir que a limpeza foi processada e não pegue tags antigas
        setTimeout(() => {
          handleCardPaymentWithRFID();
        }, 500);
      }
    } else {
      setPaymentData(null);
      setPaymentStatus('PENDING');
      setError('');
      setTimeLeft(0);
      setWaitingForRFID(false);
      setRfidRead(false);
      setRfidTag(null);
    }
  }, [open, saleId, paymentMethod]);

  useEffect(() => {
    if (!open || paymentMethod !== 'PIX' || paymentStatus === 'PAID' || paymentStatus === 'EXPIRED') {
      return;
    }

    const checkInterval = setInterval(async () => {
      setIsCheckingPayment(true);
      try {
        const status = await customerAPI.checkPixPaymentStatus(saleId);
        const newStatus = (status.status || 'PENDING').toUpperCase() as 'PENDING' | 'PAID' | 'EXPIRED';
        setPaymentStatus(newStatus);
        
        if (newStatus === 'PAID') {
          try {
            await salesAPI.update(saleId, {
              status: 'completed' as any,
            });
          } catch (error) {
            console.error('Erro ao atualizar status da venda:', error);
          }
          
          showAlert('success', 'Pagamento PIX confirmado!');
          setTimeout(() => {
            onPaymentSuccess();
            onClose();
          }, 1500);
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      } finally {
        setIsCheckingPayment(false);
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  }, [open, saleId, paymentMethod, paymentStatus, onPaymentSuccess, onClose]);

  useEffect(() => {
    if (timeLeft <= 0 || paymentMethod !== 'PIX') return;

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
  }, [timeLeft, paymentMethod]);

  const createPixPayment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await customerAPI.createPixPayment(saleId, customerInfo);
      setPaymentData(data);
      
      if (data.expiresAt) {
        const expiresAt = new Date(data.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeft(remaining);
      }
    } catch (err: any) {
      console.error('Erro ao criar pagamento PIX:', err);
      const errorMessage = err.response?.data?.message || 'Erro ao gerar QR code PIX';
      setError(errorMessage);
      showAlert('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardPaymentWithRFID = async () => {
    setError('');
    setWaitingForRFID(true);
    setRfidRead(false);
    setRfidTag(null);

    try {
      console.log('Iniciando processo de pagamento com RFID...');
      
      // Verificar status da conexão MQTT
      try {
        const status = await mqttAPI.getStatus();
        setMqttConnected(status.connected);
        
        if (!status.connected) {
          throw new Error('Serviço MQTT não está conectado. Verifique se o backend está rodando e conectado ao broker.');
        }
      } catch (statusError: any) {
        console.error('Erro ao verificar status MQTT:', statusError);
        throw new Error('Não foi possível verificar a conexão com o leitor RFID.');
      }

      showAlert('info', 'Aproxime o cartão do leitor RFID...');
      
      // Aguardar leitura do RFID via API REST (timeout de 30 segundos no backend)
      const result = await mqttAPI.waitForRfid();
      console.log('RFID lido:', result.tag);
      
      setRfidTag(result.tag);
      setRfidRead(true);
      setWaitingForRFID(false);
      
      showAlert('success', 'Cartão identificado! Finalizando venda...');
      
      // Após ler o RFID, finalizar a venda diretamente (sem Stripe)
      try {
        // Atualizar status da venda para COMPLETED
        await salesAPI.update(saleId, {
          status: 'completed' as any,
          paymentReference: result.tag, // Salvar a tag RFID como referência
        });
        
        showAlert('success', 'Venda finalizada com sucesso!');
        
        // Limpar a tag RFID do backend para forçar nova leitura na próxima venda
        try {
          await mqttAPI.clearLastRfid();
          console.log('Tag RFID limpa após finalizar venda');
        } catch (clearError) {
          console.warn('Erro ao limpar tag RFID (não crítico):', clearError);
        }
        
        // Fechar modal e chamar callback de sucesso
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 1500);
      } catch (updateError: any) {
        console.error('Erro ao finalizar venda:', updateError);
        throw new Error('Erro ao finalizar venda. Tente novamente.');
      }
      
    } catch (err: any) {
      console.error('Erro ao aguardar RFID:', err);
      setWaitingForRFID(false);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao ler cartão RFID';
      setError(errorMessage);
      showAlert('error', errorMessage);
    }
  };

  const handleCopyCode = async () => {
    const code = paymentData?.qrCode 
      || paymentData?.providerResponse?.pix?.brCode 
      || paymentData?.providerResponse?.brCode 
      || paymentData?.code;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar código:', err);
    }
  };

  const handleRefreshPix = async () => {
    await createPixPayment();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(secs).padStart(2, '0')}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {paymentMethod === 'PIX' ? (
              <>
                <QrCode className="h-5 w-5" />
                Pagamento PIX
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Pagamento com Cartão
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Total: {formatCurrency(amount)}
          </DialogDescription>
        </DialogHeader>

        {paymentMethod === 'PIX' ? (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader size={32} className="text-[#3e2626] mb-4" />
                <p className="text-gray-600">Gerando QR code PIX...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
                <Button
                  onClick={handleRefreshPix}
                  className="mt-4 w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              </div>
            ) : paymentData ? (
              <>
                {timeLeft > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-red-600" />
                        <span className="text-sm text-gray-700">Tempo restante:</span>
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

                {paymentData.qrCode && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                      <QRCodeSVG
                        value={paymentData.qrCode}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Copie o código PIX:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={paymentData.qrCode || ''}
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={handleCopyCode}
                      className="bg-[#3e2626] hover:bg-[#2a1f1f] text-white"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {isCheckingPayment && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Loader size={16} />
                    <span>Verificando pagamento...</span>
                  </div>
                )}

                {paymentStatus === 'PAID' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Pagamento confirmado!</span>
                    </div>
                  </div>
                )}

                {paymentStatus === 'EXPIRED' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-semibold">QR Code expirado. Gere um novo código.</span>
                    </div>
                    <Button
                      onClick={handleRefreshPix}
                      className="mt-4 w-full"
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Gerar novo QR Code
                    </Button>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={handleRefreshPix}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
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
              </>
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            {waitingForRFID ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-4">
                  <Radio className="h-16 w-16 animate-pulse text-[#3e2626]" />
                </div>
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {!mqttConnected ? 'Verificando conexão...' : 'Aguardando leitura do cartão...'}
                </p>
                <p className="text-sm text-gray-600 text-center mb-4">
                  {!mqttConnected 
                    ? 'Verificando conexão com o leitor RFID...'
                    : 'Aproxime o cartão do leitor RFID'}
                </p>
                {!mqttConnected ? (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 w-full">
                    <div className="flex items-center space-x-2 text-yellow-800">
                      <Loader className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Verificando conexão com o serviço MQTT...</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 w-full">
                    <div className="flex items-center space-x-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">Conectado! Aguardando leitura do cartão...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : rfidRead && rfidTag ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <span className="font-semibold">Cartão identificado!</span>
                    <p className="text-xs text-green-700 mt-1">Tag: {rfidTag}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
                <Button
                  onClick={handleCardPaymentWithRFID}
                  className="mt-4 w-full"
                  variant="outline"
                >
                  Tentar novamente
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

