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
  Radio,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingCart,
  DollarSign,
  Headphones
} from 'lucide-react';
import { customerAPI, authAPI } from '@/lib/api';
import { env } from '@/lib/env';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  // Produtos selecionados para checkout
  const checkoutItems = useMemo(() => {
    return cart.filter(item => selectedProducts.has(item.product.id));
  }, [cart, selectedProducts]);

  const totalCheckoutQuantity = useMemo(() => {
    return checkoutItems.reduce((sum, it) => sum + (it.quantity || 1), 0);
  }, [checkoutItems]);

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
  
  // Estados para modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado do formulário de endereço
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    phone: '',
    cpf: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Estado temporário para edição no modal
  const [editAddress, setEditAddress] = useState<ShippingAddress>({
    name: '',
    phone: '',
    cpf: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
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

  // Produtos recomendados
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [recommendedProductIndex, setRecommendedProductIndex] = useState(0);
  const [showRecommendedProducts, setShowRecommendedProducts] = useState(true);
  // Quantos produtos devem aparecer ao mesmo tempo no carrossel
  const VISIBLE_RECOMMENDED = 4;

  // Quick View (modal de detalhes do produto)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isLoadingQuickView, setIsLoadingQuickView] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [quickViewImages, setQuickViewImages] = useState<string[]>([]);
  const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);
  const [quickViewQty, setQuickViewQty] = useState(1);

  // Modal: itens da compra (sumário detalhado)
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);

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

  // Função para parsear endereço completo em partes
  const parseAddress = (fullAddress: string) => {
    if (!fullAddress) return { address: '', number: '', complement: '' };
    
    // Padrões comuns de endereço:
    // "Rua Exemplo, 123 - Apto 45"
    // "Rua Exemplo 123"
    // "Rua Exemplo, 123"
    // "Rua Exemplo, 123 - Complemento"
    // "Rua Exemplo (Jd Pitangueiras) 49"
    // "Rua São Gabriel(Jd Pitangueiras) 49"
    
    // Tentar padrão: "Rua (Bairro) Número" - sem espaço antes do parêntese
    let addressMatch = fullAddress.match(/^(.+?)\s*\([^)]+\)\s*(\d+)(?:\s*-\s*(.+))?$/);
    if (addressMatch) {
      return {
        address: addressMatch[1].trim(),
        number: addressMatch[2] || '',
        complement: addressMatch[3] || '',
      };
    }
    
    // Tentar padrão: "Rua, Número - Complemento"
    addressMatch = fullAddress.match(/^(.+?),\s*(\d+)(?:\s*-\s*(.+))?$/);
    if (addressMatch) {
      return {
        address: addressMatch[1].trim(),
        number: addressMatch[2] || '',
        complement: addressMatch[3] || '',
      };
    }
    
    // Tentar padrão: "Rua Número - Complemento" (sem vírgula)
    addressMatch = fullAddress.match(/^(.+?)\s+(\d+)(?:\s*-\s*(.+))?$/);
    if (addressMatch) {
      return {
        address: addressMatch[1].trim(),
        number: addressMatch[2] || '',
        complement: addressMatch[3] || '',
      };
    }
    
    // Tentar padrão: "Rua Número" (sem vírgula, sem complemento)
    addressMatch = fullAddress.match(/^(.+?)\s+(\d+)$/);
    if (addressMatch) {
      return {
        address: addressMatch[1].trim(),
        number: addressMatch[2] || '',
        complement: '',
      };
    }
    
    // Se não encontrar padrão, tentar separar por vírgula
    const parts = fullAddress.split(',');
    if (parts.length >= 2) {
      const numberMatch = parts[1].match(/\d+/)?.[0] || '';
      const rest = parts.slice(1).join(',').replace(numberMatch, '').trim();
      return {
        address: parts[0].trim(),
        number: numberMatch,
        complement: rest.replace(/^-\s*/, '').trim(),
      };
    }
    
    // Se não encontrar nenhum padrão, retornar o endereço completo sem número
    return { address: fullAddress, number: '', complement: '' };
  };

  // Carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      setIsLoadingUserData(true);
      try {
        let profile;
        
        // Tentar carregar do endpoint do customer primeiro (retorna todos os campos)
        try {
          profile = await customerAPI.getProfile();
        } catch (error: any) {
          // Se não for customer ou der erro, tentar auth/profile como fallback
          if (error.response?.status === 403 || error.response?.status === 401) {
            profile = await authAPI.getProfile();
          } else {
            throw error;
          }
        }
        
        // Parsear endereço se necessário
        const parsedAddress = parseAddress(profile.address || '');
        
        // Preencher com dados do perfil do usuário
        // Garantir que valores null/undefined sejam tratados como string vazia
        // Como os dados podem estar null no banco, tentar buscar também do user store
        const phoneValue = profile.phone || user?.phone || '';
        const cpfValue = profile.cpf || '';
        const addressValue = parsedAddress.address || '';
        const numberValue = parsedAddress.number || '';
        
        const newShippingAddress = {
          name: profile.name || '',
          phone: phoneValue ? String(phoneValue) : '',
          cpf: cpfValue ? String(cpfValue) : '',
          address: addressValue,
          number: numberValue,
          complement: parsedAddress.complement || '',
          neighborhood: '',
          city: profile.city || '',
          state: profile.state || '',
          zipCode: profile.zipCode || '',
        };
        
        setShippingAddress(newShippingAddress);
        
        // Se tiver CEP mas não tiver bairro, buscar o CEP para preencher o bairro
        if (profile.zipCode && profile.zipCode.replace(/\D/g, '').length === 8) {
          try {
            const cepData = await fetch(`https://viacep.com.br/ws/${profile.zipCode.replace(/\D/g, '')}/json/`);
            const cepInfo = await cepData.json();
            if (!cepInfo.erro && cepInfo.bairro) {
              setShippingAddress(prev => ({
                ...prev,
                neighborhood: cepInfo.bairro,
                address: prev.address || cepInfo.logradouro || '',
                city: prev.city || cepInfo.localidade || '',
                state: prev.state || cepInfo.uf || '',
              }));
            }
          } catch (error) {
            console.error('Erro ao buscar CEP para preencher bairro:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        // Preencher com dados básicos do user store
        const parsedAddress = parseAddress(user.address || '');
        setShippingAddress({
          name: user.name || '',
          phone: user.phone || '',
          cpf: '',
          address: parsedAddress.address,
          number: parsedAddress.number,
          complement: parsedAddress.complement,
          neighborhood: '',
          city: user.city || '',
          state: user.state || '',
          zipCode: user.zipCode || '',
        });
      } finally {
        setIsLoadingUserData(false);
      }
    };

    loadUserData();
  }, [user]);

  // Carregar produtos recomendados
  useEffect(() => {
    const loadRecommendedProducts = async () => {
      setIsLoadingRecommended(true);
      try {
        const response = await fetch(`${env.API_URL}/public/products?limit=100`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('Produtos recebidos da API:', data.products?.length || 0);
        
        if (data.products && Array.isArray(data.products)) {
          // Filtrar produtos que já estão no carrinho
          const cartProductIds = new Set(checkoutItems.map(item => item.product.id));
          const filtered = data.products
            .filter((p: any) => {
              // Não mostrar produtos que já estão no carrinho
              if (cartProductIds.has(p.id)) return false;
              // Mostrar todos os produtos, mesmo sem estoque ou indisponíveis (apenas para visualização)
              return true;
            });
          
          console.log('Produtos após filtro:', filtered.length);
          console.log('Produtos no carrinho:', cartProductIds.size);
          
          // Exibir no máximo 10 produtos recomendados
          const limited = filtered.slice(0, 10);
          console.log('Produtos finais para exibir:', limited.length);
          
          setRecommendedProducts(limited);
        } else {
          console.warn('Resposta da API não contém produtos:', data);
          setRecommendedProducts([]);
        }
      } catch (error) {
        console.error('Erro ao carregar produtos recomendados:', error);
        setRecommendedProducts([]);
      } finally {
        setIsLoadingRecommended(false);
      }
    };

    if (currentStep === 'address') {
      loadRecommendedProducts();
    }
  }, [checkoutItems, currentStep]);

  // Adicionar produto recomendado ao carrinho
  const handleAddRecommendedProduct = async (product: any) => {
    try {
      const store = useAppStore.getState();
      
      // Preparar produto no formato esperado
      const productToAdd = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrls?.[0] || product.imageUrl,
        storeId: product.storeId,
      };
      
      // Adicionar ao carrinho
      store.addToCart(productToAdd, 1);
      
      // Atualizar produtos selecionados
      setSelectedProducts(prev => new Set([...prev, product.id]));
      
      alert('Produto adicionado ao carrinho!');
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      alert('Erro ao adicionar produto ao carrinho');
    }
  };

  // Abrir Quick View
  const openQuickView = async (product: any) => {
    try {
      setIsLoadingQuickView(true);
      setQuickViewProduct(null);
      setQuickViewImages([]);
      setQuickViewImageIndex(0);
      setQuickViewQty(1);

      // Buscar detalhes do produto
      try {
        const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
        const res = await fetch(`${apiBaseUrl}/public/products/${product.id}`);
        if (res.ok) {
          const data = await res.json();
          setQuickViewProduct({
            id: data.id,
            name: data.name,
            description: data.description,
            price: Number(data.price),
            stock: Number(data.stock) || 0,
            brand: data.brand,
            color: data.colorHex || data.colorName,
            material: data.material,
            dimensions: data.width && data.height && data.depth ? `${data.width}x${data.height}x${data.depth}cm` : data.dimensions,
            imageUrl: (Array.isArray(data.imageUrls) && data.imageUrls[0]) || data.imageUrl,
            storeId: data.store?.id || data.storeId || '',
          });
          if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
            setQuickViewImages(data.imageUrls);
          } else if (data.imageUrl) {
            setQuickViewImages([data.imageUrl]);
          }
        } else {
          // fallback: usar o produto do card
          setQuickViewProduct({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            imageUrl: product.imageUrls?.[0] || product.imageUrl,
            storeId: product.storeId,
            stock: product.stock || 0,
          });
          setQuickViewImages([product.imageUrls?.[0] || product.imageUrl].filter(Boolean));
        }
      } catch (e) {
        setQuickViewProduct({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          imageUrl: product.imageUrls?.[0] || product.imageUrl,
          storeId: product.storeId,
          stock: product.stock || 0,
        });
        setQuickViewImages([product.imageUrls?.[0] || product.imageUrl].filter(Boolean));
      }

      setIsQuickViewOpen(true);
    } finally {
      setIsLoadingQuickView(false);
    }
  };

  const handleQuickAddToCart = () => {
    if (!quickViewProduct) return;
    const store = useAppStore.getState();
    const productToAdd = {
      id: quickViewProduct.id,
      name: quickViewProduct.name,
      price: quickViewProduct.price,
      imageUrl: quickViewProduct.imageUrl || quickViewImages[0],
      storeId: quickViewProduct.storeId,
    } as any;
    store.addToCart(productToAdd, quickViewQty);

    // Incluir na compra atual (itens selecionados no checkout)
    setSelectedProducts((prev) => {
      const updated = new Set([...Array.from(prev), String(quickViewProduct.id)]);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'checkout-selected-products',
            JSON.stringify(Array.from(updated))
          );
        }
      } catch {}
      return updated;
    });
    setIsQuickViewOpen(false);
    alert('Produto adicionado ao carrinho!');
  };

  // Buscar CEP via ViaCEP
  const handleSearchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert('CEP não encontrado');
        return;
      }

      setShippingAddress(prev => ({
        ...prev,
        address: data.logradouro || prev.address,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
        zipCode: cleanCep,
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  // Abrir modal de edição
  const handleOpenEditModal = () => {
    setEditAddress({ ...shippingAddress });
    setIsEditModalOpen(true);
  };

  // Salvar alterações do endereço
  const handleSaveAddress = async () => {
    if (!validateAddress(editAddress)) {
      return;
    }

      setIsSaving(true);
    try {
      // Atualizar perfil do usuário
      await customerAPI.updateProfile({
        name: editAddress.name,
        phone: editAddress.phone,
        cpf: editAddress.cpf,
        address: `${editAddress.address} ${editAddress.number}${editAddress.complement ? ` - ${editAddress.complement}` : ''}`.trim(),
        city: editAddress.city,
        state: editAddress.state,
        zipCode: editAddress.zipCode,
      });

      // Atualizar estado local
      setShippingAddress({ ...editAddress });
      setIsEditModalOpen(false);
      alert('Endereço atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar endereço:', error);
      alert(error.response?.data?.message || 'Erro ao salvar endereço');
    } finally {
      setIsSaving(false);
    }
  };

  // Buscar CEP no modal
  const handleSearchCepInModal = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert('CEP não encontrado');
        return;
      }

      setEditAddress(prev => ({
        ...prev,
        address: data.logradouro || prev.address,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
        zipCode: cleanCep,
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

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
  const validateAddress = (address: ShippingAddress = shippingAddress) => {
    const required = ['name', 'phone', 'cpf', 'address', 'number', 'neighborhood', 'city', 'state', 'zipCode'];
    const missing = required.filter(field => !address[field as keyof ShippingAddress]?.trim());
    
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
                  {/* Exibição do Endereço */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">Endereço De Envio</h3>
                      <button
                        onClick={handleOpenEditModal}
                        className="text-sm text-gray-600 hover:text-[#3e2626] font-medium"
                      >
                        Mudar &gt;
                      </button>
                      </div>

                    {isLoadingUserData ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#3e2626]" />
                    </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="font-bold text-gray-900">{shippingAddress.name || 'Nome não informado'}</p>
                              {shippingAddress.phone && (
                                <span className="text-gray-600">{shippingAddress.phone}</span>
                              )}
                  </div>
                            <p className="text-sm text-gray-700 mb-1">
                              {shippingAddress.address ? (
                                <>
                                  {shippingAddress.address}
                                  {shippingAddress.number && ` ${shippingAddress.number}`}
                                  {shippingAddress.complement && ` - ${shippingAddress.complement}`}
                                  {shippingAddress.neighborhood && !shippingAddress.address.includes(shippingAddress.neighborhood) && ` (${shippingAddress.neighborhood})`}
                                </>
                              ) : (
                                shippingAddress.neighborhood && `${shippingAddress.neighborhood}`
                              )}
                            </p>
                            <p className="text-sm text-gray-700">
                              {shippingAddress.neighborhood && shippingAddress.address && !shippingAddress.address.includes(shippingAddress.neighborhood) && (
                                <>{shippingAddress.neighborhood}, </>
                              )}
                              {shippingAddress.city && <>{shippingAddress.city} </>}
                              {shippingAddress.state && <>{shippingAddress.state} </>}
                              Brazil
                              {shippingAddress.zipCode && ` ${shippingAddress.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2')}`}
                            </p>
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
                    )}

                    {/* Mensagem Informativa */}
                    <div className="bg-gray-50 border-l-4 border-red-500 rounded p-4">
                      <p className="text-sm text-gray-700">
                        Para assegurar a entrada de seu pedido no Brasil, confirme a validade e regularidade do CPF registrado na plataforma e certifique-se de que o nome do destinatário informado é igual ao do CPF, sem abreviações. Seu endereço deve estar completo.
                      </p>
                    </div>
                    </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleNextStep}
                      disabled={isLoadingUserData || !shippingAddress.name || !shippingAddress.address}
                      className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white hover:from-[#2a1f1f] hover:to-[#3e2626] px-8"
                    >
                      {isLoadingUserData ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        'Continuar para Pagamento'
                      )}
                    </Button>
                    </div>
                </CardContent>
              </Card>
            )}

            {/* Itens da Compra (entre Endereço e Adicione Mais) */}
            {currentStep === 'address' && checkoutItems.length > 0 && (
              <Card className="shadow-xl border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>Itens da compra</span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsItemsModalOpen(true)}
                      className="text-white/90 hover:text-white"
                    >
                      Visualizar {totalCheckoutQuantity} {totalCheckoutQuantity === 1 ? 'item' : 'itens'}
                      <ArrowLeft className="rotate-180 h-4 w-4 ml-1" />
                    </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <div className="flex gap-4">
                      {checkoutItems.map((item) => (
                        <div
                          key={item.product.id}
                          className="w-44 min-w-44 border border-gray-200 rounded-lg p-2 bg-white"
                        >
                          <div className="w-full aspect-square rounded-md overflow-hidden bg-gray-100 mb-2">
                            {item.product.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3e2626] to-[#5a3a3a]">
                                <Package className="h-8 w-8 text-white" />
                    </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-800 line-clamp-2 mb-1">{item.product.name}</div>
                          <div className="text-sm font-bold text-[#3e2626] mb-1">
                            R$ {Number(item.product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-gray-500">Qtd: {item.quantity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Produtos Recomendados - Adicione mais itens */}
            {currentStep === 'address' && showRecommendedProducts && (
              <Card className="shadow-xl border-2 border-gray-200">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-[#3e2626]">
                      Adicione mais itens para enviar juntos
                    </h3>
                    <div className="flex items-center space-x-2">
                     
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRecommendedProducts(false)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    </div>

                  {isLoadingRecommended ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-[#3e2626]" />
                      <span className="ml-2 text-gray-600">Carregando produtos...</span>
                    </div>
                  ) : recommendedProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum produto recomendado disponível no momento.</p>
                      <p className="text-sm text-gray-500 mt-2">Total de produtos no carrinho: {checkoutItems.length}</p>
                    </div>
                  ) : (
                    <>
                  <div className="relative">
                    <div className="overflow-hidden">
                      <div 
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{ transform: `translateX(-${recommendedProductIndex * (100 / VISIBLE_RECOMMENDED)}%)` }}
                      >
                        {recommendedProducts.map((p) => (
                          <div
                            key={p.id}
                            className="flex flex-col cursor-pointer group shrink-0 px-4"
                            style={{ minWidth: `${100 / VISIBLE_RECOMMENDED}%`, maxWidth: `${100 / VISIBLE_RECOMMENDED}%` }}
                            onClick={() => openQuickView(p)}
                          >
                            <div className="w-full h-60 bg-white rounded-lg overflow-hidden mb-3">
                              {p.imageUrls?.[0] || p.imageUrl ? (
                                <img
                                  src={p.imageUrls?.[0] || p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <Package className="h-10 w-10 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-lg font-bold text-orange-500">
                                  R${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                                <div className="mb-1">
                                  <span className="inline-block bg-orange-100 text-orange-500 text-sm font-medium px-2 py-1 rounded">
                                    -{Math.round(((Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice)) * 100)}%
                                  </span>
                                </div>
                              )}
                              <p className="text-sm text-gray-500">Estimado</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                    {recommendedProductIndex > 0 && (
                      <button
                        type="button"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center z-10 transition-colors shadow-md border border-gray-200"
                        onClick={() => setRecommendedProductIndex(prev => Math.max(0, prev - 1))}
                      >
                        <ChevronLeft className="h-6 w-6 text-black" />
                      </button>
                    )}

                    {recommendedProductIndex < Math.max(0, recommendedProducts.length - VISIBLE_RECOMMENDED) && (
                      <button
                        type="button"
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center z-10 transition-colors shadow-md border border-gray-200"
                        onClick={() => setRecommendedProductIndex(prev => Math.min(Math.max(0, recommendedProducts.length - VISIBLE_RECOMMENDED), prev + 1))}
                      >
                        <ChevronRight className="h-6 w-6 text-black" />
                      </button>
                    )}
                  </div>
                    </>
                  )}
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
            <Card className="top-24 shadow-xl border-2 border-gray-200">
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

              </CardContent>
            </Card>

            {/* Segurança de Pagamento (refinado) */}
            <Card className="shadow-xl border border-gray-200">
              <CardContent className="p-5">
                <div className="space-y-6">
                  {/* Bloco 1: Segurança de Pagamento */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 ring-1 ring-emerald-200">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1f2937]">Segurança de Pagamento</h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        Suas informações são protegidas com criptografia e só são compartilhadas com provedores de pagamento confiáveis.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {['Visa','Mastercard','ID Check','SafeKey','JCB','Verified by Visa','SecureCode','American Express'].map((flag) => (
                          <span key={flag} className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Bloco 2: Segurança e Privacidade */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 ring-1 ring-emerald-200">
                      <Lock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1f2937]">Segurança e Privacidade</h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        O processador de pagamentos armazena os dados do seu cartão de forma criptografada. Não guardamos os dados reais do cartão.
                      </p>
                      <a href="/privacy" className="inline-block text-sm text-[#3e2626] hover:underline mt-1">Saiba mais &gt;</a>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Bloco 3: Garantia de entrega */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 ring-1 ring-emerald-200">
                      <Truck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1f2937]">Garantia de entrega segura</h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        Troca ou reembolso gratuito para pacotes perdidos, devolvidos ou extraviados.
                      </p>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Bloco 4: Suporte */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 ring-1 ring-emerald-200">
                      <Headphones className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1f2937]">Suporte ao cliente</h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        Fale com nossa equipe pelo site para qualquer dúvida relacionada ao seu pedido.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      {/* Modal de Edição de Endereço */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Endereço de Entrega</DialogTitle>
            <DialogDescription>
              Atualize suas informações de entrega. O endereço será salvo no seu perfil.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informações Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <Phone className="h-5 w-5 text-[#3e2626]" />
                <h3 className="text-lg font-semibold text-[#3e2626]">Informações Pessoais</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="edit-name">Nome Completo *</Label>
                  <Input
                    id="edit-name"
                    value={editAddress.name || ''}
                    onChange={(e) => setEditAddress({ ...editAddress, name: e.target.value })}
                    placeholder="Digite seu nome completo"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-phone">Telefone *</Label>
                  <Input
                    id="edit-phone"
                    value={editAddress.phone || ''}
                    onChange={(e) => setEditAddress({ ...editAddress, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-cpf">CPF *</Label>
                  <Input
                    id="edit-cpf"
                    value={editAddress.cpf || ''}
                    onChange={(e) => setEditAddress({ ...editAddress, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Informações de Localização */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <MapPin className="h-5 w-5 text-[#3e2626]" />
                <h3 className="text-lg font-semibold text-[#3e2626]">Localização</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="edit-zipCode">CEP *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="edit-zipCode"
                      value={editAddress.zipCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const formatted = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                        setEditAddress({ ...editAddress, zipCode: formatted });
                        if (value.length === 8) {
                          handleSearchCepInModal(value);
                        }
                      }}
                      placeholder="00000-000"
                      maxLength={9}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSearchCepInModal(editAddress.zipCode)}
                      disabled={isSearchingCep || editAddress.zipCode.replace(/\D/g, '').length !== 8}
                      className="border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white"
                    >
                      {isSearchingCep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="edit-address">Endereço *</Label>
                  <Input
                    id="edit-address"
                    value={editAddress.address}
                    onChange={(e) => setEditAddress({ ...editAddress, address: e.target.value })}
                    placeholder="Rua, Avenida, etc."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-number">Número *</Label>
                  <Input
                    id="edit-number"
                    value={editAddress.number || ''}
                    onChange={(e) => setEditAddress({ ...editAddress, number: e.target.value })}
                    placeholder="123"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-complement">Complemento</Label>
                  <Input
                    id="edit-complement"
                    value={editAddress.complement}
                    onChange={(e) => setEditAddress({ ...editAddress, complement: e.target.value })}
                    placeholder="Apto, Bloco, etc."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-neighborhood">Bairro *</Label>
                  <Input
                    id="edit-neighborhood"
                    value={editAddress.neighborhood}
                    onChange={(e) => setEditAddress({ ...editAddress, neighborhood: e.target.value })}
                    placeholder="Centro"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-city">Cidade *</Label>
                  <Input
                    id="edit-city"
                    value={editAddress.city}
                    onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                    placeholder="São Paulo"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-state">Estado *</Label>
                  <Input
                    id="edit-state"
                    value={editAddress.state}
                    onChange={(e) => setEditAddress({ ...editAddress, state: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="mt-1"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAddress}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white hover:from-[#2a1f1f] hover:to-[#3e2626]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Itens da Compra */}
      <Dialog open={isItemsModalOpen} onOpenChange={setIsItemsModalOpen}>
        <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              Visualizar {totalCheckoutQuantity} {totalCheckoutQuantity === 1 ? 'item' : 'itens'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {checkoutItems.map((item) => (
              <div key={item.product.id} className="flex items-start gap-4 border-b last:border-b-0 pb-4">
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3e2626] to-[#5a3a3a]">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-[#1f2937] truncate pr-2">{item.product.name}</h4>
                    <div className="text-sm text-gray-500 whitespace-nowrap">R$ {Number(item.product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center border rounded">
                      <button
                        className={`px-3 py-1.5 ${
                          checkoutItems.length === 1
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-100'
                        }`}
                        disabled={checkoutItems.length === 1}
                        onClick={() => {
                          // Se for o último item, não permite remover
                          if (checkoutItems.length === 1) {
                            return;
                          }
                          
                          const store = useAppStore.getState();
                          const currentQty = item.quantity || 1;
                          
                          // Se quantidade for 1, remove o item
                          if (currentQty === 1) {
                            store.removeFromCart(item.product.id);
                            // Atualizar selectedProducts para remover do checkout
                            setSelectedProducts(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(item.product.id);
                              return newSet;
                            });
                          } else {
                            // Caso contrário, apenas diminui a quantidade
                            store.updateCartItemQuantity(item.product.id, currentQty - 1);
                          }
                        }}
                      >-</button>
                      <div className="w-10 text-center">{item.quantity}</div>
                      <button
                        className="px-3 py-1.5 hover:bg-gray-100"
                        onClick={() => {
                          const store = useAppStore.getState();
                          store.updateCartItemQuantity(item.product.id, (item.quantity || 1) + 1);
                        }}
                      >+</button>
                    </div>
                    <div className="text-sm text-gray-500">Subtotal: R$ {(Number(item.product.price) * (item.quantity || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2 flex items-center justify-between">
              <div className="text-sm text-gray-600">Total de itens: {totalCheckoutQuantity}</div>
              <div className="text-base font-semibold text-[#3e2626]">
                Total: R$ {checkoutItems.reduce((sum, it) => sum + Number(it.product.price) * (it.quantity || 1), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Quick View - Detalhes rápidos do produto */}
      <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização rápida</DialogTitle>
            <DialogDescription>
              Veja os detalhes do produto e adicione ao carrinho.
            </DialogDescription>
          </DialogHeader>

          {isLoadingQuickView ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#3e2626]" />
            </div>
          ) : quickViewProduct ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Imagens */}
              <div>
                <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                  {quickViewImages[quickViewImageIndex] ? (
                    <img
                      src={quickViewImages[quickViewImageIndex]}
                      alt={quickViewProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Package className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                </div>
                {quickViewImages.length > 1 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {quickViewImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuickViewImageIndex(idx)}
                        className={`h-16 rounded overflow-hidden border ${idx === quickViewImageIndex ? 'border-[#3e2626]' : 'border-gray-200'}`}
                      >
                        <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-[#3e2626]">{quickViewProduct.name}</h3>
                <div className="text-3xl font-bold text-[#3e2626]">
                  R$ {Number(quickViewProduct.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                {quickViewProduct.brand && (
                  <p className="text-sm text-gray-600">Marca: {quickViewProduct.brand}</p>
                )}
                {quickViewProduct.material && (
                  <p className="text-sm text-gray-600">Material: {quickViewProduct.material}</p>
                )}
                {quickViewProduct.dimensions && (
                  <p className="text-sm text-gray-600">Dimensões: {quickViewProduct.dimensions}</p>
                )}
                {quickViewProduct.color && (
                  <p className="text-sm text-gray-600">Cor: {quickViewProduct.color}</p>
                )}

                {quickViewProduct.description && (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {String(quickViewProduct.description).slice(0, 240)}{String(quickViewProduct.description).length > 240 ? '...' : ''}
                  </p>
                )}

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center border rounded">
                    <button className="px-3 py-2" onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}>-</button>
                    <div className="w-12 text-center">{quickViewQty}</div>
                    <button className="px-3 py-2" onClick={() => setQuickViewQty(quickViewQty + 1)}>+</button>
                  </div>
                  <Button onClick={handleQuickAddToCart} className="bg-[#3e2626] text-white hover:bg-[#2a1f1f]">Adicionar ao carrinho</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">Produto não encontrado.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

