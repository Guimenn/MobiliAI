'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Truck,
  Shield,
  CheckCircle,
  Edit,
  Info,
  Gift,
  Tag,
  Package,
  AlertCircle,
  Lock,
  Radio
} from 'lucide-react';
import { customerAPI } from '@/lib/api';

interface ShippingAddress {
  name: string;
  phone: string;
  cpf: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface PaymentMethod {
  type: 'pix' | 'credit_card' | 'debit_card' | 'boleto';
  installments?: number;
  cardNumber?: string;
  cardName?: string;
  expiryDate?: string;
  cvv?: string;
}

// Funções de validação
const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // Todos os dígitos iguais
  
  let sum = 0;
  let remainder;
  
  // Validação do primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
};

const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  // Aceita telefone com 10 ou 11 dígitos (com ou sem DDD)
  return cleanPhone.length === 10 || cleanPhone.length === 11;
};

const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers.length > 0 ? `(${numbers}` : numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, user, isAuthenticated, token } = useAppStore();
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Verificar autenticação ao carregar a página
  useEffect(() => {
    // Dar um pequeno delay para o store carregar
    const timer = setTimeout(() => {
      if (!isAuthenticated || !user || !token) {
        router.push('/login?redirect=/checkout&message=Por favor, faça login para finalizar sua compra');
        return;
      }
      setIsCheckingAuth(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, token, router]);
  
  // Produtos selecionados (vem do sessionStorage ou todos do carrinho)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  
  // Estados de erro de validação
  const [phoneError, setPhoneError] = useState('');
  const [cpfError, setCpfError] = useState('');

  // Carregar produtos selecionados do sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('checkout-selected-products');
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          setSelectedProducts(new Set(ids));
          setIsLoadingProducts(false);
          return;
        } catch (e) {
          console.error('Erro ao parsear produtos do sessionStorage:', e);
        }
      }
      
      // Se não houver no sessionStorage ou se falhar, usar todos do carrinho
      if (cart.length > 0) {
        setSelectedProducts(new Set(cart.map(item => item.product.id)));
      }
      setIsLoadingProducts(false);
    }
  }, [cart]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'review'>('address');
  
  // Estado do formulário de endereço
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: user?.name || '',
    phone: user?.phone || '',
    cpf: '',
    address: user?.address || '',
    number: '',
    complement: '',
    neighborhood: '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
  });

  // Estado do método de pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: 'pix',
  });

  // Cupom e descontos
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Opções de entrega
  const [selectedShipping, setSelectedShipping] = useState<'standard' | 'express'>('standard');
  const [shippingInsurance, setShippingInsurance] = useState(true);

  // Produtos selecionados para checkout
  const checkoutItems = useMemo(() => {
    return cart.filter(item => selectedProducts.has(item.product.id));
  }, [cart, selectedProducts]);

  // Cálculos
  const subtotal = useMemo(() => {
    return checkoutItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [checkoutItems]);

  const shippingCost = useMemo(() => {
    if (subtotal >= 500) return 0;
    return selectedShipping === 'express' ? 49.90 : 29.90;
  }, [subtotal, selectedShipping]);

  const insuranceCost = shippingInsurance ? 5.00 : 0;
  const discount = appliedCoupon?.discount || 0;
  const tax = subtotal * 0.1; // 10% de impostos estimados

  const total = subtotal + shippingCost + insuranceCost + tax - discount;

  // Validar se há produtos selecionados (após carregar os produtos)
  useEffect(() => {
    // Só verificar após terminar de carregar os produtos
    if (!isLoadingProducts) {
      // Aguardar um pouco para garantir que os produtos foram carregados
      const timer = setTimeout(() => {
        // Se não houver produtos no carrinho, redirecionar
        if (cart.length === 0) {
          router.push('/cart');
          return;
        }
        
        // Se houver produtos no carrinho mas nenhum selecionado e nenhum no sessionStorage, redirecionar
        if (checkoutItems.length === 0) {
          const stored = sessionStorage.getItem('checkout-selected-products');
          if (!stored || stored === '[]') {
            router.push('/cart');
          }
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [checkoutItems.length, cart.length, isLoadingProducts, router]);

  // Aplicar cupom
  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponCode.trim()) {
      setCouponError('Digite um código de cupom');
      return;
    }

    // Simular validação de cupom
    const validCoupons: { [key: string]: number } = {
      'BEMVINDO10': 10,
      'PRIMEIRA20': 20,
      'FRETE15': 15,
    };

    const upperCode = couponCode.toUpperCase().trim();
    if (validCoupons[upperCode]) {
      const discountAmount = (subtotal * validCoupons[upperCode]) / 100;
      setAppliedCoupon({ code: upperCode, discount: discountAmount });
      setCouponError('');
    } else {
      setCouponError('Cupom inválido ou expirado');
    }
  };

  // Remover cupom
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Validar formulário
  const validateAddress = () => {
    const required = ['name', 'phone', 'cpf', 'address', 'number', 'neighborhood', 'city', 'state', 'zipCode'];
    const missing = required.filter(field => !shippingAddress[field as keyof ShippingAddress]?.trim());
    
    if (missing.length > 0) {
      alert('Por favor, preencha todos os campos obrigatórios do endereço');
      return false;
    }

    // Validar telefone
    if (!validatePhone(shippingAddress.phone)) {
      setPhoneError('Telefone inválido. Use o formato (11) 99999-9999');
      alert('Por favor, digite um telefone válido');
      return false;
    }

    // Validar CPF
    const cpf = shippingAddress.cpf.replace(/\D/g, '');
    if (cpf.length !== 11) {
      setCpfError('CPF inválido. Digite um CPF válido com 11 dígitos');
      alert('Por favor, digite um CPF válido');
      return false;
    }

    if (!validateCPF(shippingAddress.cpf)) {
      setCpfError('CPF inválido. Verifique os dígitos');
      alert('CPF inválido. Verifique os dígitos');
      return false;
    }

    return true;
  };

  const validatePayment = () => {
    if (paymentMethod.type === 'credit_card') {
      if (!paymentMethod.cardNumber || !paymentMethod.cardName || !paymentMethod.expiryDate || !paymentMethod.cvv) {
        alert('Por favor, preencha todos os dados do cartão de crédito');
        return false;
      }
    }
    return true;
  };

  // Finalizar pedido
  const handleFinalizeOrder = async () => {
    if (!validateAddress() || !validatePayment()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Agrupar por loja (assumindo que todos os produtos são da mesma loja ou primeiro)
      const storeId = checkoutItems[0]?.product.storeId || 'default';
      
      // Criar a venda no backend (usuário já está autenticado neste ponto)
      const saleResponse = await customerAPI.checkout({
        storeId,
        shippingAddress: `${shippingAddress.address}, ${shippingAddress.number}${shippingAddress.complement ? ` - ${shippingAddress.complement}` : ''}`,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state,
        shippingZipCode: shippingAddress.zipCode,
        shippingPhone: shippingAddress.phone,
        notes: `Pedido via checkout web. Frete: ${selectedShipping === 'express' ? 'Expresso' : 'Padrão'}. ${shippingInsurance ? 'Com seguro de envio' : 'Sem seguro'}.${appliedCoupon ? ` Cupom aplicado: ${appliedCoupon.code}` : ''}`,
      });

      // Redirecionar para página de confirmação
      router.push(`/checkout/success?orderId=${saleResponse.id || saleResponse.saleNumber || 'pending'}`);
    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      alert(error.response?.data?.message || 'Erro ao processar pedido. Tente novamente.');
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Mudar etapa
  const handleNextStep = () => {
    if (currentStep === 'address') {
      if (validateAddress()) {
        setCurrentStep('payment');
      }
    } else if (currentStep === 'payment') {
      if (validatePayment()) {
        setCurrentStep('review');
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'payment') {
      setCurrentStep('address');
    } else if (currentStep === 'review') {
      setCurrentStep('payment');
    }
  };

  // Mostrar loading enquanto verifica autenticação ou carrega os produtos
  if (isCheckingAuth || isLoadingProducts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#3e2626] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando checkout...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Se não estiver autenticado, não renderizar nada (o useEffect vai redirecionar)
  if (!isAuthenticated || !user || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button onClick={() => router.push('/cart')} className="hover:text-[#3e2626]">
              Carrinho
            </button>
            <span>/</span>
            <span className="text-[#3e2626] font-semibold">Checkout</span>
            {currentStep === 'payment' && <span>/</span>}
            {currentStep === 'payment' && <span>Pagamento</span>}
            {currentStep === 'review' && <span>/</span>}
            {currentStep === 'review' && <span>Revisão</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Endereço de Entrega */}
            {currentStep === 'address' && (
              <Card className="shadow-xl border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Endereço de Entrega</span>
                    </CardTitle>
                    <Badge className="bg-white text-[#3e2626]">1 de 3</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                    <div className="flex items-start space-x-2">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">Importante para entrega</p>
                        <p>Para assegurar a entrada de seu pedido, confirme a validade e regularidade do CPF registrado na plataforma e certifique-se de que o nome do destinatário informado é igual ao do CPF, sem abreviações. Seu endereço deve estar completo.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                        placeholder="Digite seu nome completo"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={shippingAddress.phone}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          setShippingAddress({ ...shippingAddress, phone: formatted });
                          setPhoneError('');
                          
                          // Validar ao perder o foco ou quando tiver 14 ou 15 caracteres (com formatação)
                          if (formatted.replace(/\D/g, '').length >= 10) {
                            if (!validatePhone(formatted)) {
                              setPhoneError('Telefone inválido. Use o formato (11) 99999-9999');
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const phone = e.target.value;
                          if (phone && phone.replace(/\D/g, '').length >= 10) {
                            if (!validatePhone(phone)) {
                              setPhoneError('Telefone inválido. Use o formato (11) 99999-9999');
                            } else {
                              setPhoneError('');
                            }
                          }
                        }}
                        placeholder="(11) 99999-9999"
                        className={`mt-1 ${phoneError ? 'border-red-500' : ''}`}
                        maxLength={15}
                      />
                      {phoneError && (
                        <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        value={shippingAddress.cpf}
                        onChange={(e) => {
                          const formatted = formatCPF(e.target.value);
                          setShippingAddress({ ...shippingAddress, cpf: formatted });
                          setCpfError('');
                          
                          // Validar quando tiver 14 caracteres (com formatação)
                          if (formatted.replace(/\D/g, '').length === 11) {
                            if (!validateCPF(formatted)) {
                              setCpfError('CPF inválido. Verifique os dígitos');
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const cpf = e.target.value;
                          if (cpf && cpf.replace(/\D/g, '').length === 11) {
                            if (!validateCPF(cpf)) {
                              setCpfError('CPF inválido. Verifique os dígitos');
                            } else {
                              setCpfError('');
                            }
                          }
                        }}
                        placeholder="000.000.000-00"
                        className={`mt-1 ${cpfError ? 'border-red-500' : ''}`}
                        maxLength={14}
                      />
                      {cpfError && (
                        <p className="text-sm text-red-600 mt-1">{cpfError}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="address">Endereço *</Label>
                      <Input
                        id="address"
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                        placeholder="Rua, Avenida, etc."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        value={shippingAddress.number}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, number: e.target.value })}
                        placeholder="123"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={shippingAddress.complement}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, complement: e.target.value })}
                        placeholder="Apto, Bloco, etc."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        value={shippingAddress.neighborhood}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, neighborhood: e.target.value })}
                        placeholder="Centro"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        placeholder="São Paulo"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        placeholder="SP"
                        className="mt-1"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="zipCode">CEP *</Label>
                      <Input
                        id="zipCode"
                        value={shippingAddress.zipCode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                        placeholder="00000-000"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleNextStep}
                      className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white hover:from-[#2a1f1f] hover:to-[#3e2626] px-8"
                    >
                      Continuar para Pagamento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Método de Pagamento */}
            {currentStep === 'payment' && (
              <Card className="shadow-xl border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Método de Pagamento</span>
                    </CardTitle>
                    <Badge className="bg-white text-[#3e2626]">2 de 3</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Opções de Pagamento */}
                  <div className="space-y-3">
                    {/* PIX */}
                    <div
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        paymentMethod.type === 'pix'
                          ? 'border-[#3e2626] bg-[#3e2626]/5'
                          : 'border-gray-200 hover:border-[#3e2626]/50'
                      }`}
                      onClick={() => setPaymentMethod({ type: 'pix' })}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod.type === 'pix' ? 'border-[#3e2626] bg-[#3e2626]' : 'border-gray-300'
                        }`}>
                          {paymentMethod.type === 'pix' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-[#3e2626]">PIX</span>
                            <Badge className="bg-green-500 text-white text-xs">Instantâneo</Badge>
                          </div>
                          <p className="text-sm text-gray-600">Pagamento instantâneo via PIX</p>
                        </div>
                      </div>
                    </div>

                    {/* Cartão de Crédito */}
                    <div
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        paymentMethod.type === 'credit_card'
                          ? 'border-[#3e2626] bg-[#3e2626]/5'
                          : 'border-gray-200 hover:border-[#3e2626]/50'
                      }`}
                      onClick={() => setPaymentMethod({ type: 'credit_card', installments: 1 })}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod.type === 'credit_card' ? 'border-[#3e2626] bg-[#3e2626]' : 'border-gray-300'
                        }`}>
                          {paymentMethod.type === 'credit_card' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-[#3e2626]">Cartão de Crédito</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">VISA</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">MASTERCARD</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">ELO</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">Parcelamento em até 12x sem juros</p>
                        </div>
                      </div>
                    </div>

                    {paymentMethod.type === 'credit_card' && (
                      <div className="ml-8 mt-4 p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-200">
                        <div>
                          <Label htmlFor="cardNumber">Número do Cartão *</Label>
                          <Input
                            id="cardNumber"
                            value={paymentMethod.cardNumber || ''}
                            onChange={(e) => setPaymentMethod({ ...paymentMethod, cardNumber: e.target.value })}
                            placeholder="0000 0000 0000 0000"
                            className="mt-1"
                            maxLength={19}
                          />
                        </div>

                        <div>
                          <Label htmlFor="cardName">Nome no Cartão *</Label>
                          <Input
                            id="cardName"
                            value={paymentMethod.cardName || ''}
                            onChange={(e) => setPaymentMethod({ ...paymentMethod, cardName: e.target.value })}
                            placeholder="NOME COMO NO CARTÃO"
                            className="mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiryDate">Validade *</Label>
                            <Input
                              id="expiryDate"
                              value={paymentMethod.expiryDate || ''}
                              onChange={(e) => setPaymentMethod({ ...paymentMethod, expiryDate: e.target.value })}
                              placeholder="MM/AA"
                              className="mt-1"
                              maxLength={5}
                            />
                          </div>

                          <div>
                            <Label htmlFor="cvv">CVV *</Label>
                            <Input
                              id="cvv"
                              type="password"
                              value={paymentMethod.cvv || ''}
                              onChange={(e) => setPaymentMethod({ ...paymentMethod, cvv: e.target.value })}
                              placeholder="000"
                              className="mt-1"
                              maxLength={4}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="installments">Parcelas</Label>
                          <select
                            id="installments"
                            value={paymentMethod.installments || 1}
                            onChange={(e) => setPaymentMethod({ ...paymentMethod, installments: parseInt(e.target.value) })}
                            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                              <option key={num} value={num}>
                                {num}x de R$ {(total / num).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Cartão de Débito */}
                    <div
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        paymentMethod.type === 'debit_card'
                          ? 'border-[#3e2626] bg-[#3e2626]/5'
                          : 'border-gray-200 hover:border-[#3e2626]/50'
                      }`}
                      onClick={() => setPaymentMethod({ type: 'debit_card' })}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod.type === 'debit_card' ? 'border-[#3e2626] bg-[#3e2626]' : 'border-gray-300'
                        }`}>
                          {paymentMethod.type === 'debit_card' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-[#3e2626]">Cartão de Débito</span>
                          <p className="text-sm text-gray-600">Débito online</p>
                        </div>
                      </div>
                    </div>

                    {/* Boleto */}
                    <div
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        paymentMethod.type === 'boleto'
                          ? 'border-[#3e2626] bg-[#3e2626]/5'
                          : 'border-gray-200 hover:border-[#3e2626]/50'
                      }`}
                      onClick={() => setPaymentMethod({ type: 'boleto' })}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod.type === 'boleto' ? 'border-[#3e2626] bg-[#3e2626]' : 'border-gray-300'
                        }`}>
                          {paymentMethod.type === 'boleto' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-[#3e2626]">Boleto Bancário</span>
                          <p className="text-sm text-gray-600">Vencimento em 3 dias úteis</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Opções de Entrega */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-lg text-[#3e2626] mb-4">Opções de Entrega</h3>
                    
                    <div className="space-y-3">
                      <div
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedShipping === 'standard'
                            ? 'border-[#3e2626] bg-[#3e2626]/5'
                            : 'border-gray-200 hover:border-[#3e2626]/50'
                        }`}
                        onClick={() => setSelectedShipping('standard')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedShipping === 'standard' ? 'border-[#3e2626] bg-[#3e2626]' : 'border-gray-300'
                            }`}>
                              {selectedShipping === 'standard' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                            </div>
                            <div>
                              <div className="font-semibold text-[#3e2626]">Entrega Padrão</div>
                              <div className="text-sm text-gray-600">
                                {shippingCost === 0 ? (
                                  <span className="text-green-600 font-semibold">Grátis</span>
                                ) : (
                                  `R$ ${shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Entrega em 7-10 dias úteis</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedShipping === 'express'
                            ? 'border-[#3e2626] bg-[#3e2626]/5'
                            : 'border-gray-200 hover:border-[#3e2626]/50'
                        }`}
                        onClick={() => setSelectedShipping('express')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedShipping === 'express' ? 'border-[#3e2626] bg-[#3e2626]' : 'border-gray-300'
                            }`}>
                              {selectedShipping === 'express' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                            </div>
                            <div>
                              <div className="font-semibold text-[#3e2626]">Entrega Expressa</div>
                              <div className="text-sm text-gray-600">
                                R$ {shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Entrega em 2-3 dias úteis</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox
                        id="insurance"
                        checked={shippingInsurance}
                        onChange={(e) => setShippingInsurance(e.target.checked)}
                      />
                      <Label htmlFor="insurance" className="cursor-pointer">
                        <span className="font-semibold">Seguro de envio</span>
                        <span className="text-gray-600 ml-2">(R$ 5,00) - Reenvio gratuito se o item for perdido ou danificado</span>
                      </Label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="border-2 border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white hover:from-[#2a1f1f] hover:to-[#3e2626] px-8"
                    >
                      Revisar Pedido
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Revisão do Pedido */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                <Card className="shadow-xl border-2 border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Package className="h-5 w-5" />
                        <span>Revisão do Pedido</span>
                      </CardTitle>
                      <Badge className="bg-white text-[#3e2626]">3 de 3</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Itens do Pedido */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg text-[#3e2626]">Itens do Pedido</h3>
                      {checkoutItems.map((item) => (
                        <div key={item.product.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {item.product.imageUrl ? (
                              <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3e2626] to-[#5a3a3a]">
                                <Package className="h-8 w-8 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#3e2626]">{item.product.name}</h4>
                            <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                            <p className="text-lg font-bold text-[#3e2626] mt-1">
                              R$ {(item.product.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Endereço de Entrega */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg text-[#3e2626]">Endereço de Entrega</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentStep('address')}
                          className="text-[#3e2626] hover:text-[#5a3a3a]"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-semibold">{shippingAddress.name}</p>
                        <p className="text-sm text-gray-600">
                          {shippingAddress.address}, {shippingAddress.number}
                          {shippingAddress.complement && ` - ${shippingAddress.complement}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {shippingAddress.neighborhood}, {shippingAddress.city} - {shippingAddress.state}
                        </p>
                        <p className="text-sm text-gray-600">CEP: {shippingAddress.zipCode}</p>
                        <p className="text-sm text-gray-600">Telefone: {shippingAddress.phone}</p>
                      </div>
                    </div>

                    {/* Método de Pagamento */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg text-[#3e2626]">Método de Pagamento</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentStep('payment')}
                          className="text-[#3e2626] hover:text-[#5a3a3a]"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-semibold text-[#3e2626] capitalize">
                          {paymentMethod.type === 'pix' && 'PIX'}
                          {paymentMethod.type === 'credit_card' && `Cartão de Crédito${paymentMethod.installments ? ` - ${paymentMethod.installments}x` : ''}`}
                          {paymentMethod.type === 'debit_card' && 'Cartão de Débito'}
                          {paymentMethod.type === 'boleto' && 'Boleto Bancário'}
                        </p>
                        {paymentMethod.type === 'credit_card' && paymentMethod.cardNumber && (
                          <p className="text-sm text-gray-600 mt-1">
                            •••• •••• •••• {paymentMethod.cardNumber.slice(-4)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Coluna Lateral - Resumo */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-24 shadow-xl border-2 border-gray-200">
              <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Resumo do Pedido</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Itens */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({checkoutItems.length} {checkoutItems.length === 1 ? 'item' : 'itens'})</span>
                    <span className="font-semibold">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frete</span>
                    <span className="font-semibold">
                      {shippingCost === 0 ? (
                        <span className="text-green-600 flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Grátis</span>
                        </span>
                      ) : (
                        `R$ ${shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      )}
                    </span>
                  </div>

                  {insuranceCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Seguro de envio</span>
                      <span className="font-semibold">R$ {insuranceCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Impostos inclusos</span>
                    <span className="font-semibold">R$ {tax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto ({appliedCoupon.code})</span>
                      <span className="font-semibold">- R$ {appliedCoupon.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>

                {/* Cupom */}
                {!appliedCoupon && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Código do cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        variant="outline"
                        className="border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white"
                      >
                        Aplicar
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-600 mt-2 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{couponError}</span>
                      </p>
                    )}
                  </div>
                )}

                {appliedCoupon && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">Cupom aplicado: {appliedCoupon.code}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="text-red-600 hover:text-red-700 h-6 px-2"
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="pt-4 border-t-2 border-[#3e2626]">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-[#3e2626]">Total</span>
                    <span className="text-2xl font-bold text-[#3e2626]">
                      R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Botão Finalizar */}
                {currentStep === 'review' && (
                  <Button
                    onClick={handleFinalizeOrder}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white hover:from-[#2a1f1f] hover:to-[#3e2626] py-6 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5 mr-2" />
                        Finalizar Pedido
                      </>
                    )}
                  </Button>
                )}

                {/* Segurança */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Seus dados estão protegidos e criptografados</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

