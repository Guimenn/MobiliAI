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
  Headphones,
  Store
} from 'lucide-react';
import { customerAPI, authAPI, storesAPI } from '@/lib/api';
import { env } from '@/lib/env';
import { showAlert, showConfirm } from '@/lib/alerts';
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
  type: 'pix' | 'card';
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
  // Aceita telefone com 10 ou 11 dígitos (com DDD) ou 12/13 com código do país (55)
  if (cleanPhone.length === 0) return false;
  if (cleanPhone.length === 10 || cleanPhone.length === 11) return true;
  if ((cleanPhone.length === 12 || cleanPhone.length === 13) && cleanPhone.startsWith('55')) return true;
  return false;
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

// Função para calcular distância entre duas coordenadas (Haversine)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distância em km
};

// Função para geocodificar endereço (converter endereço em coordenadas)
const geocodeAddress = async (address: string, city: string, state: string, zipCode: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const fullAddress = `${address}, ${city}, ${state}, ${zipCode}, Brasil`;
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // Usar Nominatim (OpenStreetMap) - API gratuita
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'PintAi/1.0' // Nominatim requer User-Agent
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Erro ao geocodificar endereço');
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao geocodificar:', error);
    return null;
  }
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

  // Método de pagamento selecionado
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'card'>('pix');
  const paymentMethod: PaymentMethod = { type: selectedPaymentMethod };

  // Cupom e descontos
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Opções de entrega
  const [selectedShipping, setSelectedShipping] = useState<'standard' | 'express' | 'pickup'>('standard');
  const [shippingInsurance, setShippingInsurance] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [storesWithDistance, setStoresWithDistance] = useState<any[]>([]);

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

  // Função para obter o preço atual com desconto (se houver oferta relâmpago configurada)
  const getCurrentPrice = (product: any): number => {
    const originalPrice = Number(product.price);
    
    // Se houver oferta relâmpago configurada, calcular preço com desconto
    if (product.isFlashSale) {
      // Se tem flashSaleDiscountPercent, calcular preço
      if (product.flashSaleDiscountPercent && product.flashSaleDiscountPercent > 0) {
        const discount = (originalPrice * product.flashSaleDiscountPercent) / 100;
        return originalPrice - discount;
      }
      // Se tem flashSalePrice, usar ele
      if (product.flashSalePrice !== undefined && product.flashSalePrice !== null) {
        return Number(product.flashSalePrice);
      }
    }
    
    // Se houver oferta normal ativa
    if (product.isOnSale && product.salePrice) {
      const now = new Date();
      if (product.saleStartDate && product.saleEndDate) {
        const start = new Date(product.saleStartDate);
        const end = new Date(product.saleEndDate);
        if (now >= start && now <= end) {
          return Number(product.salePrice);
        }
      }
    }
    
    return originalPrice;
  };

  // Cálculos
  const subtotal = useMemo(() => {
    return checkoutItems.reduce((total, item) => {
      const currentPrice = getCurrentPrice(item.product);
      return total + (currentPrice * item.quantity);
    }, 0);
  }, [checkoutItems]);

  const shippingCost = useMemo(() => {
    // Retirada na loja é sempre grátis
    if (selectedShipping === 'pickup') return 0;
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

  // Obter localização do usuário
  useEffect(() => {
    const getUserLocation = () => {
      if (!navigator.geolocation) {
        console.log('Geolocalização não suportada pelo navegador');
        return;
      }

      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setIsLoadingLocation(false);
          // Se o usuário negar, tentar usar o endereço do perfil como fallback
          if (shippingAddress.city && shippingAddress.state) {
            // Tentar geocodificar o endereço do usuário
            geocodeAddress(
              shippingAddress.address || '',
              shippingAddress.city,
              shippingAddress.state,
              shippingAddress.zipCode || ''
            ).then(coords => {
              if (coords) {
                setUserLocation(coords);
              }
            });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    };

    // Só tentar obter localização se o usuário estiver na etapa de endereço ou pagamento
    if (currentStep === 'address' || currentStep === 'payment') {
      getUserLocation();
    }
  }, [currentStep, shippingAddress]);

  // Carregar lojas disponíveis e calcular distâncias
  useEffect(() => {
    const loadStores = async () => {
      setIsLoadingStores(true);
      try {
        console.log('🛒 Carregando lojas...');
        console.log('👤 Usuário atual:', user);
        console.log('👤 Role do usuário:', user?.role);
        console.log('🔑 Token:', token ? 'Presente' : 'Ausente');
        console.log('🔐 Autenticado:', isAuthenticated);
        
        const storesData = await storesAPI.getAll();
        console.log('📦 Dados recebidos da API:', storesData);
        console.log('📊 Tipo de dados:', typeof storesData);
        console.log('📊 É array?', Array.isArray(storesData));
        console.log('📊 Quantidade:', storesData?.length);
        
        // Verificar se recebeu dados válidos
        if (!storesData || !Array.isArray(storesData)) {
          console.error('❌ Dados de lojas inválidos:', storesData);
          setStores([]);
          setStoresWithDistance([]);
          setIsLoadingStores(false);
          return;
        }

        // Filtrar apenas lojas ativas (se isActive for false, excluir; caso contrário, incluir)
        let availableStores = storesData.filter((store: any) => {
          // Se isActive é explicitamente false, excluir
          // Caso contrário (true, undefined, null), incluir
          const isActive = store.isActive !== false;
          console.log(`🏪 Loja ${store.name}: isActive=${store.isActive}, será incluída=${isActive}`);
          return isActive;
        });
        
        console.log(`✅ Lojas ativas encontradas: ${availableStores.length} de ${storesData.length}`);
        
        // SEMPRE filtrar lojas que têm os produtos do checkout
        if (checkoutItems.length > 0) {
          // Extrair todos os storeIds únicos dos produtos no carrinho
          const productStoreIds = new Set<string>();
          checkoutItems.forEach((item: any) => {
            const productStoreId = item.product?.storeId || (item.product as any)?.store?.id || (item.product as any)?.storeId;
            if (productStoreId) {
              productStoreIds.add(productStoreId);
            }
          });
          
          console.log(`🛍️ StoreIds dos produtos no carrinho:`, Array.from(productStoreIds));
          console.log(`🛍️ Produtos no carrinho:`, checkoutItems.map((item: any) => ({
            productId: item.product?.id,
            productName: item.product?.name,
            storeId: item.product?.storeId || (item.product as any)?.store?.id || (item.product as any)?.storeId
          })));
          
          // Filtrar apenas lojas que têm pelo menos um produto do carrinho
          const storesWithProducts = availableStores.filter((store: any) => {
            return productStoreIds.has(store.id);
          });
          
          console.log(`🛍️ Lojas com produtos do carrinho: ${storesWithProducts.length}`);
          
          // SEMPRE usar apenas as lojas com produtos (não mostrar todas se não houver produtos)
          if (storesWithProducts.length > 0) {
            availableStores = storesWithProducts;
          } else {
            // Se nenhuma loja tem os produtos, mostrar array vazio
            availableStores = [];
            console.warn('⚠️ Nenhuma loja encontrada com os produtos do carrinho');
          }
        } else {
          // Se não há produtos no carrinho, não mostrar lojas
          availableStores = [];
          console.log('ℹ️ Nenhum produto no carrinho, não exibindo lojas');
        }
        
        console.log(`📍 Lojas finais disponíveis: ${availableStores.length}`);
        
        // Se não há lojas, mostrar mensagem informativa
        if (availableStores.length === 0) {
          console.warn('⚠️ Nenhuma loja disponível. Possíveis causas:');
          console.warn('  1. Não há lojas cadastradas no sistema');
          console.warn('  2. Todas as lojas estão inativas (isActive: false)');
          console.warn('  3. O usuário não tem permissão para ver lojas');
          console.warn('  4. Erro na consulta ao banco de dados');
        }
        
        // Se temos localização do usuário, calcular distâncias e ordenar
        if (userLocation && availableStores.length > 0) {
          console.log('🌍 Calculando distâncias com localização do usuário...');
          // Processar lojas sequencialmente com delay para não sobrecarregar a API
          const storesWithCoords = [];
          for (let i = 0; i < availableStores.length; i++) {
            const store = availableStores[i];
            // Adicionar delay de 1 segundo entre requisições (Nominatim tem limite de rate)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            try {
              const coords = await geocodeAddress(
                store.address,
                store.city,
                store.state,
                store.zipCode
              );
              
              if (coords) {
                const distance = calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  coords.lat,
                  coords.lng
                );
                storesWithCoords.push({ ...store, distance, coordinates: coords });
              } else {
                storesWithCoords.push({ ...store, distance: null, coordinates: null });
              }
            } catch (error) {
              console.error(`Erro ao geocodificar loja ${store.name}:`, error);
              storesWithCoords.push({ ...store, distance: null, coordinates: null });
            }
          }
          
          // Ordenar por distância (lojas sem distância vão para o final)
          const sortedStores = storesWithCoords.sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
          
          console.log(`✅ Lojas ordenadas por distância: ${sortedStores.length}`);
          setStoresWithDistance(sortedStores);
          setStores(sortedStores);
          
          // Selecionar automaticamente a loja mais próxima
          setSelectedStore((current) => {
            if (current) return current; // Manter seleção atual se já existir
            const nearestStore = sortedStores.find((s: any) => s.distance !== null);
            if (nearestStore) return nearestStore.id;
            if (sortedStores.length > 0) return sortedStores[0].id;
            return '';
          });
        } else {
          // Sem localização, apenas definir as lojas
          console.log('📍 Sem localização, exibindo todas as lojas ativas');
          setStoresWithDistance(availableStores.map((s: any) => ({ ...s, distance: null })));
          setStores(availableStores);
          
          setSelectedStore((current) => {
            if (current) return current;
            if (availableStores.length > 0) return availableStores[0].id;
            return '';
          });
        }
      } catch (error: any) {
        console.error('❌ Erro ao carregar lojas:', error);
        console.error('Detalhes do erro:', error.response?.data || error.message);
        showAlert('warning', 'Não foi possível carregar as lojas. Verifique sua conexão e tente novamente.');
        setStores([]);
        setStoresWithDistance([]);
      } finally {
        setIsLoadingStores(false);
        console.log('🏁 Carregamento de lojas finalizado');
      }
    };
    
    // Sempre carregar lojas (elas serão usadas quando pickup for selecionado)
    loadStores();
  }, [checkoutItems, userLocation]);

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
        category: product.category || '',
        stock: product.stock || 0,
      };
      
      // Adicionar ao carrinho
      store.addToCart(productToAdd, 1);
      
      // Atualizar produtos selecionados
      setSelectedProducts(prev => new Set([...prev, product.id]));
      
      showAlert('success', 'Produto adicionado ao carrinho!');
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      showAlert('error', 'Erro ao adicionar produto ao carrinho');
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
        showAlert('warning', 'CEP não encontrado');
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
      showAlert('error', 'Erro ao buscar CEP. Tente novamente.');
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
      showAlert('success', 'Endereço atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar endereço:', error);
      showAlert('error', error.response?.data?.message || 'Erro ao salvar endereço');
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
        showAlert('warning', 'CEP não encontrado');
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
      showAlert('error', 'Erro ao buscar CEP. Tente novamente.');
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
    // Se for retirada na loja, apenas validar nome, telefone e CPF
    if (selectedShipping === 'pickup') {
      if (!address.name?.trim()) {
        showAlert('warning', 'Por favor, informe seu nome');
        return false;
      }
      if (!address.phone?.trim()) {
        showAlert('warning', 'Por favor, informe seu telefone');
        return false;
      }
      if (!address.cpf?.trim()) {
        showAlert('warning', 'Por favor, informe seu CPF');
        return false;
      }
      if (!selectedStore) {
        showAlert('warning', 'Por favor, selecione uma loja para retirada');
        return false;
      }
      return true;
    }
    
    // Para entrega, validar todos os campos
    const required = ['name', 'phone', 'cpf', 'address', 'number', 'neighborhood', 'city', 'state', 'zipCode'];
    const missing = required.filter(field => !address[field as keyof ShippingAddress]?.trim());
    
    if (missing.length > 0) {
      showAlert('warning', 'Por favor, preencha todos os campos obrigatórios do endereço');
      return false;
    }

    // Validar telefone
    if (!validatePhone(address.phone)) {
      setPhoneError('Telefone inválido. Use o formato (11) 99999-9999');
      showAlert('warning', 'Por favor, digite um telefone válido');
      return false;
    }

    // Validar CPF
    const cpf = address.cpf.replace(/\D/g, '');
    if (cpf.length !== 11) {
      setCpfError('CPF inválido. Digite um CPF válido com 11 dígitos');
      showAlert('warning', 'Por favor, digite um CPF válido');
      return false;
    }

    if (!validateCPF(shippingAddress.cpf)) {
      setCpfError('CPF inválido. Verifique os dígitos');
      showAlert('error', 'CPF inválido. Verifique os dígitos');
      return false;
    }

    return true;
  };

  const validatePayment = () => true;

  // Finalizar pedido
  const handleFinalizeOrder = async () => {
    if (!validateAddress() || !validatePayment()) {
      return;
    }

    // Validar se há itens no carrinho
    if (!checkoutItems || checkoutItems.length === 0) {
      showAlert('warning', 'Seu carrinho está vazio. Adicione produtos antes de finalizar o pedido.');
      return;
    }

    setIsProcessing(true);

    try {
      // Sincronizar carrinho do frontend com o backend antes do checkout
      console.log('Sincronizando carrinho com o backend...', checkoutItems.length, 'itens');
      
      // Adicionar todos os itens do carrinho do frontend ao backend
      for (const item of checkoutItems) {
        try {
          await customerAPI.addToCart(item.product.id, item.quantity);
          console.log(`Produto ${item.product.id} adicionado ao backend`);
        } catch (error: any) {
          console.warn(`Erro ao adicionar produto ${item.product.id} ao backend:`, error.message);
          // Continuar mesmo se houver erro em um produto
        }
      }

      // Verificar se o carrinho no backend tem itens após sincronização
      const backendCart = await customerAPI.getCart();
      if (!backendCart || !backendCart.items || backendCart.items.length === 0) {
        showAlert('error', 'Não foi possível sincronizar seu carrinho com o servidor. Por favor, adicione os produtos novamente.');
        setIsProcessing(false);
        router.push('/cart');
        return;
      }

      console.log('Carrinho sincronizado:', backendCart.items.length, 'itens no backend');

      // Determinar loja (retirada na loja usa a loja selecionada, entrega usa a loja dos produtos)
      const firstProduct = checkoutItems[0]?.product;
      const productStoreId = firstProduct?.storeId || (firstProduct as any)?.store?.id;
      const storeId = selectedShipping === 'pickup' && selectedStore 
        ? selectedStore 
        : productStoreId || 'default';
      
      console.log('Dados do checkout:', {
        storeId,
        selectedShipping,
        selectedStore,
        itemsCount: checkoutItems.length,
        backendCartItemsCount: backendCart.items?.length || 0,
        shippingAddress,
        paymentMethod,
        shippingCost,
        insuranceCost,
        tax,
        discount,
      });
      
      // Preparar notas do pedido
      let notes = 'Pedido via checkout web. ';
      if (selectedShipping === 'pickup') {
        const selectedStoreData = stores.find((s: any) => s.id === selectedStore);
        notes += `Retirada na loja: ${selectedStoreData?.name || 'Loja selecionada'}. `;
      } else {
        notes += `Frete: ${selectedShipping === 'express' ? 'Expresso' : 'Padrão'}. `;
        notes += shippingInsurance ? 'Com seguro de envio. ' : 'Sem seguro. ';
      }
      if (appliedCoupon) {
        notes += `Cupom aplicado: ${appliedCoupon.code}.`;
      }
      
      // Criar a venda no backend (usuário já está autenticado neste ponto)
      const saleResponse = await customerAPI.checkout({
        storeId,
        shippingAddress: selectedShipping === 'pickup' 
          ? (stores.find((s: any) => s.id === selectedStore)?.address || 'Retirada na loja')
          : `${shippingAddress.address}, ${shippingAddress.number}${shippingAddress.complement ? ` - ${shippingAddress.complement}` : ''}`,
        shippingCity: selectedShipping === 'pickup'
          ? (stores.find((s: any) => s.id === selectedStore)?.city || '')
          : shippingAddress.city,
        shippingState: selectedShipping === 'pickup'
          ? (stores.find((s: any) => s.id === selectedStore)?.state || '')
          : shippingAddress.state,
        shippingZipCode: selectedShipping === 'pickup'
          ? (stores.find((s: any) => s.id === selectedStore)?.zipCode || '')
          : shippingAddress.zipCode,
        shippingPhone: shippingAddress.phone,
        shippingCost: shippingCost,
        insuranceCost: insuranceCost,
        tax: tax,
        discount: discount,
        notes: notes,
      });

      // Redirecionar para a página de pagamento apropriada
      if (selectedPaymentMethod === 'card') {
        router.push(`/payment/card?saleId=${saleResponse.id}`);
      } else {
        router.push(`/payment/pix?saleId=${saleResponse.id}`);
      }
    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Extrair mensagem de erro mais detalhada
      let errorMessage = 'Erro ao processar pedido. Tente novamente.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert('error', `Erro: ${errorMessage}`);
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
                        </div>

                        {shippingAddress.phone && (
                          <div>
                            <Label className="text-sm font-semibold text-gray-700">Telefone</Label>
                            <p className="text-sm text-gray-900 mt-1">{shippingAddress.phone}</p>
                          </div>
                        )}

                        {shippingAddress.cpf && (
                          <div>
                            <Label className="text-sm font-semibold text-gray-700">CPF</Label>
                            <p className="text-sm text-gray-900 mt-1">{shippingAddress.cpf}</p>
                          </div>
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
                            {(() => {
                              const imageUrl = item.product.imageUrls && item.product.imageUrls.length > 0 
                                ? item.product.imageUrls[0] 
                                : item.product.imageUrl;
                              return imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('Erro ao carregar imagem:', imageUrl);
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3e2626] to-[#5a3a3a]">
                                  <Package className="h-8 w-8 text-white" />
                                </div>
                              );
                            })()}
                            <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3e2626] to-[#5a3a3a]">
                              <Package className="h-8 w-8 text-white" />
                            </div>
                          </div>
                          <div className="text-xs text-gray-800 line-clamp-2 mb-1">{item.product.name}</div>
                          <div className="text-sm font-bold text-[#3e2626] mb-1">
                            {(() => {
                              const originalPrice = Number(item.product.price);
                              const currentPrice = getCurrentPrice(item.product);
                              const hasDiscount = currentPrice < originalPrice;
                              
                              return (
                                <div className="flex flex-col">
                                  <span>R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  {hasDiscount && (
                                    <span className="text-xs text-gray-500 line-through">
                                      R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
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
                        selectedPaymentMethod === 'pix'
                          ? 'border-[#3e2626] bg-[#3e2626]/5'
                          : 'border-gray-200 hover:border-[#3e2626]/50'
                      }`}
                      onClick={() => setSelectedPaymentMethod('pix')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === 'pix' ? 'border-[#3e2626] bg-[#3e2626]' : 'border-gray-300'
                        }`}>
                          {selectedPaymentMethod === 'pix' && <div className="w-2 h-2 rounded-full bg-white"></div>}
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
                        selectedPaymentMethod === 'card'
                          ? 'border-[#3e2626] bg-[#3e2626]/5'
                          : 'border-gray-200 hover:border-[#3e2626]/50'
                      }`}
                      onClick={() => setSelectedPaymentMethod('card')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === 'card' ? 'border-[#3e2626] bg-[#3e2626]' : 'border-gray-300'
                        }`}>
                          {selectedPaymentMethod === 'card' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-[#3e2626]">Cartão de Crédito</span>
                            <Badge className="bg-blue-500 text-white text-xs">Seguro</Badge>
                          </div>
                          <p className="text-sm text-gray-600">Pague com cartão de crédito via Stripe</p>
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

                      {/* Opção de Retirar na Loja */}
                      <div
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedShipping === 'pickup'
                            ? 'border-[#3e2626] bg-[#3e2626]/5'
                            : 'border-gray-200 hover:border-[#3e2626]/50'
                        }`}
                        onClick={() => setSelectedShipping('pickup')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedShipping === 'pickup' ? 'border-[#3e2626] bg-[#3e2626]' : 'border-gray-300'
                            }`}>
                              {selectedShipping === 'pickup' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-[#3e2626] flex items-center gap-2">
                                <Store className="h-4 w-4" />
                                Retirar na Loja
                              </div>
                              <div className="text-sm text-green-600 font-semibold mt-1">Grátis</div>
                              <div className="text-xs text-gray-500 mt-1">Retire seu pedido na loja escolhida</div>
                              
                              {/* Seletor de loja quando retirada estiver selecionada */}
                              {selectedShipping === 'pickup' && (
                                <div className="mt-3">
                                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Selecione a loja para retirada:
                                    {isLoadingLocation && (
                                      <span className="ml-2 text-xs text-gray-500">
                                        (Buscando sua localização...)
                                      </span>
                                    )}
                                  </Label>
                                  {isLoadingStores ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Carregando lojas...
                                    </div>
                                  ) : stores && stores.length > 0 ? (
                                    <div className="space-y-2">
                                      {stores.map((store: any) => (
                                        <div
                                          key={store.id}
                                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                                            selectedStore === store.id
                                              ? 'border-[#3e2626] bg-[#3e2626]/5'
                                              : 'border-gray-200 hover:border-[#3e2626]/50'
                                          }`}
                                          onClick={() => setSelectedStore(store.id)}
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                  selectedStore === store.id
                                                    ? 'border-[#3e2626] bg-[#3e2626]'
                                                    : 'border-gray-300'
                                                }`}>
                                                  {selectedStore === store.id && (
                                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                                  )}
                                                </div>
                                                <div className="flex-1">
                                                  <p className="font-semibold text-[#3e2626]">{store.name}</p>
                                                  <p className="text-sm text-gray-600">
                                                    {store.address}, {store.city} - {store.state}
                                                  </p>
                                                  {store.phone && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                      📞 {store.phone}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                            {store.distance !== null && store.distance !== undefined && (
                                              <div className="ml-3 text-right">
                                                <div className="flex items-center gap-1 text-sm font-semibold text-[#3e2626]">
                                                  <MapPin className="h-4 w-4" />
                                                  {store.distance < 1
                                                    ? `${Math.round(store.distance * 1000)}m`
                                                    : `${store.distance.toFixed(1)} km`}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">distância</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                      <p className="text-sm text-yellow-800 font-semibold mb-2">
                                        ⚠️ Nenhuma loja disponível
                                      </p>
                                      <p className="text-xs text-yellow-700">
                                        Não há lojas cadastradas ou ativas no momento. 
                                        Entre em contato com o suporte para mais informações.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seguro de envio apenas para entregas */}
                    {selectedShipping !== 'pickup' && (
                      <div className="mt-4 flex items-center space-x-2">
                        <Checkbox
                          id="insurance"
                          checked={shippingInsurance}
                          onCheckedChange={(checked) => setShippingInsurance(checked === true)}
                        />
                        <Label htmlFor="insurance" className="cursor-pointer">
                          <span className="font-semibold">Seguro de envio</span>
                          <span className="text-gray-600 ml-2">(R$ 5,00) - Reenvio gratuito se o item for perdido ou danificado</span>
                        </Label>
                      </div>
                    )}
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
                            {(() => {
                              const imageUrl = item.product.imageUrls && item.product.imageUrls.length > 0 
                                ? item.product.imageUrls[0] 
                                : item.product.imageUrl;
                              return imageUrl ? (
                                <img 
                                  src={imageUrl} 
                                  alt={item.product.name} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('Erro ao carregar imagem:', imageUrl);
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3e2626] to-[#5a3a3a]">
                                  <Package className="h-8 w-8 text-white" />
                                </div>
                              );
                            })()}
                            <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3e2626] to-[#5a3a3a]">
                              <Package className="h-8 w-8 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#3e2626]">{item.product.name}</h4>
                            <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                            <p className="text-lg font-bold text-[#3e2626] mt-1">
                              {(() => {
                                const originalPrice = Number(item.product.price);
                                const currentPrice = getCurrentPrice(item.product);
                                const itemTotal = currentPrice * item.quantity;
                                const originalTotal = originalPrice * item.quantity;
                                const hasDiscount = currentPrice < originalPrice;
                                
                                return (
                                  <div className="flex flex-col">
                                    <span>R$ {itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    {hasDiscount && (
                                      <span className="text-sm text-gray-500 line-through font-normal">
                                        R$ {originalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Endereço de Entrega ou Retirada na Loja */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg text-[#3e2626]">
                          {selectedShipping === 'pickup' ? 'Retirada na Loja' : 'Endereço de Entrega'}
                        </h3>
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
                        {selectedShipping === 'pickup' ? (
                          <>
                            {selectedStore && stores.find((s: any) => s.id === selectedStore) ? (
                              <>
                                <div className="flex items-center gap-2 mb-2">
                                  <Store className="h-5 w-5 text-[#3e2626]" />
                                  <p className="font-semibold text-lg">
                                    {stores.find((s: any) => s.id === selectedStore)?.name}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {stores.find((s: any) => s.id === selectedStore)?.address}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {stores.find((s: any) => s.id === selectedStore)?.neighborhood && 
                                    `${stores.find((s: any) => s.id === selectedStore)?.neighborhood}, `}
                                  {stores.find((s: any) => s.id === selectedStore)?.city} - {stores.find((s: any) => s.id === selectedStore)?.state}
                                </p>
                                {stores.find((s: any) => s.id === selectedStore)?.zipCode && (
                                  <p className="text-sm text-gray-600">
                                    CEP: {stores.find((s: any) => s.id === selectedStore)?.zipCode}
                                  </p>
                                )}
                                {stores.find((s: any) => s.id === selectedStore)?.phone && (
                                  <p className="text-sm text-gray-600">
                                    Telefone: {stores.find((s: any) => s.id === selectedStore)?.phone}
                                  </p>
                                )}
                                <p className="text-sm text-[#3e2626] font-semibold mt-2">
                                  Retire seu pedido nesta loja
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-red-500">Nenhuma loja selecionada</p>
                            )}
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
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
                          {selectedPaymentMethod === 'card' ? 'Cartão de Crédito' : 'PIX'}
                        </p>
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
                    <span className="text-gray-600">
                      {selectedShipping === 'pickup' ? 'Retirada na Loja' : 'Frete'}
                    </span>
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
                  {(() => {
                    const imageUrl = item.product.imageUrls && item.product.imageUrls.length > 0 
                      ? item.product.imageUrls[0] 
                      : item.product.imageUrl;
                    return imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Erro ao carregar imagem:', imageUrl);
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3e2626] to-[#5a3a3a]">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                    );
                  })()}
                  <div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3e2626] to-[#5a3a3a]">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-[#1f2937] truncate pr-2">{item.product.name}</h4>
                    <div className="text-sm text-gray-500 whitespace-nowrap">
                      {(() => {
                        const originalPrice = Number(item.product.price);
                        const currentPrice = getCurrentPrice(item.product);
                        const hasDiscount = currentPrice < originalPrice;
                        
                        return (
                          <div className="flex flex-col items-end">
                            <span>R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            {hasDiscount && (
                              <span className="text-xs line-through">
                                R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
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
                    <div className="text-sm text-gray-500">
                      {(() => {
                        const originalPrice = Number(item.product.price);
                        const currentPrice = getCurrentPrice(item.product);
                        const quantity = item.quantity || 1;
                        const itemTotal = currentPrice * quantity;
                        const originalTotal = originalPrice * quantity;
                        const hasDiscount = currentPrice < originalPrice;
                        
                        return (
                          <div className="flex flex-col">
                            <span>Subtotal: R$ {itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            {hasDiscount && (
                              <span className="text-xs line-through">
                                R$ {originalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2 flex items-center justify-between">
              <div className="text-sm text-gray-600">Total de itens: {totalCheckoutQuantity}</div>
              <div className="text-base font-semibold text-[#3e2626]">
                Total: R$ {checkoutItems.reduce((sum, it) => {
                  const currentPrice = getCurrentPrice(it.product);
                  return sum + currentPrice * (it.quantity || 1);
                }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  {(() => {
                    if (!quickViewProduct) return 'R$ 0,00';
                    const originalPrice = Number(quickViewProduct.price);
                    const currentPrice = getCurrentPrice(quickViewProduct);
                    const hasDiscount = currentPrice < originalPrice;
                    
                    return (
                      <div className="flex flex-col">
                        <span>R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        {hasDiscount && (
                          <span className="text-sm text-gray-500 line-through">
                            R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    );
                  })()}
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