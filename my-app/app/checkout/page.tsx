'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
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
  ArrowRight,
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
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingCart,
  DollarSign,
  Headphones,
  Store,
  Upload,
  Camera,
  RotateCw,
  ZoomIn,
  Sparkles,
  Download,
  CheckCircle2,
  Calendar,
  Users
} from 'lucide-react';
import { customerAPI, authAPI, storesAPI, shippingAPI } from '@/lib/api';
import { env } from '@/lib/env';
import { showAlert, showConfirm } from '@/lib/alerts';

import { Loader } from '@/components/ui/ai/loader';import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CouponCard from '@/components/CouponCard';

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

// Funções de validação - CPF simplificado (apenas formato básico)
const validateCPF = (cpf: string): boolean => {
  if (!cpf || !cpf.trim()) return false; // CPF vazio é inválido
  
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Validar apenas formato básico (11 dígitos)
  if (cleanCPF.length !== 11) return false;
  
  // Validar se não são todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Aceita qualquer CPF com 11 dígitos e não todos iguais
  // (validação de dígitos verificadores removida para evitar falsos positivos)
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
  const { cart, user, isAuthenticated, token, clearCart } = useAppStore();
  
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
  const [appliedCoupon, setAppliedCoupon] = useState<{ 
    code: string; 
    discount: number; 
    couponType?: string;
    applicableTo?: string;
    storeId?: string;
    categoryId?: string;
    productId?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [customerCoupons, setCustomerCoupons] = useState<any[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [productNames, setProductNames] = useState<Record<string, string>>({});

  // Opções de entrega
  const [selectedShipping, setSelectedShipping] = useState<'standard' | 'express' | 'pickup'>('standard');
  const [shippingInsurance, setShippingInsurance] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [storesWithDistance, setStoresWithDistance] = useState<any[]>([]);

  // Cálculo de frete manual (backend - sem API dos Correios)
  const [shippingMode, setShippingMode] = useState<'combined' | 'separate'>('separate');
  const [shippingQuoteStandard, setShippingQuoteStandard] = useState<any | null>(null);
  const [shippingQuoteExpress, setShippingQuoteExpress] = useState<any | null>(null);
  const [isLoadingShippingQuote, setIsLoadingShippingQuote] = useState(false);

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

  // Estados para visualização com IA
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [placedItems, setPlacedItems] = useState<Array<{
    id: string;
    productId: string;
    name: string;
    image: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scale: number;
    isSelected: boolean;
  }>>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any | null>(null);
  const [isSelectingPosition, setIsSelectingPosition] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Configuração do dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);
        setUploadedImageFile(file);
        setProcessedImageUrl(null);
        setPlacedItems([]);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedImageFile(file);
      setUploadedImage(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // Abrir câmera
  const handleCameraClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onDrop([file]);
      }
    };
    input.click();
  };

  // Iniciar seleção de posição
  const handleStartAddProduct = (product: any) => {
    if (!uploadedImageFile && !uploadedImage) {
      showAlert('warning', 'Por favor, faça upload de uma imagem do ambiente primeiro');
      return;
    }
    
    setPendingProduct(product);
    setIsSelectingPosition(true);
    setSelectedPosition(null);
  };

  // Cancelar seleção de posição
  const handleCancelPositionSelection = () => {
    setPendingProduct(null);
    setIsSelectingPosition(false);
    setSelectedPosition(null);
  };

  // Click na imagem para selecionar posição
  const handleImageClickForPosition = (e: React.MouseEvent) => {
    if (!isSelectingPosition || !pendingProduct || !imageRef.current || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();
    
    const imgOffsetX = imgRect.left - canvasRect.left;
    const imgOffsetY = imgRect.top - canvasRect.top;
    
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    if (mouseX >= imgOffsetX && mouseX <= imgOffsetX + imgRect.width &&
        mouseY >= imgOffsetY && mouseY <= imgOffsetY + imgRect.height) {
      const position = {
        x: mouseX - 75,
        y: mouseY - 75,
      };
      setSelectedPosition(position);
      handleAddProductToImage(pendingProduct, position);
    }
  };

  // Click no canvas para deselecionar
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isSelectingPosition) {
      handleImageClickForPosition(e);
      return;
    }
    setSelectedItem(null);
    setPlacedItems(prev => prev.map(item => ({ ...item, isSelected: false })));
  };

  // Adicionar produto à imagem
  const handleAddProductToImage = async (product: any, position?: { x: number; y: number }) => {
    if (!uploadedImageFile && !uploadedImage) {
      showAlert('warning', 'Por favor, faça upload de uma imagem do ambiente primeiro');
      return;
    }

    try {
      setIsProcessingAI(true);
      setIsSelectingPosition(false);

      const calculatePosition = (): { x: number; y: number } => {
        if (position) return position;
        if (!imageRef.current || !canvasRef.current) {
          return { x: 200, y: 200 };
        }
        const imgRect = imageRef.current.getBoundingClientRect();
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const imgOffsetX = imgRect.left - canvasRect.left;
        const imgOffsetY = imgRect.top - canvasRect.top;
        const centerX = imgOffsetX + imgRect.width / 2 - 75;
        const centerY = imgOffsetY + imgRect.height / 2 - 75;
        return {
          x: Math.max(imgOffsetX, centerX),
          y: Math.max(imgOffsetY, centerY),
        };
      };

      const pos = calculatePosition();
      const productImageUrl = product.imageUrls?.[0] || product.imageUrl;

      // Preparar arquivos
      const productFiles: File[] = [];
      if (productImageUrl) {
        try {
          const response = await fetch(productImageUrl);
          const blob = await response.blob();
          const productFile = new File([blob], `product-${product.id}.jpg`, { type: 'image/jpeg' });
          productFiles.push(productFile);
        } catch (err) {
          console.error('Erro ao carregar imagem do produto:', err);
        }
      }

      let environmentFile: File = uploadedImageFile!;
      if (processedImageUrl && processedImageUrl.startsWith('http')) {
        try {
          const response = await fetch(processedImageUrl);
          if (response.ok) {
            const blob = await response.blob();
            environmentFile = new File([blob], 'environment-processed.jpg', { type: 'image/jpeg' });
          }
        } catch {
          // Usar arquivo original se falhar
        }
      } else if (uploadedImage && uploadedImage.startsWith('data:image')) {
        try {
          const response = await fetch(uploadedImage);
          const blob = await response.blob();
          environmentFile = new File([blob], 'environment.jpg', { type: blob.type || 'image/jpeg' });
        } catch {
          // Usar arquivo original se falhar
        }
      }

      const prompt = `Adicione o produto "${product.name}" nesta imagem do ambiente. O produto deve estar perfeitamente integrado ao ambiente, com iluminação, sombras e perspectiva realistas. O produto deve parecer fotografado no local.`;

      const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
      const formData = new FormData();
      formData.append('images', environmentFile);
      if (productFiles.length > 0) {
        productFiles.forEach(file => formData.append('productImages', file));
      }
      formData.append('prompt', prompt);
      formData.append('outputFormat', 'jpg');

      const response = await fetch(`${apiBaseUrl}/public/ai/process-upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao processar imagem' }));
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      const result = await response.json();
      const processedUrl = result.processedImageUrl || result.imageUrl;

      if (processedUrl) {
        setProcessedImageUrl(processedUrl);
        const newItem = {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          image: productImageUrl || '',
          x: pos.x,
          y: pos.y,
          width: 150,
          height: 150,
          rotation: 0,
          scale: 1,
          isSelected: false,
        };
        setPlacedItems(prev => [...prev, newItem]);
        setPendingProduct(null);
        setSelectedPosition(null);
        showAlert('success', 'Produto adicionado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao adicionar produto:', error);
      showAlert('error', error.message || 'Erro ao processar imagem com IA');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Função para obter o preço atual com desconto (se houver oferta relâmpago configurada)
  const getCurrentPrice = (product: any): number => {
    const originalPrice = Number(product.price);
    const now = new Date();

    // Prioridade para oferta relâmpago - verificar se está realmente ativa
    if (product.isFlashSale && product.flashSaleStartDate && product.flashSaleEndDate) {
      try {
        const flashStart = new Date(product.flashSaleStartDate);
        const flashEnd = new Date(product.flashSaleEndDate);
        
        // Verificar se a oferta relâmpago está ativa (já começou e ainda não expirou)
        if (now >= flashStart && now <= flashEnd) {
          // Se tem flashSalePrice, usar ele
          if (product.flashSalePrice !== undefined && product.flashSalePrice !== null) {
            return Number(product.flashSalePrice);
          }
          // Se não tem flashSalePrice mas tem flashSaleDiscountPercent, calcular
          if (product.flashSaleDiscountPercent !== undefined && product.flashSaleDiscountPercent !== null && originalPrice) {
            const discount = (originalPrice * Number(product.flashSaleDiscountPercent)) / 100;
            return originalPrice - discount;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar oferta relâmpago:', error);
        // Continuar com outras verificações se houver erro
      }
    }
    
    // Depois verificar oferta normal - apenas se estiver ativa
    if (product.isOnSale && product.saleStartDate && product.saleEndDate) {
      try {
        const saleStart = new Date(product.saleStartDate);
        const saleEnd = new Date(product.saleEndDate);
        
        if (now >= saleStart && now <= saleEnd) {
          // Se tem salePrice, usar ele
          if (product.salePrice !== undefined && product.salePrice !== null) {
            return Number(product.salePrice);
          }
          // Se não tem salePrice mas tem saleDiscountPercent, calcular
          if (product.saleDiscountPercent !== undefined && product.saleDiscountPercent !== null && originalPrice) {
            const discount = (originalPrice * Number(product.saleDiscountPercent)) / 100;
            return originalPrice - discount;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar oferta normal:', error);
        // Continuar com preço original se houver erro
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

  // Função para identificar produtos elegíveis para um cupom
  const getEligibleItems = useCallback((coupon: { applicableTo?: string; storeId?: string; categoryId?: string; productId?: string }) => {
    if (!coupon.applicableTo || coupon.applicableTo === 'ALL') {
      // Cupom para todos os produtos
      return checkoutItems;
    }

    const eligibleItems: typeof checkoutItems = [];

    checkoutItems.forEach(item => {
      const product = item.product;
      let isEligible = false;

      switch (coupon.applicableTo) {
        case 'STORE':
          if (coupon.storeId) {
            const couponStoreId = String(coupon.storeId).trim();
            const productStoreId = product?.storeId ? String(product.storeId).trim() : undefined;
            const currentStoreId = selectedStore ? String(selectedStore).trim() : productStoreId;
            isEligible = currentStoreId === couponStoreId;
          }
          break;

        case 'CATEGORY':
          if (coupon.categoryId) {
            const couponCategoryId = String(coupon.categoryId).trim().toUpperCase();
            const productCategory = product?.category ? String(product.category).trim().toUpperCase() : undefined;
            isEligible = productCategory === couponCategoryId;
          }
          break;

        case 'PRODUCT':
          if (coupon.productId) {
            const couponProductId = String(coupon.productId).trim();
            const productId = product?.id ? String(product.id).trim() : undefined;
            isEligible = productId === couponProductId;
          }
          break;

        default:
          isEligible = true;
      }

      if (isEligible) {
        eligibleItems.push(item);
      }
    });

    return eligibleItems;
  }, [checkoutItems, selectedStore]);

  // Função para calcular subtotal apenas dos produtos elegíveis
  const calculateEligibleSubtotal = useCallback((coupon: { applicableTo?: string; storeId?: string; categoryId?: string; productId?: string }) => {
    const eligibleItems = getEligibleItems(coupon);
    return eligibleItems.reduce((total, item) => {
      const currentPrice = getCurrentPrice(item.product);
      return total + (currentPrice * item.quantity);
    }, 0);
  }, [getEligibleItems]);

  const shippingCost = useMemo(() => {
    // Retirada na loja é sempre grátis
    if (selectedShipping === 'pickup') return 0;
    
    // Escolher a cotação baseada no tipo de serviço selecionado
    const quote = selectedShipping === 'express' ? shippingQuoteExpress : shippingQuoteStandard;
    
    // Se houver cotação de frete, usar valor conforme modo escolhido
    if (quote) {
      if (shippingMode === 'combined' && quote.combined?.finalPrice) {
        return quote.combined.finalPrice;
      }
      if (shippingMode === 'separate' && quote.separate?.totalPrice) {
        return quote.separate.totalPrice;
      }
    }

    // Se não houver cotação, calcular um valor estimado baseado no peso e distância
    // Isso não deve acontecer normalmente, mas serve como fallback de segurança
    if (!quote) {
      // Calcular estimativa básica: R$ 10 base + R$ 2 por kg estimado
      const estimatedWeight = checkoutItems.reduce((total, item) => {
        // Assumir 0.5kg por produto se não tiver peso
        return total + (item.quantity * 0.5);
      }, 0);
      const basePrice = selectedShipping === 'express' ? 20.00 : 10.00;
      const weightPrice = estimatedWeight * (selectedShipping === 'express' ? 5.00 : 2.50);
      return Math.round((basePrice + weightPrice) * 100) / 100;
    }
    
    // Se chegou aqui, há cotação mas não encontrou preço válido - retornar 0 para forçar recálculo
    return 0;
  }, [subtotal, selectedShipping, shippingQuoteStandard, shippingQuoteExpress, shippingMode]);

  // Seguro de envio: 2% do valor da compra (apenas para entregas)
  const insuranceCost = shippingInsurance && selectedShipping !== 'pickup' 
    ? Math.round((subtotal * 0.02) * 100) / 100 
    : 0;
  const tax = subtotal * 0.1; // 10% de impostos estimados
  
  // Calcular desconto: se for cupom de frete, aplicar apenas ao frete
  const isShippingCoupon = appliedCoupon?.couponType === 'SHIPPING';
  const shippingDiscount = isShippingCoupon ? Math.min(appliedCoupon?.discount || 0, shippingCost) : 0;
  const productDiscount = !isShippingCoupon ? (appliedCoupon?.discount || 0) : 0;
  const finalShippingCost = Math.max(0, shippingCost - shippingDiscount);
  
  const total = subtotal + finalShippingCost + insuranceCost + tax - productDiscount;

    // Prazo estimado de entrega baseado na cotação de frete
  const shippingDeadlineDays = useMemo(() => {
    if (selectedShipping === 'pickup') return null;
    
    // Escolher a cotação baseada no tipo de serviço selecionado
    const quote = selectedShipping === 'express' ? shippingQuoteExpress : shippingQuoteStandard;
    if (!quote) return null;

    if (shippingMode === 'combined' && quote.combined?.deadlineDays) {
      return quote.combined.deadlineDays as number;
    }

    if (quote.separate?.maxDeadlineDays) {
      return quote.separate.maxDeadlineDays as number;
    }

    return null;
  }, [shippingQuoteStandard, shippingQuoteExpress, shippingMode, selectedShipping]);

  // Buscar cotação de frete via backend (cálculo manual) quando endereço e itens estiverem prontos
  useEffect(() => {
    const hasDestination =
      shippingAddress.zipCode &&
      shippingAddress.zipCode.replace(/\D/g, '').length === 8;

    if (!hasDestination || checkoutItems.length === 0) {
      setShippingQuoteStandard(null);
      setShippingQuoteExpress(null);
      return;
    }

    // Identificar lojas distintas considerando storeId direto e storeInventory
    const distinctStores = new Set<string>();
    checkoutItems.forEach((item) => {
      let storeId: string | null = null;
      
      // Prioridade 1: Se tiver storeId direto com informações completas, usar ele
      if (item.product.storeId && item.product.storeId !== 'unknown' && item.product.storeId !== '') {
        // Verificar se tem informações da loja (store.name ou storeInventory)
        if (item.product.store?.name || (item.product.storeInventory && item.product.storeInventory.length > 0)) {
          storeId = item.product.storeId;
          distinctStores.add(storeId);
          console.log(`📦 Produto ${item.product.id}: usando storeId direto ${storeId}`);
        }
      }
      
      // Prioridade 2: Se não tiver storeId válido, usar storeInventory
      if (!storeId && item.product.storeInventory && Array.isArray(item.product.storeInventory) && item.product.storeInventory.length > 0) {
        console.log(`📦 Produto ${item.product.id}: tem ${item.product.storeInventory.length} lojas no storeInventory`);
        
        // Buscar loja com estoque suficiente e ativa
        const availableStore = item.product.storeInventory
          .find((inv: any) => inv.store?.isActive && inv.quantity >= item.quantity && inv.store?.zipCode);
        
        if (availableStore) {
          storeId = availableStore.storeId;
          distinctStores.add(storeId);
          console.log(`📦 Produto ${item.product.id}: usando loja ${storeId} (${availableStore.store?.name}) do storeInventory com estoque`);
        } else {
          // Se nenhuma tem estoque suficiente, usar a primeira loja ativa com CEP
          const firstActive = item.product.storeInventory.find((inv: any) => inv.store?.isActive && inv.store?.zipCode);
          if (firstActive) {
            storeId = firstActive.storeId;
            distinctStores.add(storeId);
            console.log(`📦 Produto ${item.product.id}: usando primeira loja ativa ${storeId} (${firstActive.store?.name}) do storeInventory`);
          } else {
            // Último recurso: qualquer loja com CEP
            const anyStore = item.product.storeInventory.find((inv: any) => inv.store?.zipCode);
            if (anyStore) {
              storeId = anyStore.storeId;
              distinctStores.add(storeId);
              console.log(`📦 Produto ${item.product.id}: usando loja ${storeId} (${anyStore.store?.name}) do storeInventory (qualquer loja com CEP)`);
            }
          }
        }
      }
      
      // Se ainda não encontrou loja, avisar
      if (!storeId) {
        console.warn(`⚠️ Produto ${item.product.id}: sem loja válida identificada (storeId=${item.product.storeId}, storeInventory=${item.product.storeInventory?.length || 0})`);
      }
    });
    
    console.log(`🏪 Lojas distintas identificadas: ${Array.from(distinctStores).join(', ')}`);

    const mode: 'combined' | 'separate' | 'both' =
      distinctStores.length > 1 ? 'both' : 'separate';

    const itemsPayload = checkoutItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    const fetchQuotes = async () => {
      // Validar se há itens no carrinho
      if (!checkoutItems || checkoutItems.length === 0) {
        console.warn('⚠️ Nenhum item no carrinho para calcular frete');
        setIsLoadingShippingQuote(false);
        return;
      }

      // Validar se o CEP está preenchido
      if (!shippingAddress.zipCode || shippingAddress.zipCode.replace(/\D/g, '').length !== 8) {
        console.warn('⚠️ CEP inválido ou não preenchido');
        setIsLoadingShippingQuote(false);
        return;
      }

      // Verificar se todos os produtos têm loja identificada
      const productsWithoutStore = checkoutItems.filter(item => {
        const hasStoreId = item.product.storeId && item.product.storeId !== 'unknown' && item.product.storeId !== '';
        const hasStoreInventory = item.product.storeInventory && Array.isArray(item.product.storeInventory) && item.product.storeInventory.length > 0;
        return !hasStoreId && !hasStoreInventory;
      });

      if (productsWithoutStore.length > 0) {
        console.warn('⚠️ Alguns produtos não têm loja identificada:', productsWithoutStore.map(item => item.product.id));
        showAlert('warning', 'Alguns produtos não têm loja associada. O cálculo de frete pode não estar disponível.');
      }

      setIsLoadingShippingQuote(true);
      try {
        // Validar payload antes de enviar
        const cleanZipCode = shippingAddress.zipCode.replace(/\D/g, '');
        if (cleanZipCode.length !== 8) {
          throw new Error('CEP inválido. Deve conter 8 dígitos.');
        }

        // Verificar se há produtos válidos
        if (itemsPayload.length === 0) {
          throw new Error('Nenhum produto no carrinho para calcular frete.');
        }

        // Verificar se todos os produtos têm ID válido
        const invalidProducts = itemsPayload.filter(item => !item.productId || item.quantity <= 0);
        if (invalidProducts.length > 0) {
          console.warn('⚠️ Produtos inválidos no payload:', invalidProducts);
        }

        const payloadStandard = {
          destinationZipCode: cleanZipCode,
          destinationCity: shippingAddress.city,
          destinationState: shippingAddress.state,
          mode,
          serviceType: 'standard' as const,
          items: itemsPayload,
        };

        const payloadExpress = {
          destinationZipCode: cleanZipCode,
          destinationCity: shippingAddress.city,
          destinationState: shippingAddress.state,
          mode,
          serviceType: 'express' as const,
          items: itemsPayload,
        };

        console.log('📦 Calculando cotações de frete:', {
          cep: cleanZipCode,
          cidade: shippingAddress.city,
          estado: shippingAddress.state,
          mode,
          itemsCount: itemsPayload.length,
          items: itemsPayload,
          distinctStores: Array.from(distinctStores),
          payloadStandard: JSON.stringify(payloadStandard, null, 2),
          payloadExpress: JSON.stringify(payloadExpress, null, 2),
        });

        // Calcular ambos os tipos de serviço em paralelo
        // Se um falhar, o outro ainda pode funcionar
        const [quoteStandardResult, quoteExpressResult] = await Promise.allSettled([
          shippingAPI.calculateQuote(payloadStandard),
          shippingAPI.calculateQuote(payloadExpress),
        ]);

        // Processar resultado do STANDARD
        let quoteStandard: any = null;
        if (quoteStandardResult.status === 'fulfilled') {
          quoteStandard = quoteStandardResult.value;
        } else {
          const reason = quoteStandardResult.reason;
          const errorDetails = {
            error: reason,
            errorType: reason?.constructor?.name,
            response: reason?.response,
            status: reason?.response?.status,
            statusText: reason?.response?.statusText,
            data: reason?.response?.data,
            message: reason?.message || reason?.response?.data?.message || reason?.response?.data?.error,
            stack: reason?.stack,
            config: reason?.config,
            request: {
              url: reason?.config?.url,
              method: reason?.config?.method,
              data: reason?.config?.data,
            },
          };
          console.error('❌ Erro ao calcular frete STANDARD:', errorDetails);
          
          // Log mais detalhado se houver dados de resposta
          if (reason?.response?.data) {
            console.error('📋 Detalhes da resposta do servidor:', JSON.stringify(reason.response.data, null, 2));
          }
        }

        // Processar resultado do EXPRESS
        let quoteExpress: any = null;
        if (quoteExpressResult.status === 'fulfilled') {
          quoteExpress = quoteExpressResult.value;
        } else {
          const reason = quoteExpressResult.reason;
          const errorDetails = {
            error: reason,
            errorType: reason?.constructor?.name,
            response: reason?.response,
            status: reason?.response?.status,
            statusText: reason?.response?.statusText,
            data: reason?.response?.data,
            message: reason?.message || reason?.response?.data?.message || reason?.response?.data?.error,
            stack: reason?.stack,
            config: reason?.config,
            request: {
              url: reason?.config?.url,
              method: reason?.config?.method,
              data: reason?.config?.data,
            },
          };
          console.error('❌ Erro ao calcular frete EXPRESS:', errorDetails);
          
          // Log mais detalhado se houver dados de resposta
          if (reason?.response?.data) {
            console.error('📋 Detalhes da resposta do servidor:', JSON.stringify(reason.response.data, null, 2));
          }
        }

        // Se ambos falharam, lançar erro
        if (!quoteStandard && !quoteExpress) {
          const lastError = quoteStandardResult.status === 'rejected' 
            ? quoteStandardResult.reason 
            : quoteExpressResult.reason;
          throw lastError || new Error('Não foi possível calcular frete para nenhum serviço');
        }

        console.log('📦 Cotações recebidas:', {
          standard: {
            hasSeparate: !!quoteStandard.separate,
            separateGroups: quoteStandard.separate?.groups?.length || 0,
            separateTotal: quoteStandard.separate?.totalPrice,
            hasCombined: !!quoteStandard.combined,
            combinedPrice: quoteStandard.combined?.finalPrice,
          },
          express: {
            hasSeparate: !!quoteExpress.separate,
            separateGroups: quoteExpress.separate?.groups?.length || 0,
            separateTotal: quoteExpress.separate?.totalPrice,
            hasCombined: !!quoteExpress.combined,
            combinedPrice: quoteExpress.combined?.finalPrice,
          },
        });

        setShippingQuoteStandard(quoteStandard);
        setShippingQuoteExpress(quoteExpress);

        // Ajustar modo padrão dependendo se existe opção combinada
        if (mode === 'both' && quoteStandard.combined) {
          setShippingMode('separate'); // começa em separado, cliente pode mudar
        } else {
          setShippingMode('separate');
        }
      } catch (error: any) {
        // Extrair informações detalhadas do erro
        const errorStatus = error?.response?.status;
        const errorData = error?.response?.data;
        const errorMessage = error?.message;
        const errorResponseMessage = errorData?.message || errorData?.error || errorData?.mensagem;
        
        console.error('❌ Erro ao calcular frete:', {
          status: errorStatus,
          statusText: error?.response?.statusText,
          message: errorResponseMessage || errorMessage,
          data: errorData,
          error: errorMessage,
          stack: error?.stack,
          config: {
            url: error?.config?.url,
            method: error?.config?.method,
            data: error?.config?.data,
          },
        });
        
        // Extrair mensagem de erro mais detalhada para o usuário
        let userMessage = 'Não foi possível calcular o frete no momento';
        
        if (errorStatus === 500) {
          // Erro interno do servidor
          if (errorResponseMessage) {
            if (errorResponseMessage.includes('loja') || errorResponseMessage.includes('CEP')) {
              userMessage = 'Erro ao calcular frete: alguns produtos podem não ter loja ou CEP configurado.';
            } else {
              userMessage = `Erro no servidor: ${errorResponseMessage}`;
            }
          } else {
            userMessage = 'Erro interno ao calcular frete. Verifique se todos os produtos têm loja associada e tente novamente.';
          }
        } else if (errorStatus === 400) {
          // Erro de validação
          userMessage = errorResponseMessage || 'Dados inválidos para cálculo de frete. Verifique o CEP e os produtos.';
        } else if (errorStatus === 401 || errorStatus === 403) {
          userMessage = 'Não autorizado para calcular frete. Faça login novamente.';
        } else if (errorMessage) {
          userMessage = errorMessage;
        }
        
        // Mostrar alerta ao usuário apenas se não for erro de validação (400)
        // Erros 400 geralmente são problemas de dados que o usuário pode corrigir
        if (errorStatus !== 400) {
          showAlert('warning', userMessage);
        } else {
          // Para erros 400, logar mas não mostrar alerta (pode ser muito frequente)
          console.warn('⚠️ Erro de validação no cálculo de frete:', errorResponseMessage);
        }
        
        // Não bloquear o checkout: manter fallback fixo
        setShippingQuoteStandard(null);
        setShippingQuoteExpress(null);
      } finally {
        setIsLoadingShippingQuote(false);
      }
    };

    fetchQuotes();
  }, [shippingAddress.zipCode, shippingAddress.city, shippingAddress.state, checkoutItems]);


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
          // Tratar diferentes tipos de erro de geolocalização
          let errorMessage = 'Não foi possível obter sua localização';
          if (error.code === 1) {
            errorMessage = 'Permissão de localização negada';
          } else if (error.code === 2) {
            errorMessage = 'Localização indisponível';
          } else if (error.code === 3) {
            errorMessage = 'Tempo de espera esgotado';
          }
          
          console.warn('Erro ao obter localização:', errorMessage, error);
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
            }).catch(() => {
              // Silenciosamente falhar se geocodificação também falhar
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
        
        // Usar endpoint público para buscar lojas (não requer autenticação)
        let storesData = [];
        try {
          const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
          const response = await fetch(`${apiBaseUrl}/public/support/stores`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (response.ok) {
            const data = await response.json();
            storesData = data.stores || data || [];
          } else {
            console.warn('⚠️ Erro ao buscar lojas do endpoint público, tentando endpoint autenticado...');
            // Fallback: tentar endpoint autenticado se disponível
            if (isAuthenticated && token) {
              storesData = await storesAPI.getAll();
            }
          }
        } catch (error) {
          console.error('❌ Erro ao buscar lojas:', error);
          // Fallback: tentar endpoint autenticado se disponível
          if (isAuthenticated && token) {
            try {
              storesData = await storesAPI.getAll();
            } catch (fallbackError) {
              console.error('❌ Erro no fallback:', fallbackError);
            }
          }
        }
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
        
        // Filtrar lojas que têm os produtos do checkout (com estoque)
        if (checkoutItems.length > 0) {
          // Extrair todos os storeIds únicos dos produtos no carrinho
          // Agora os produtos podem ter stockByStore ou storeId direto
          const productStoreIds = new Set<string>();
          checkoutItems.forEach((item: any) => {
            const product = item.product;
            
            // Verificar se o produto tem stockByStore (novo formato)
            if (product?.stockByStore && Array.isArray(product.stockByStore)) {
              product.stockByStore.forEach((storeStock: any) => {
                if (storeStock.quantity > 0) {
                  productStoreIds.add(storeStock.storeId);
                }
              });
            }
            
            // Fallback: verificar storeId direto (formato antigo)
            const productStoreId = product?.storeId || (product as any)?.store?.id || (product as any)?.storeId;
            if (productStoreId) {
              productStoreIds.add(productStoreId);
            }
          });
          
          console.log(`🛍️ StoreIds dos produtos no carrinho:`, Array.from(productStoreIds));
          console.log(`🛍️ Produtos no carrinho:`, checkoutItems.map((item: any) => ({
            productId: item.product?.id,
            productName: item.product?.name,
            storeId: item.product?.storeId || (item.product as any)?.store?.id || (item.product as any)?.storeId,
            stockByStore: item.product?.stockByStore
          })));
          
          // Se encontrou lojas com produtos, filtrar apenas essas
          if (productStoreIds.size > 0) {
            const storesWithProducts = availableStores.filter((store: any) => {
              return productStoreIds.has(store.id);
            });
            
            console.log(`🛍️ Lojas com produtos do carrinho: ${storesWithProducts.length}`);
            
            if (storesWithProducts.length > 0) {
              availableStores = storesWithProducts;
            } else {
              // Se nenhuma loja tem os produtos, mostrar todas as lojas disponíveis (pode ter estoque em outras lojas)
              console.warn('⚠️ Nenhuma loja encontrada com os produtos do carrinho, mostrando todas as lojas disponíveis');
            }
          } else {
            // Se não encontrou storeIds, mostrar todas as lojas disponíveis
            console.log('ℹ️ Não foi possível identificar lojas específicas dos produtos, mostrando todas as lojas disponíveis');
          }
        }
        
        console.log(`📍 Lojas finais disponíveis: ${availableStores.length}`);
        
        // Se não há lojas, mostrar mensagem informativa
        if (availableStores.length === 0) {
          console.warn('⚠️ Nenhuma loja disponível. Possíveis causas:');
          console.warn('  1. Não há lojas cadastradas no sistema');
          console.warn('  2. Todas as lojas estão inativas (isActive: false)');
          console.warn('  3. O usuário não tem permissão para ver lojas');
          console.warn('  4. Erro na consulta ao banco de dados');
          setStores([]);
          setStoresWithDistance([]);
          setIsLoadingStores(false);
          return;
        }
        
        // Simplificar: não calcular distâncias agora (pode ser feito depois se necessário)
        // Apenas definir as lojas disponíveis
        console.log('📍 Exibindo todas as lojas ativas');
        setStoresWithDistance(availableStores.map((s: any) => ({ ...s, distance: null })));
        setStores(availableStores);
        
        // Selecionar automaticamente a primeira loja se não houver seleção
        setSelectedStore((current) => {
          if (current) return current;
          if (availableStores.length > 0) return availableStores[0].id;
          return '';
        });
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
  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) {
      setCouponError('Digite um código de cupom');
      return;
    }

    try {
      const upperCode = couponCode.toUpperCase().trim();
      
      // Para cupons de produto específico, precisamos tentar validar com cada produto do carrinho
      // Primeiro, tentar validar com todos os produtos para encontrar o que corresponde
      let validation;
      let couponInfo: any = null;
      let foundEligible = false;
      
      // Tentar validar com cada produto do carrinho
      for (const item of checkoutItems) {
        const testProduct = item.product;
        const testCategoryId = testProduct?.category ? String(testProduct.category).trim().toUpperCase() : undefined;
        const testProductId = testProduct?.id;
        
        // Garantir que o storeId seja uma string normalizada
        let normalizedStoreId = selectedStore ? String(selectedStore).trim() : undefined;
        if (!normalizedStoreId || normalizedStoreId === '') {
          if (testProduct?.storeId) {
            normalizedStoreId = String(testProduct.storeId).trim();
          } else if (stores.length > 0 && stores[0]?.id) {
            normalizedStoreId = String(stores[0].id).trim();
          }
        }
        
        try {
          const testValidation = await customerAPI.validateCoupon(
            upperCode,
            subtotal,
            testProductId,
            testCategoryId,
            normalizedStoreId,
            shippingCost
          );
          
          if (testValidation.valid && testValidation.coupon) {
            validation = testValidation;
            couponInfo = {
              applicableTo: testValidation.coupon.applicableTo || 'ALL',
              storeId: testValidation.coupon.storeId,
              categoryId: testValidation.coupon.categoryId,
              productId: testValidation.coupon.productId,
              discountType: testValidation.coupon.discountType,
              discountValue: testValidation.coupon.discountValue,
              couponType: testValidation.coupon.couponType,
              minimumPurchase: testValidation.coupon.minimumPurchase,
              maximumDiscount: testValidation.coupon.maximumDiscount,
            };
            foundEligible = true;
            break;
          }
        } catch (e: any) {
          // Se o erro não for sobre produto/loja/categoria, pode ser outro problema
          const errorMsg = e.response?.data?.message || e.message || '';
          // Se for erro de produto/loja/categoria, continuar tentando
          // Se for outro erro (expirado, inativo, etc), parar e mostrar erro
          if (!errorMsg.includes('produto') && !errorMsg.includes('loja') && !errorMsg.includes('categoria') && !errorMsg.includes('Categoria')) {
            // Erro não relacionado a produto/loja/categoria, pode ser cupom inválido
            throw e;
          }
          // Continuar tentando com próximo produto
          continue;
        }
      }
      
      if (!foundEligible) {
        // Tentar uma última vez sem productId para ver se é cupom geral
        try {
          const firstProduct = checkoutItems[0]?.product;
          const categoryId = firstProduct?.category ? String(firstProduct.category).trim().toUpperCase() : undefined;
          let normalizedStoreId = selectedStore ? String(selectedStore).trim() : undefined;
          
          if (!normalizedStoreId || normalizedStoreId === '') {
            if (firstProduct?.storeId) {
              normalizedStoreId = String(firstProduct.storeId).trim();
            } else if (stores.length > 0 && stores[0]?.id) {
              normalizedStoreId = String(stores[0].id).trim();
            }
          }
          
          validation = await customerAPI.validateCoupon(
            upperCode,
            subtotal,
            undefined, // Sem productId para cupons gerais
            categoryId,
            normalizedStoreId,
            shippingCost
          );
          
          if (validation.valid && validation.coupon) {
            couponInfo = {
              applicableTo: validation.coupon.applicableTo || 'ALL',
              storeId: validation.coupon.storeId,
              categoryId: validation.coupon.categoryId,
              productId: validation.coupon.productId,
              discountType: validation.coupon.discountType,
              discountValue: validation.coupon.discountValue,
              couponType: validation.coupon.couponType,
              minimumPurchase: validation.coupon.minimumPurchase,
              maximumDiscount: validation.coupon.maximumDiscount,
            };
            foundEligible = true;
          }
        } catch (e) {
          // Se ainda falhar, mostrar mensagem
          setCouponError('');
          showAlert('info', 'Este cupom não é válido para os produtos no seu carrinho. Verifique se você possui produtos que atendem aos critérios do cupom.');
          return;
        }
      }
      
      if (!foundEligible) {
        setCouponError('');
        showAlert('info', 'Este cupom não é válido para os produtos no seu carrinho. Verifique se você possui produtos que atendem aos critérios do cupom.');
        return;
      }

      if (validation && validation.valid && couponInfo) {
        // Verificar se há produtos elegíveis
        const eligibleItems = getEligibleItems(couponInfo);
        
        if (eligibleItems.length === 0) {
          // Não há produtos elegíveis
          setCouponError('');
          showAlert('info', 'Este cupom não é válido para os produtos no seu carrinho. Adicione produtos que atendem aos critérios do cupom.');
          return;
        }

        // Calcular subtotal apenas dos produtos elegíveis
        const eligibleSubtotal = calculateEligibleSubtotal(couponInfo);
        
        // Verificar valor mínimo com produtos elegíveis
        if (couponInfo.minimumPurchase && eligibleSubtotal < Number(couponInfo.minimumPurchase)) {
          // Valor mínimo não atingido com produtos elegíveis
          setCouponError('');
          showAlert('info', `Este cupom requer um valor mínimo de R$ ${Number(couponInfo.minimumPurchase).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} nos produtos elegíveis.`);
          return;
        }
        
        // Recalcular desconto baseado no subtotal elegível
        let recalculatedDiscount = 0;
        
        if (couponInfo.couponType === 'SHIPPING') {
          // Para cupons de frete, usar o desconto original
          recalculatedDiscount = validation.discount;
        } else {
          // Para cupons de produto, recalcular baseado no subtotal elegível
          if (couponInfo.discountType === 'PERCENTAGE') {
            recalculatedDiscount = (eligibleSubtotal * Number(couponInfo.discountValue)) / 100;
            // Aplicar desconto máximo se houver
            if (couponInfo.maximumDiscount && recalculatedDiscount > Number(couponInfo.maximumDiscount)) {
              recalculatedDiscount = Number(couponInfo.maximumDiscount);
            }
          } else {
            recalculatedDiscount = Number(couponInfo.discountValue);
          }
          // Garantir que o desconto não seja maior que o subtotal elegível
          if (recalculatedDiscount > eligibleSubtotal) {
            recalculatedDiscount = eligibleSubtotal;
          }
        }

        // Arredondar para 2 casas decimais
        recalculatedDiscount = Math.round(recalculatedDiscount * 100) / 100;

        setAppliedCoupon({
          code: validation.coupon.code,
          discount: recalculatedDiscount,
          couponType: couponInfo.couponType,
          applicableTo: couponInfo.applicableTo,
          storeId: couponInfo.storeId,
          categoryId: couponInfo.categoryId,
          productId: couponInfo.productId,
        });
        setCouponError('');
        
        if (eligibleItems.length < checkoutItems.length) {
          showAlert('success', `Cupom ${validation.coupon.code} aplicado com sucesso! O desconto será aplicado apenas nos produtos elegíveis (${eligibleItems.length} de ${checkoutItems.length} produtos).`);
        } else {
          showAlert('success', `Cupom ${validation.coupon.code} aplicado com sucesso!`);
        }
      } else {
        // Cupom inválido - não mostrar erro, apenas não aplicar
        setCouponError('');
        showAlert('info', 'Este cupom não está disponível para este pedido. Verifique os cupons disponíveis na lista.');
      }
    } catch (error: any) {
      let errorMessage = error.response?.data?.message || error.message || 'Erro ao validar cupom';
      let friendlyMessage = '';
      const messageType: 'info' = 'info';
      
      // Tratar erros de forma mais amigável - criar mensagens informativas ao invés de erros
      if (errorMessage.includes('não é válido para esta loja') || errorMessage.includes('Loja não foi selecionada')) {
        // Extrair nome da loja se disponível
        const storeMatch = errorMessage.match(/loja com ID "([^"]+)"/);
        if (storeMatch) {
          const couponStoreId = storeMatch[1];
          const couponStore = stores.find(s => String(s.id).trim() === couponStoreId);
          const couponStoreName = couponStore?.name || 'outra loja';
          friendlyMessage = `Este cupom é válido apenas para a loja "${couponStoreName}". Verifique os cupons disponíveis para a loja selecionada.`;
        } else {
          friendlyMessage = 'Este cupom não é válido para a loja selecionada. Verifique os cupons disponíveis na lista.';
        }
      } else if (errorMessage.includes('categoria') || errorMessage.includes('Categoria')) {
        friendlyMessage = 'Este cupom não é válido para os produtos no seu carrinho. Adicione produtos da categoria correta ou escolha outro cupom.';
      } else if (errorMessage.includes('produto') || errorMessage.includes('Produto')) {
        friendlyMessage = 'Este cupom não é válido para os produtos no seu carrinho. Adicione o produto correto ou escolha outro cupom.';
      } else if (errorMessage.includes('compra mínima') || errorMessage.includes('valor mínimo')) {
        // Extrair valor mínimo se disponível
        const minMatch = errorMessage.match(/R\$\s*([\d.,]+)/i) || errorMessage.match(/(\d+)/);
        if (minMatch) {
          friendlyMessage = `Este cupom requer um valor mínimo de compra. Verifique os cupons disponíveis na lista.`;
        } else {
          friendlyMessage = 'Este cupom não atende aos requisitos mínimos. Verifique os cupons disponíveis na lista.';
        }
      } else if (errorMessage.includes('expirado') || errorMessage.includes('expirada')) {
        friendlyMessage = 'Este cupom está expirado. Verifique os cupons disponíveis na lista.';
      } else if (errorMessage.includes('não encontrado') || errorMessage.includes('não existe')) {
        friendlyMessage = 'Cupom não encontrado. Verifique o código digitado ou consulte os cupons disponíveis na lista.';
      } else {
        friendlyMessage = 'Este cupom não está disponível para este pedido. Verifique os cupons disponíveis na lista.';
      }
      
      // Não mostrar erro vermelho, apenas mensagem informativa
      setCouponError('');
      showAlert(messageType, friendlyMessage);
    }
  };

  // Remover cupom
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Buscar cupons atribuídos ao cliente
  const fetchCustomerCoupons = async () => {
    setIsLoadingCoupons(true);
    try {
      const token = useAppStore.getState().token;
      const user = useAppStore.getState().user;
      
      // Construir URL corretamente (API_URL já contém /api)
      const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
      const couponsUrl = `${apiBaseUrl}/customer/coupons`;

      console.log('🔍 Buscando cupons do cliente...', {
        hasToken: !!token,
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
        apiUrl: couponsUrl
      });

      if (!token) {
        console.warn('⚠️ Token não encontrado, não é possível buscar cupons');
        setCustomerCoupons([]);
        setIsLoadingCoupons(false);
        return;
      }

      // Tentar buscar cupons atribuídos ao cliente via API
      try {
        const response = await fetch(couponsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('📡 Resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📦 Dados brutos recebidos:', data);
          
          // Tentar extrair cupons de diferentes formatos possíveis
          let coupons = [];
          if (Array.isArray(data)) {
            coupons = data;
          } else if (data.coupons && Array.isArray(data.coupons)) {
            coupons = data.coupons;
          } else if (data.data && Array.isArray(data.data)) {
            coupons = data.data;
          } else {
            coupons = [];
          }
          
          console.log('📋 Cupons processados:', coupons.length, coupons);
          setCustomerCoupons(coupons);
          
          // Buscar nomes dos produtos para cupons de produto específico
          const productIdsToFetch = coupons
            .filter((c: any) => c.applicableTo === 'PRODUCT' && c.productId && !c.product?.name)
            .map((c: any) => String(c.productId).trim())
            .filter((id: string, index: number, self: string[]) => self.indexOf(id) === index); // remover duplicados
          
          if (productIdsToFetch.length > 0) {
            // Buscar produtos em paralelo
            Promise.all(
              productIdsToFetch.map(async (productId: string) => {
                try {
                  const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
                  const response = await fetch(`${apiBaseUrl}/public/products/${productId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  
                  if (response.ok) {
                    const product = await response.json();
                    if (product?.name) {
                      return { productId, name: product.name };
                    }
                  }
                } catch (error) {
                  console.warn(`Erro ao buscar produto ${productId}:`, error);
                }
                return null;
              })
            ).then(results => {
              const names: Record<string, string> = {};
              results.forEach(result => {
                if (result) {
                  names[result.productId] = result.name;
                }
              });
              if (Object.keys(names).length > 0) {
                setProductNames(prev => ({ ...prev, ...names }));
              }
            });
          }
        } else {
          const errorText = await response.text();
          console.warn('⚠️ Erro ao buscar cupons:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          setCustomerCoupons([]);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar cupons:', error);
        setCustomerCoupons([]);
      }
    } catch (error) {
      console.error('❌ Erro geral ao buscar cupons:', error);
      setCustomerCoupons([]);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  // Abrir modal de cupons
  const handleOpenCouponModal = () => {
    setShowCouponModal(true);
    fetchCustomerCoupons();
  };

  // Aplicar cupom do modal
  const handleApplyCouponFromModal = async (code: string) => {
    setCouponCode(code);
    setShowCouponModal(false);
    // Aplicar o cupom automaticamente
    const upperCode = code.toUpperCase().trim();
    
    // Para cupons de produto específico, precisamos tentar validar com cada produto do carrinho
    let validation;
    let couponInfo: any = null;
    let foundEligible = false;
    
    // Tentar validar com cada produto do carrinho
    for (const item of checkoutItems) {
      const testProduct = item.product;
      const testCategoryId = testProduct?.category ? String(testProduct.category).trim().toUpperCase() : undefined;
      const testProductId = testProduct?.id;
      
      // Garantir que o storeId seja uma string normalizada
      let normalizedStoreId = selectedStore ? String(selectedStore).trim() : undefined;
      if (!normalizedStoreId || normalizedStoreId === '') {
        if (testProduct?.storeId) {
          normalizedStoreId = String(testProduct.storeId).trim();
        } else if (stores.length > 0 && stores[0]?.id) {
          normalizedStoreId = String(stores[0].id).trim();
        }
      }
      
      try {
        const testValidation = await customerAPI.validateCoupon(
          upperCode,
          subtotal,
          testProductId,
          testCategoryId,
          normalizedStoreId,
          shippingCost
        );
        
        if (testValidation.valid && testValidation.coupon) {
          validation = testValidation;
          couponInfo = {
            applicableTo: testValidation.coupon.applicableTo || 'ALL',
            storeId: testValidation.coupon.storeId,
            categoryId: testValidation.coupon.categoryId,
            productId: testValidation.coupon.productId,
            discountType: testValidation.coupon.discountType,
            discountValue: testValidation.coupon.discountValue,
            couponType: testValidation.coupon.couponType,
            minimumPurchase: testValidation.coupon.minimumPurchase,
            maximumDiscount: testValidation.coupon.maximumDiscount,
          };
          foundEligible = true;
          break;
        }
      } catch (e: any) {
        // Se o erro não for sobre produto/loja/categoria, pode ser outro problema
        const errorMsg = e.response?.data?.message || e.message || '';
        // Se for erro de produto/loja/categoria, continuar tentando
        // Se for outro erro (expirado, inativo, etc), parar e mostrar erro
        if (!errorMsg.includes('produto') && !errorMsg.includes('loja') && !errorMsg.includes('categoria') && !errorMsg.includes('Categoria')) {
          // Erro não relacionado a produto/loja/categoria, pode ser cupom inválido
          throw e;
        }
        // Continuar tentando com próximo produto
        continue;
      }
    }
    
    if (!foundEligible) {
      // Tentar uma última vez sem productId para ver se é cupom geral
      try {
        const firstProduct = checkoutItems[0]?.product;
        const categoryId = firstProduct?.category ? String(firstProduct.category).trim().toUpperCase() : undefined;
        let normalizedStoreId = selectedStore ? String(selectedStore).trim() : undefined;
        
        if (!normalizedStoreId || normalizedStoreId === '') {
          if (firstProduct?.storeId) {
            normalizedStoreId = String(firstProduct.storeId).trim();
          } else if (stores.length > 0 && stores[0]?.id) {
            normalizedStoreId = String(stores[0].id).trim();
          }
        }
        
        validation = await customerAPI.validateCoupon(
          upperCode,
          subtotal,
          undefined, // Sem productId para cupons gerais
          categoryId,
          normalizedStoreId,
          shippingCost
        );
        
        if (validation.valid && validation.coupon) {
          couponInfo = {
            applicableTo: validation.coupon.applicableTo || 'ALL',
            storeId: validation.coupon.storeId,
            categoryId: validation.coupon.categoryId,
            productId: validation.coupon.productId,
            discountType: validation.coupon.discountType,
            discountValue: validation.coupon.discountValue,
            couponType: validation.coupon.couponType,
            minimumPurchase: validation.coupon.minimumPurchase,
            maximumDiscount: validation.coupon.maximumDiscount,
          };
          foundEligible = true;
        }
      } catch (e) {
        // Se ainda falhar, mostrar mensagem
        setCouponError('');
        showAlert('info', 'Este cupom não é válido para os produtos no seu carrinho. Verifique se você possui produtos que atendem aos critérios do cupom.');
        return;
      }
    }
    
    if (!foundEligible) {
      setCouponError('');
      showAlert('info', 'Este cupom não é válido para os produtos no seu carrinho. Verifique se você possui produtos que atendem aos critérios do cupom.');
      return;
    }
    
    try {

      if (validation && validation.valid && validation.coupon) {
        // Obter informações do cupom para identificar produtos elegíveis
        const couponInfo = {
          applicableTo: validation.coupon.applicableTo || 'ALL',
          storeId: validation.coupon.storeId,
          categoryId: validation.coupon.categoryId,
          productId: validation.coupon.productId,
          discountType: validation.coupon.discountType,
          discountValue: validation.coupon.discountValue,
          couponType: validation.coupon.couponType,
          minimumPurchase: validation.coupon.minimumPurchase,
          maximumDiscount: validation.coupon.maximumDiscount,
        };

        // Verificar se há produtos elegíveis
        const eligibleItems = getEligibleItems(couponInfo);
        
        if (eligibleItems.length === 0) {
          // Não há produtos elegíveis
          setCouponError('');
          showAlert('info', 'Este cupom não é válido para os produtos no seu carrinho. Adicione produtos que atendem aos critérios do cupom.');
          return;
        }

        // Calcular subtotal apenas dos produtos elegíveis
        const eligibleSubtotal = calculateEligibleSubtotal(couponInfo);
        
        // Verificar valor mínimo com produtos elegíveis
        if (couponInfo.minimumPurchase && eligibleSubtotal < Number(couponInfo.minimumPurchase)) {
          // Valor mínimo não atingido com produtos elegíveis
          setCouponError('');
          showAlert('info', `Este cupom requer um valor mínimo de R$ ${Number(couponInfo.minimumPurchase).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} nos produtos elegíveis.`);
          return;
        }
        
        // Recalcular desconto baseado no subtotal elegível
        let recalculatedDiscount = 0;
        
        if (couponInfo.couponType === 'SHIPPING') {
          // Para cupons de frete, usar o desconto original
          recalculatedDiscount = validation.discount;
        } else {
          // Para cupons de produto, recalcular baseado no subtotal elegível
          if (couponInfo.discountType === 'PERCENTAGE') {
            recalculatedDiscount = (eligibleSubtotal * Number(couponInfo.discountValue)) / 100;
            // Aplicar desconto máximo se houver
            if (couponInfo.maximumDiscount && recalculatedDiscount > Number(couponInfo.maximumDiscount)) {
              recalculatedDiscount = Number(couponInfo.maximumDiscount);
            }
          } else {
            recalculatedDiscount = Number(couponInfo.discountValue);
          }
          // Garantir que o desconto não seja maior que o subtotal elegível
          if (recalculatedDiscount > eligibleSubtotal) {
            recalculatedDiscount = eligibleSubtotal;
          }
        }

        // Arredondar para 2 casas decimais
        recalculatedDiscount = Math.round(recalculatedDiscount * 100) / 100;

        setAppliedCoupon({
          code: validation.coupon.code,
          discount: recalculatedDiscount,
          couponType: couponInfo.couponType,
          applicableTo: couponInfo.applicableTo,
          storeId: couponInfo.storeId,
          categoryId: couponInfo.categoryId,
          productId: couponInfo.productId,
        });
        setCouponError('');
        
        if (eligibleItems.length < checkoutItems.length) {
          showAlert('success', `Cupom ${validation.coupon.code} aplicado com sucesso! O desconto será aplicado apenas nos produtos elegíveis (${eligibleItems.length} de ${checkoutItems.length} produtos).`);
        } else {
          showAlert('success', `Cupom ${validation.coupon.code} aplicado com sucesso!`);
        }
      } else {
        // Cupom inválido - não mostrar erro, apenas não aplicar
        setCouponError('');
        showAlert('info', 'Este cupom não está disponível para este pedido. Verifique os cupons disponíveis na lista.');
      }
    } catch (error: any) {
      let errorMessage = error.response?.data?.message || error.message || 'Erro ao validar cupom';
      let friendlyMessage = '';
      const messageType: 'info' = 'info';
      
      // Tratar erros de forma mais amigável - criar mensagens informativas ao invés de erros
      if (errorMessage.includes('não é válido para esta loja') || errorMessage.includes('Loja não foi selecionada')) {
        // Extrair nome da loja se disponível
        const storeMatch = errorMessage.match(/loja com ID "([^"]+)"/);
        if (storeMatch) {
          const couponStoreId = storeMatch[1];
          const couponStore = stores.find(s => String(s.id).trim() === couponStoreId);
          const couponStoreName = couponStore?.name || 'outra loja';
          friendlyMessage = `Este cupom é válido apenas para a loja "${couponStoreName}". Verifique os cupons disponíveis para a loja selecionada.`;
        } else {
          friendlyMessage = 'Este cupom não é válido para a loja selecionada. Verifique os cupons disponíveis na lista.';
        }
      } else if (errorMessage.includes('categoria') || errorMessage.includes('Categoria')) {
        friendlyMessage = 'Este cupom não é válido para os produtos no seu carrinho. Adicione produtos da categoria correta ou escolha outro cupom.';
      } else if (errorMessage.includes('produto') || errorMessage.includes('Produto')) {
        friendlyMessage = 'Este cupom não é válido para os produtos no seu carrinho. Adicione o produto correto ou escolha outro cupom.';
      } else if (errorMessage.includes('compra mínima') || errorMessage.includes('valor mínimo')) {
        // Extrair valor mínimo se disponível
        const minMatch = errorMessage.match(/R\$\s*([\d.,]+)/i) || errorMessage.match(/(\d+)/);
        if (minMatch) {
          friendlyMessage = `Este cupom requer um valor mínimo de compra. Verifique os cupons disponíveis na lista.`;
        } else {
          friendlyMessage = 'Este cupom não atende aos requisitos mínimos. Verifique os cupons disponíveis na lista.';
        }
      } else if (errorMessage.includes('expirado') || errorMessage.includes('expirada')) {
        friendlyMessage = 'Este cupom está expirado. Verifique os cupons disponíveis na lista.';
      } else if (errorMessage.includes('não encontrado') || errorMessage.includes('não existe')) {
        friendlyMessage = 'Cupom não encontrado. Verifique o código digitado ou consulte os cupons disponíveis na lista.';
      } else {
        friendlyMessage = 'Este cupom não está disponível para este pedido. Verifique os cupons disponíveis na lista.';
      }
      
      // Não mostrar erro vermelho, apenas mensagem informativa
      setCouponError('');
      showAlert(messageType, friendlyMessage);
    }
  };

  // Categorizar cupons
  const categorizeCoupons = (coupons: any[]) => {
    const shippingCoupons: any[] = [];
    const unavailableCoupons: any[] = [];
    const availableCoupons: any[] = [];

    // Garantir que coupons seja um array
    if (!coupons || !Array.isArray(coupons)) {
      return { shippingCoupons, unavailableCoupons, availableCoupons };
    }

    console.log('🔍 Categorizando cupons:', coupons.length, coupons);

    // Obter loja selecionada ou loja do primeiro produto
    const firstProduct = checkoutItems[0]?.product;
    const currentStoreId = selectedStore 
      ? String(selectedStore).trim() 
      : (firstProduct?.storeId ? String(firstProduct.storeId).trim() : undefined);

    coupons.forEach(coupon => {
      // Verificar se é cupom de frete (usar couponType do backend)
      const isShipping = coupon.couponType === 'SHIPPING' || 
                        coupon.type === 'shipping' || 
                        coupon.category === 'Frete' ||
                        (coupon.description && coupon.description.toLowerCase().includes('frete'));
      
      console.log(`  - Cupom ${coupon.code}:`, {
        couponType: coupon.couponType,
        isShipping,
        applicableTo: coupon.applicableTo,
        couponStoreId: coupon.storeId,
        currentStoreId,
        minimumPurchase: coupon.minimumPurchase,
        subtotal,
        validUntil: coupon.validUntil || coupon.expiresAt
      });
      
      if (isShipping) {
        shippingCoupons.push(coupon);
      } else {
        // Verificar se está disponível
        const minPurchase = coupon.minimumPurchase || 0;
        const expiresAt = coupon.validUntil || coupon.expiresAt;
        const isExpired = expiresAt ? new Date(expiresAt) <= new Date() : false;
        const hasMinPurchase = subtotal >= minPurchase;
        // Nota: Limite de uso agora é por cliente, a validação será feita no backend
        // Removendo verificação de limite global no frontend
        
        // Obter informações dos produtos no carrinho
        const cartProductIds = checkoutItems.map(item => item.product?.id).filter(Boolean);
        const cartCategories = checkoutItems
          .map(item => item.product?.category)
          .filter(Boolean)
          .map(cat => String(cat).trim().toUpperCase());
        
        // Verificar se é cupom de loja específica
        const isStoreCoupon = coupon.applicableTo === 'STORE';
        let isStoreValid = true;
        let storeReason = '';
        
        if (isStoreCoupon && coupon.storeId) {
          const couponStoreId = String(coupon.storeId).trim();
          if (!currentStoreId) {
            isStoreValid = false;
            storeReason = 'Selecione uma loja para usar este cupom';
          } else if (couponStoreId !== currentStoreId) {
            isStoreValid = false;
            // Buscar nome da loja do cupom
            const couponStore = stores.find(s => String(s.id).trim() === couponStoreId);
            const couponStoreName = couponStore?.name || 'outra loja';
            storeReason = `Este cupom é válido apenas para a loja "${couponStoreName}"`;
          }
        }
        
        // Verificar se é cupom de categoria específica
        const isCategoryCoupon = coupon.applicableTo === 'CATEGORY';
        let isCategoryValid = true;
        let categoryReason = '';
        
        if (isCategoryCoupon && coupon.categoryId) {
          const couponCategoryId = String(coupon.categoryId).trim().toUpperCase();
          const hasMatchingCategory = cartCategories.some(cat => cat === couponCategoryId);
          
          if (!hasMatchingCategory) {
            isCategoryValid = false;
            // Mapear categoria para nome amigável
            const categoryNames: { [key: string]: string } = {
              'TINTA': 'Tintas',
              'PINCEL': 'Pincéis',
              'ROLO': 'Rolos',
              'FITA': 'Fitas',
              'KIT': 'Kits',
              'SOFA': 'Sofás',
              'MESA': 'Mesas',
              'CADEIRA': 'Cadeiras',
              'ARMARIO': 'Armários',
              'CAMA': 'Camas',
              'DECORACAO': 'Decoração',
              'ILUMINACAO': 'Iluminação',
              'MESA_CENTRO': 'Mesas de Centro',
              'OUTROS': 'Outros'
            };
            const categoryName = categoryNames[couponCategoryId] || couponCategoryId;
            categoryReason = `Este cupom é válido apenas para produtos da categoria "${categoryName}"`;
          }
        }
        
        // Verificar se é cupom de produto específico
        const isProductCoupon = coupon.applicableTo === 'PRODUCT';
        let isProductValid = true;
        let productReason = '';
        
        if (isProductCoupon && coupon.productId) {
          const couponProductId = String(coupon.productId).trim();
          const hasMatchingProduct = cartProductIds.some(id => String(id).trim() === couponProductId);
          
          if (!hasMatchingProduct) {
            isProductValid = false;
            // Tentar buscar nome do produto de todas as fontes possíveis
            const couponProduct = coupon.product || null;
            const cartProduct = checkoutItems.find(item => String(item.product.id).trim() === couponProductId)?.product;
            // Buscar também no estado de nomes de produtos
            const productName = couponProduct?.name || cartProduct?.name || productNames[couponProductId] || 'produto específico';
            productReason = `Este cupom é válido apenas para o produto "${productName}"`;
          }
        }
        
        const isAvailable = hasMinPurchase && !isExpired && isStoreValid && isCategoryValid && isProductValid;
        
        console.log(`    Disponibilidade:`, {
          hasMinPurchase,
          isExpired,
          isStoreValid,
          storeReason,
          isCategoryValid,
          categoryReason,
          isProductValid,
          productReason,
          isAvailable
        });
        
        if (isAvailable) {
          availableCoupons.push(coupon);
        } else {
          // Adicionar motivo da indisponibilidade
          const unavailableReason: string[] = [];
          
          if (!hasMinPurchase) {
            const missing = minPurchase - subtotal;
            unavailableReason.push(`Faltam R$ ${missing.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para usar este cupom (compra mínima: R$ ${minPurchase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
          }
          
          if (isExpired) {
            unavailableReason.push(`Cupom expirado em ${new Date(expiresAt).toLocaleDateString('pt-BR')}`);
          }
          
          // Nota: Limite de uso por cliente será verificado no backend
          
          if (!isStoreValid && storeReason) {
            unavailableReason.push(storeReason);
          }
          
          if (!isCategoryValid && categoryReason) {
            unavailableReason.push(categoryReason);
          }
          
          if (!isProductValid && productReason) {
            unavailableReason.push(productReason);
          }
          
          unavailableCoupons.push({
            ...coupon,
            unavailableReason: unavailableReason.join(' • ')
          });
        }
      }
    });

    console.log('📊 Cupons categorizados:', {
      shipping: shippingCoupons.length,
      available: availableCoupons.length,
      unavailable: unavailableCoupons.length
    });

    return { shippingCoupons, unavailableCoupons, availableCoupons };
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
      // CPF é opcional para retirada na loja, mas se fornecido deve ter formato válido
      if (address.cpf && address.cpf.trim()) {
        const cpf = address.cpf.replace(/\D/g, '');
        if (cpf.length > 0 && cpf.length !== 11) {
          setCpfError('CPF deve ter 11 dígitos');
          showAlert('warning', 'CPF deve ter 11 dígitos');
          return false;
        }
        if (cpf.length === 11 && /^(\d)\1{10}$/.test(cpf)) {
          setCpfError('CPF inválido');
          showAlert('warning', 'CPF inválido');
          return false;
        }
      }
      if (!selectedStore) {
        showAlert('warning', 'Por favor, selecione uma loja para retirada');
        return false;
      }
      setCpfError(''); // Limpar erro se tudo estiver ok
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

    // Validar CPF (mais flexível - apenas formato básico)
    if (address.cpf && address.cpf.trim()) {
      const cpf = address.cpf.replace(/\D/g, '');
      if (cpf.length !== 11) {
        setCpfError('CPF deve ter 11 dígitos');
        showAlert('warning', 'CPF deve ter 11 dígitos');
        return false;
      }
      // Validação básica - apenas verifica se tem 11 dígitos e não são todos iguais
      if (/^(\d)\1{10}$/.test(cpf)) {
        setCpfError('CPF inválido');
        showAlert('warning', 'CPF inválido');
        return false;
      }
      // Limpar erro se CPF estiver válido
      setCpfError('');
    } else {
      // CPF é opcional, mas se fornecido deve ser válido
      setCpfError('');
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
      // Verificar carrinho do backend antes de sincronizar
      const backendCartBefore = await customerAPI.getCart();
      const backendProductIds = new Set((backendCartBefore?.items || []).map((item: any) => item.product?.id).filter(Boolean));
      
      // Adicionar apenas produtos que ainda não estão no carrinho do backend ou atualizar quantidades
      for (const item of checkoutItems) {
        try {
          const existingBackendItem = (backendCartBefore?.items || []).find(
            (bi: any) => bi.product?.id === item.product.id
          );
          
          if (existingBackendItem) {
            // Produto já existe no backend, apenas atualizar quantidade se necessário
            if (existingBackendItem.quantity !== item.quantity) {
              await customerAPI.updateCartItem(existingBackendItem.id, item.quantity);
            }
          } else {
            // Produto não está no backend, adicionar
            await customerAPI.addToCart(item.product.id, item.quantity);
          }
        } catch (error: any) {
          console.error(`Erro ao sincronizar produto ${item.product.id}:`, error.message);
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
      
      // IMPORTANTE: Remover do carrinho do backend os produtos que NÃO foram selecionados
      // Criar um Set com os IDs dos produtos selecionados para verificação rápida
      const selectedProductIds = new Set(checkoutItems.map(item => item.product.id));
      
      // Remover produtos não selecionados do carrinho do backend
      for (const backendItem of backendCart.items) {
        const productId = backendItem.product?.id;
        if (productId && !selectedProductIds.has(productId)) {
          try {
            // Remover produto não selecionado do carrinho do backend
            await customerAPI.removeFromCart(backendItem.id);
            console.log(`Produto ${productId} removido do carrinho do backend (não selecionado)`);
          } catch (error: any) {
            console.error(`Erro ao remover produto ${productId} do carrinho do backend:`, error.message);
            // Continuar mesmo se houver erro ao remover um produto
          }
        }
      }
      
      // Buscar carrinho atualizado após remover produtos não selecionados
      const backendCartAfterCleanup = await customerAPI.getCart();
      if (!backendCartAfterCleanup || !backendCartAfterCleanup.items || backendCartAfterCleanup.items.length === 0) {
        showAlert('error', 'Não foi possível sincronizar seu carrinho com o servidor. Por favor, adicione os produtos novamente.');
        setIsProcessing(false);
        router.push('/cart');
        return;
      }
      
      // Verificar duplicação de produtos no carrinho do backend
      const productIdCounts: { [key: string]: number } = {};
      backendCartAfterCleanup.items.forEach((item: any) => {
        const productId = item.product?.id;
        if (productId) {
          productIdCounts[productId] = (productIdCounts[productId] || 0) + 1;
        }
      });
      
      const duplicatedProducts = Object.entries(productIdCounts).filter(([_, count]) => count > 1);
      if (duplicatedProducts.length > 0) {
        showAlert('warning', 'Foram encontrados produtos duplicados no carrinho. Limpando duplicatas...');
      }

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
        backendCartItemsCount: backendCartAfterCleanup.items?.length || 0,
        shippingAddress,
        paymentMethod,
        shippingCost,
        insuranceCost,
        tax,
        productDiscount,
        shippingDiscount,
      });
      
      // Preparar notas do pedido
      let notes = 'Pedido via checkout web. ';
      if (selectedShipping === 'pickup') {
        const selectedStoreData = stores.find((s: any) => s.id === selectedStore);
        notes += `Retirada na loja: ${selectedStoreData?.name || 'Loja selecionada'}. `;
      } else {
        notes += `Frete: ${selectedShipping === 'express' ? 'Expresso (SEDEX)' : 'Padrão (PAC)'}. `;
        const quote = selectedShipping === 'express' ? shippingQuoteExpress : shippingQuoteStandard;
        if (quote) {
          if (shippingMode === 'combined' && quote.combined) {
            notes += ` | Modo frete COMBINADO (todas as lojas juntas). Valor base somado: R$ ${Number(
              quote.combined.basePriceSum || 0,
            ).toFixed(2)}, desconto: ${quote.combined.discountPercent || 0}%, prazo estimado: ${
              quote.combined.deadlineDays
            } dia(s). `;
          } else if (shippingMode === 'separate' && quote.separate) {
            notes += ` | Modo frete SEPARADO por loja. Valor total: R$ ${Number(
              quote.separate.totalPrice || 0,
            ).toFixed(2)}, maior prazo entre lojas: ${quote.separate.maxDeadlineDays} dia(s). `;
          }
        }
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
        discount: productDiscount,
        couponCode: appliedCoupon?.code,
        notes: notes,
      });

      // Salvar ID da venda no sessionStorage para a página de pagamento
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('last-sale-id', saleResponse.id);
      }

      // Redirecionar IMEDIATAMENTE sem limpar o carrinho primeiro
      // O carrinho será limpo automaticamente após o checkout no backend
      // Isso evita mostrar a tela de carrinho vazio
      const paymentUrl = selectedPaymentMethod === 'card' 
        ? `/payment/card?saleId=${saleResponse.id}`
        : `/payment/pix?saleId=${saleResponse.id}`;
      
      // Usar window.location.replace para redirecionar imediatamente sem histórico
      // Isso impede que o usuário volte e veja o carrinho vazio
      window.location.replace(paymentUrl);
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
                        <Loader size={24} className="text-[#3e2626]" />
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
                          <Loader size={16} className="mr-2" />
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
                      <Loader size={24} className="text-[#3e2626]" />
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
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5" />
                        <span>Pagamento</span>
                      </CardTitle>
                      <CardDescription className="text-white/80 mt-1">
                        Formas de pagamento aceitas
                      </CardDescription>
                    </div>
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
                                {isLoadingShippingQuote ? (
                                  <span className="text-gray-400">Calculando...</span>
                                ) : (() => {
                                  const quote = shippingQuoteStandard;
                                  // Calcular estimativa se não houver cotação
                                  const estimatedWeight = checkoutItems.reduce((total, item) => {
                                    return total + ((item.product.weight || 0.5) * item.quantity);
                                  }, 0);
                                  const basePrice = selectedShipping === 'express' ? 20.00 : 10.00;
                                  const weightPrice = estimatedWeight * (selectedShipping === 'express' ? 5.00 : 2.50);
                                  let price = Math.round((basePrice + weightPrice) * 100) / 100;
                                  if (quote) {
                                    if (shippingMode === 'combined' && quote.combined?.finalPrice) {
                                      price = quote.combined.finalPrice;
                                    } else if (shippingMode === 'separate' && quote.separate?.totalPrice) {
                                      price = quote.separate.totalPrice;
                                    }
                                  }
                                  return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                })()}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {isLoadingShippingQuote ? (
                                  'Calculando prazo...'
                                ) : (() => {
                                  const quote = shippingQuoteStandard;
                                  if (!quote) return 'Entrega em 7-10 dias úteis';
                                  const days = shippingMode === 'combined' && quote.combined?.deadlineDays
                                    ? quote.combined.deadlineDays
                                    : quote.separate?.maxDeadlineDays || 10;
                                  return `Entrega em até ${days} dia${days > 1 ? 's' : ''} útil${days > 1 ? 'eis' : ''}`;
                                })()}
                              </div>
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
                                {isLoadingShippingQuote ? (
                                  <span className="text-gray-400">Calculando...</span>
                                ) : (() => {
                                  const quote = shippingQuoteExpress;
                                  let price = 49.90; // fallback
                                  if (quote) {
                                    if (shippingMode === 'combined' && quote.combined?.finalPrice) {
                                      price = quote.combined.finalPrice;
                                    } else if (shippingMode === 'separate' && quote.separate?.totalPrice) {
                                      price = quote.separate.totalPrice;
                                    }
                                  }
                                  return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                })()}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {isLoadingShippingQuote ? (
                                  'Calculando prazo...'
                                ) : (() => {
                                  const quote = shippingQuoteExpress;
                                  if (!quote) return 'Entrega em 2-3 dias úteis';
                                  const days = shippingMode === 'combined' && quote.combined?.deadlineDays
                                    ? quote.combined.deadlineDays
                                    : quote.separate?.maxDeadlineDays || 3;
                                  return `Entrega em até ${days} dia${days > 1 ? 's' : ''} útil${days > 1 ? 'eis' : ''}`;
                                })()}
                              </div>
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
                                      <Loader size={16} />
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
                          <span className="text-gray-600 "> - Reenvio gratuito se o item for perdido ou danificado</span>
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
                            <div className="text-lg font-bold text-[#3e2626] mt-1">
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
                            </div>
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
                      {selectedShipping === 'pickup'
                        ? 'Retirada na Loja'
                        : (() => {
                            const quote = selectedShipping === 'express' ? shippingQuoteExpress : shippingQuoteStandard;
                            return quote && (quote.combined || quote.separate)
                              ? `Frete (${shippingMode === 'combined' && quote.combined ? 'tudo junto' : 'por loja'})`
                              : 'Frete';
                          })()}
                    </span>
                    <span className="font-semibold">
                      {finalShippingCost === 0 ? (
                        <span className="text-green-600 flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Grátis</span>
                        </span>
                      ) : (
                        <>
                          {isShippingCoupon && shippingDiscount > 0 && shippingCost > finalShippingCost ? (
                            <span className="flex items-center space-x-2">
                              <span className="line-through text-gray-400 text-xs">
                                R$ {shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-green-600">
                                R$ {finalShippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </span>
                          ) : (
                            `R$ ${finalShippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          )}
                        </>
                      )}
                    </span>
                  </div>

                  {shippingDeadlineDays && selectedShipping !== 'pickup' && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Prazo estimado</span>
                      <span>até {shippingDeadlineDays} dia{shippingDeadlineDays > 1 ? 's' : ''} úteis</span>
                    </div>
                  )}

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
                    <>
                      {isShippingCoupon && shippingDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Desconto no frete ({appliedCoupon.code})</span>
                          <span className="font-semibold">- R$ {shippingDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {!isShippingCoupon && productDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Desconto ({appliedCoupon.code})</span>
                          <span className="font-semibold">- R$ {productDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Cupom */}
                {!appliedCoupon && (
                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleOpenCouponModal}
                      variant="outline"
                      className="w-full border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white flex items-center justify-center space-x-2"
                    >
                      <Tag className="h-4 w-4" />
                      <span>Cupons</span>
                    </Button>
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
            <Card className="shadow-lg border border-gray-200 bg-white">
              <CardContent className="p-6">
                <div className="space-y-0">
                  {/* Bloco 1: Segurança de Pagamento */}
                  <div className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="w-12 h-12 rounded-full bg-[#3e2626] flex items-center justify-center shrink-0 shadow-sm">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#3e2626] text-base mb-1.5">Segurança de Pagamento</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Suas informações são protegidas com criptografia e só são compartilhadas com provedores de pagamento confiáveis.
                      </p>
                    </div>
                  </div>

                  <hr className="border-gray-200 my-0" />

                  {/* Bloco 2: Segurança e Privacidade */}
                  <div className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="w-12 h-12 rounded-full bg-[#3e2626] flex items-center justify-center shrink-0 shadow-sm">
                      <Lock className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#3e2626] text-base mb-1.5">Segurança e Privacidade</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">
                        O processador de pagamentos armazena os dados do seu cartão de forma criptografada. Não guardamos os dados reais do cartão.
                      </p>
                      <a href="/privacy" className="inline-flex items-center text-sm font-medium text-[#3e2626] hover:text-[#5a3a3a] transition-colors">
                        Saiba mais <ArrowRight className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>

                  <hr className="border-gray-200 my-0" />

                  {/* Bloco 3: Garantia de entrega */}
                  <div className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="w-12 h-12 rounded-full bg-[#3e2626] flex items-center justify-center shrink-0 shadow-sm">
                      <Truck className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#3e2626] text-base mb-1.5">Garantia de entrega segura</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Troca ou reembolso gratuito para pacotes perdidos, devolvidos ou extraviados.
                      </p>
                    </div>
                  </div>

                  <hr className="border-gray-200 my-0" />

                  {/* Bloco 4: Suporte */}
                  <div className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="w-12 h-12 rounded-full bg-[#3e2626] flex items-center justify-center shrink-0 shadow-sm">
                      <Headphones className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#3e2626] text-base mb-1.5">Suporte ao cliente</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
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
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value);
                      setEditAddress({ ...editAddress, cpf: formatted });
                      // Limpar erro ao digitar
                      if (cpfError) setCpfError('');
                    }}
                    placeholder="000.000.000-00"
                    className={`mt-1 ${cpfError ? 'border-red-500' : ''}`}
                    maxLength={14}
                  />
                  {cpfError && (
                    <p className="text-xs text-red-500 mt-1">{cpfError}</p>
                  )}
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
                        <Loader size={16} />
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
                  <Loader size={16} className="mr-2" />
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

      {/* Modal Visualizar como vai ficar */}
      <Dialog open={isItemsModalOpen} onOpenChange={setIsItemsModalOpen}>
        <DialogContent className="max-w-7xl w-full max-h-[95vh] overflow-hidden border-[#3e2626]/20 bg-white shadow-2xl p-0">
          <DialogHeader className="border-b border-[#3e2626]/10 px-6 py-4 bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white">
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-[#C07A45]" />
              Visualizar como vai ficar
            </DialogTitle>
            <DialogDescription className="text-sm text-white/80 mt-2">
              {totalCheckoutQuantity} {totalCheckoutQuantity === 1 ? 'item selecionado' : 'itens selecionados'} no seu pedido • Faça upload de uma foto do ambiente e posicione os produtos
            </DialogDescription>
          </DialogHeader>

          <div className="flex h-[calc(95vh-120px)] overflow-hidden">
            {/* Coluna esquerda - Canvas */}
            <div className="flex flex-1 flex-col overflow-hidden border-r border-[#3e2626]/10 bg-white">
              {!uploadedImage ? (
                <div className="flex flex-1 items-center justify-center p-8">
                  <Card className="w-full max-w-2xl border-[#3e2626]/20 bg-white shadow-xl">
                    <CardContent className="p-8">
                      <div
                        {...getRootProps()}
                        className={`cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all ${
                          isDragActive ? 'border-[#C07A45] bg-[#F7C194]/20 scale-105' : 'border-[#3e2626]/30 hover:border-[#C07A45] hover:bg-white'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <Upload className="mx-auto mb-4 h-16 w-16 text-[#C07A45]" />
                        <p className="mb-2 text-lg font-semibold text-[#3e2626]">
                          {isDragActive ? 'Solte a imagem aqui' : 'Arraste sua foto aqui ou clique para enviar'}
                        </p>
                        <p className="mb-6 text-sm text-[#4f3a2f]/70">
                          Faça upload de uma foto do seu ambiente para visualizar os produtos
                        </p>
                        <div className="flex justify-center gap-4">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              open();
                            }}
                            className="border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626]/10"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Enviar foto
                          </Button>
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCameraClick();
                            }}
                            className="border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626]/10"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Abrir câmera
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="relative flex flex-1 overflow-auto bg-white">
                  <div
                    ref={canvasRef}
                    className={`relative flex min-h-full items-center justify-center p-8 ${
                      isSelectingPosition ? 'cursor-crosshair' : 'cursor-default'
                    }`}
                    onClick={handleCanvasClick}
                  >
                    <div className="relative max-h-full max-w-full">
                      {processedImageUrl ? (
                        <Image
                          ref={imageRef}
                          src={processedImageUrl}
                          alt="Ambiente processado pela IA"
                          width={1024}
                          height={768}
                          className="h-auto max-w-full rounded-lg shadow-2xl"
                          style={{ maxHeight: 'calc(95vh - 200px)' }}
                          unoptimized
                        />
                      ) : uploadedImage ? (
                        <Image
                          ref={imageRef}
                          src={uploadedImage}
                          alt="Ambiente"
                          width={1024}
                          height={768}
                          className="h-auto max-w-full rounded-lg shadow-2xl"
                          style={{ maxHeight: 'calc(95vh - 200px)' }}
                          unoptimized
                        />
                      ) : null}

                      {/* Overlay de seleção de posição */}
                      {isSelectingPosition && !isProcessingAI && (
                        <div className="absolute inset-0 rounded-lg border-2 border-dashed border-[#C07A45]/50 bg-[#C07A45]/5 pointer-events-none z-10" />
                      )}

                      {/* Overlay de processamento */}
                      {isProcessingAI && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#3e2626]/80 backdrop-blur-sm z-30">
                          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-2xl border border-[#3e2626]/20">
                            <Loader size={48} className="text-[#C07A45]" />
                            <p className="text-lg font-semibold text-[#3e2626]">Processando com nossa IA...</p>
                            <p className="text-sm text-[#4f3a2f]/70">Aguarde alguns segundos</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna direita - Lista de Produtos */}
            <div className="flex w-96 flex-col border-l border-[#3e2626]/10 bg-white overflow-y-auto">
              <div className="border-b border-[#3e2626]/10 p-4 bg-white sticky top-0 z-10">
                <h3 className="text-lg font-black text-[#3e2626] mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#C07A45]" />
                  Produtos do Pedido
                </h3>
                {isSelectingPosition && pendingProduct && (
                  <div className="bg-[#C07A45]/10 border border-[#C07A45]/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#C07A45] animate-pulse" />
                        <p className="text-sm font-medium text-[#3e2626]">
                          Clique na imagem para posicionar: <span className="text-[#C07A45] font-bold">{pendingProduct.name}</span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelPositionSelection}
                        className="h-6 w-6 p-0 text-[#3e2626] hover:bg-[#C07A45]/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4 p-4">
                {checkoutItems.length === 0 ? (
                  <div className="py-8 text-center text-[#4f3a2f]/60">
                    <Package className="h-12 w-12 mx-auto mb-4 text-[#4f3a2f]/40" />
                    <p>Nenhum produto no pedido</p>
                  </div>
                ) : (
                  checkoutItems.map((item) => {
                    const isPlaced = placedItems.some(pi => pi.productId === item.product.id);
                    const imageUrl = item.product.imageUrls?.[0] || item.product.imageUrl;
                    
                    return (
                      <Card
                        key={item.product.id}
                        className={`transition-all border-[#3e2626]/10 hover:border-[#C07A45]/30 ${
                          isPlaced ? 'bg-green-50 border-green-300' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white border border-[#3e2626]/10">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-8 w-8 text-[#4f3a2f]/40" />
                              )}
                              {isPlaced && (
                                <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                                  <CheckCircle2 className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="mb-1 truncate text-sm font-semibold text-[#3e2626]">{item.product.name}</h3>
                              <p className="mb-2 text-xs text-[#4f3a2f]/70">Qtd: {item.quantity}</p>
                              <p className="mb-3 text-lg font-bold text-[#C07A45]">
                                R$ {getCurrentPrice(item.product).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                              <Button
                                size="sm"
                                className={`w-full ${
                                  isPlaced
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-[#3e2626] hover:bg-[#4f3223] text-white'
                                }`}
                                onClick={() => {
                                  if (!uploadedImage && !uploadedImageFile) {
                                    showAlert('warning', 'Por favor, faça upload de uma imagem do ambiente primeiro');
                                    return;
                                  }
                                  if (isPlaced) {
                                    setPlacedItems(prev => prev.filter(pi => pi.productId !== item.product.id));
                                    if (placedItems.length === 1) {
                                      setProcessedImageUrl(null);
                                    }
                                  } else {
                                    handleStartAddProduct(item.product);
                                  }
                                }}
                                disabled={isProcessingAI || isSelectingPosition}
                              >
                                {isProcessingAI && pendingProduct?.id === item.product.id ? (
                                  <>
                                    <Loader size={16} className="mr-2" />
                                    Processando...
                                  </>
                                ) : isPlaced ? (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Remover
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Adicionar ao ambiente
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Resumo */}
              <div className="border-t border-[#3e2626]/10 p-4 bg-gradient-to-r from-[#3e2626]/5 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#4f3a2f]">Total de itens:</span>
                  <span className="text-base font-black text-[#3e2626]">{totalCheckoutQuantity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#4f3a2f]">Valor total:</span>
                  <span className="text-xl font-black text-[#3e2626]">
                    R$ {checkoutItems.reduce((sum, it) => {
                      const currentPrice = getCurrentPrice(it.product);
                      return sum + currentPrice * (it.quantity || 1);
                    }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
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
              <Loader size={24} className="text-[#3e2626]" />
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

      {/* Modal de Cupons */}
      <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#3e2626] flex items-center space-x-2">
              <Tag className="h-6 w-6" />
              <span>Cupons Disponíveis</span>
            </DialogTitle>
            <DialogDescription>
              Escolha um cupom atribuído ou digite um código exclusivo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Input para cupons exclusivos */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#3e2626]">Cupom Exclusivo</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Digite o código do cupom exclusivo"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyCoupon();
                    }
                  }}
                />
                <Button
                  onClick={handleApplyCoupon}
                  className="bg-[#3e2626] text-white hover:bg-[#2a1f1f]"
                >
                  Aplicar
                </Button>
              </div>
            </div>

            {/* Cupons atribuídos ao cliente */}
            {isLoadingCoupons ? (
              <div className="flex items-center justify-center py-8">
                <Loader size={24} className="text-[#3e2626]" />
                <span className="ml-2 text-gray-600">Carregando cupons...</span>
              </div>
            ) : (
              <>
                {(() => {
                  // Criar uma cópia dos cupons com nomes de produtos atualizados
                  const couponsWithProductNames = (customerCoupons || []).map(coupon => {
                    if (coupon.applicableTo === 'PRODUCT' && coupon.productId && !coupon.product?.name) {
                      const productId = String(coupon.productId).trim();
                      const productName = productNames[productId];
                      if (productName) {
                        return {
                          ...coupon,
                          product: { ...coupon.product, name: productName }
                        };
                      }
                    }
                    return coupon;
                  });
                  
                  const { shippingCoupons, unavailableCoupons, availableCoupons } = categorizeCoupons(couponsWithProductNames);
                  
                  return (
                    <div className="space-y-6">
                      {/* Cupons de Frete */}
                      {shippingCoupons.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-[#3e2626] flex items-center space-x-2">
                            <Truck className="h-5 w-5 text-[#3e2626]" />
                            <span>Cupons de Frete</span>
                          </h3>
                          <div className="space-y-4">
                            {shippingCoupons.map((coupon) => (
                              <CouponCard
                                key={coupon.id || coupon.code}
                                coupon={{
                                  ...coupon,
                                  id: coupon.id || coupon.code,
                                  status: 'active' as const,
                                }}
                                onUse={handleApplyCouponFromModal}
                                showCopyButton={false}
                                showUseButton={true}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cupons Disponíveis */}
                      {availableCoupons.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-[#3e2626] flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-[#3e2626]" />
                            <span>Cupons Disponíveis</span>
                          </h3>
                          <div className="space-y-4">
                            {availableCoupons.map((coupon) => (
                              <CouponCard
                                key={coupon.id || coupon.code}
                                coupon={{
                                  ...coupon,
                                  id: coupon.id || coupon.code,
                                  status: 'active' as const,
                                }}
                                onUse={handleApplyCouponFromModal}
                                showCopyButton={false}
                                showUseButton={true}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cupons Indisponíveis */}
                      {unavailableCoupons.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-[#3e2626] flex items-center space-x-2">
                            <AlertCircle className="h-5 w-5 text-[#5a3a3a]" />
                            <span>Cupons Indisponíveis</span>
                          </h3>
                          <div className="space-y-4">
                            {unavailableCoupons.map((coupon) => (
                              <CouponCard
                                key={coupon.id || coupon.code}
                                coupon={{
                                  ...coupon,
                                  id: coupon.id || coupon.code,
                                  status: 'unavailable' as const,
                                }}
                                unavailableReason={coupon.unavailableReason}
                                showCopyButton={false}
                                showUseButton={false}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mensagem quando não há cupons */}
                      {customerCoupons.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Tag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>Você não possui cupons atribuídos no momento.</p>
                          <p className="text-sm mt-2">Use o campo acima para digitar um cupom exclusivo.</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCouponModal(false)}
              className="border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}