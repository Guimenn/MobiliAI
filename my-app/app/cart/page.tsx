'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FavoriteTooltip from '@/components/FavoriteTooltip';
import ProductCard from '@/components/ProductCard';
import AITestModal from '@/components/AITestModal';
import { 
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Truck,
  Shield,
  Gift,
  Heart,
  Package,
  CheckCircle,
  Star,
  Tag,
  Zap,
  Sparkles,
  Clock,
  MapPin,
  Phone,
  Mail,
  Sofa,
  Table,
  Users,
  Archive,
  BookOpen,
  Frame,
  Lamp,
  Package as PackageIcon,
  Store
} from 'lucide-react';
import Link from 'next/link';
import { showAlert, showConfirm } from '@/lib/alerts';
import { env } from '@/lib/env';

// Componente para checkbox com suporte a indeterminate
function StoreCheckbox({ checked, indeterminate, onCheckedChange }: { checked: boolean; indeterminate: boolean; onCheckedChange: (checked: boolean) => void }) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = (isChecked: boolean) => {
    onCheckedChange(isChecked);
  };

  return (
    <Checkbox
      ref={checkboxRef}
      checked={checked}
      onCheckedChange={handleChange}
      className="h-5 w-5"
    />
  );
}

export default function CartPage() {
  const router = useRouter();
  const { cart, cartTotal, removeFromCart, updateCartItemQuantity, clearCart, addToCart, user, isAuthenticated } = useAppStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showEmptyCart, setShowEmptyCart] = useState(false);
  const [storeInfoCache, setStoreInfoCache] = useState<{ [storeId: string]: { name: string; address?: string } }>({});
  const [showAIModal, setShowAIModal] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  
  // Estado para controlar produtos selecionados
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(cart.map(item => item.product.id))
  );

  // Função para buscar informações da loja através do produto
  const fetchStoreInfoFromProduct = async (productId: string, storeId: string) => {
    if (!storeId || storeId === 'unknown' || storeId === '' || storeInfoCache[storeId]) {
      return storeInfoCache[storeId];
    }

    try {
      // Tentar buscar o produto completo que deve ter informações da loja
      const { env } = await import('@/lib/env');
      const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
      
      try {
        const productResponse = await fetch(`${apiBaseUrl}/public/products/${productId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (productResponse.ok) {
          const productData = await productResponse.json();
          if (productData.store?.name) {
            const info = {
              name: productData.store.name,
              address: productData.store.address
            };
            setStoreInfoCache(prev => ({ ...prev, [storeId]: info }));
            return info;
          }
        }
      } catch (productError) {
        // Continuar para outras tentativas
      }

      // Tentar buscar do endpoint público de lojas (se existir)
      try {
        const publicResponse = await fetch(`${apiBaseUrl}/public/stores/${storeId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (publicResponse.ok) {
          const storeData = await publicResponse.json();
          const info = {
            name: storeData.name || `Loja ${storeId.substring(0, 8)}`,
            address: storeData.address
          };
          setStoreInfoCache(prev => ({ ...prev, [storeId]: info }));
          return info;
        }
      } catch (publicError) {
        // Endpoint público não disponível, continuar
      }

      // Só tentar endpoint autenticado se o usuário estiver logado
      if (isAuthenticated && user) {
        try {
          const { storesAPI } = await import('@/lib/api');
          const storeData = await storesAPI.getById(storeId);
          const info = {
            name: storeData.name || `Loja ${storeId.substring(0, 8)}`,
            address: storeData.address
          };
          setStoreInfoCache(prev => ({ ...prev, [storeId]: info }));
          return info;
        } catch (authError: any) {
          // Se for 403 ou 401, não tentar novamente
          if (authError.response?.status === 403 || authError.response?.status === 401) {
            console.log('Sem permissão para acessar informações da loja');
          }
        }
      }
    } catch (error) {
      // Erro genérico, continuar com fallback
    }

    // Fallback: usar ID da loja como nome
    const info = {
      name: `Loja ${storeId.substring(0, 8)}`,
      address: undefined
    };
    setStoreInfoCache(prev => ({ ...prev, [storeId]: info }));
    return info;
  };

  // Buscar informações de lojas que estão faltando
  React.useEffect(() => {
    const missingInfo: Array<{ productId: string; storeId: string }> = [];
    cart.forEach(item => {
      // Verificar se precisa buscar informações da loja
      let needsFetch = false;
      let storeIdToFetch: string | null = null;

      // Prioridade 1: Verificar storeId direto
      if (item.product.storeId && item.product.storeId !== 'unknown' && item.product.storeId !== '') {
        if (!item.product.store?.name && !storeInfoCache[item.product.storeId]) {
          needsFetch = true;
          storeIdToFetch = item.product.storeId;
        }
      }
      // Prioridade 2: Verificar storeInventory se não encontrou storeId direto
      else if (item.product.storeInventory && Array.isArray(item.product.storeInventory) && item.product.storeInventory.length > 0) {
        // Buscar primeira loja com informações ou estoque
        const firstStore = item.product.storeInventory.find((inv: any) => inv.storeId && inv.storeId !== 'unknown' && inv.storeId !== '');
        if (firstStore && !firstStore.store?.name && !storeInfoCache[firstStore.storeId]) {
          needsFetch = true;
          storeIdToFetch = firstStore.storeId;
        }
      }

      if (needsFetch && storeIdToFetch) {
        missingInfo.push({ productId: item.product.id, storeId: storeIdToFetch });
      }
    });

    if (missingInfo.length > 0) {
      // Buscar informações de forma assíncrona sem bloquear a UI
      missingInfo.forEach(({ productId, storeId }) => {
        fetchStoreInfoFromProduct(productId, storeId).catch(err => {
          // Silenciosamente falhar, já temos fallback
          console.log(`Não foi possível buscar informações da loja ${storeId}:`, err.message);
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);

  // Função para renderizar ícone baseado na categoria
  const renderCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: any } = {
      'sofa': Sofa,
      'mesa': Table,
      'cadeira': Users,
      'armario': Archive,
      'cama': Package,
      'decoracao': Frame,
      'iluminacao': Lamp,
      'mesa_centro': PackageIcon,
    };
    
    const IconComponent = iconMap[category] || PackageIcon;
    return <IconComponent className="h-6 w-6" />;
  };

  // Função para calcular desconto
  const calculateDiscount = (originalPrice: number, currentPrice: number) => {
    if (originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
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

  // Agrupar produtos por loja - apenas para usuários autenticados COM endereço completo
  const productsByStore = useMemo(() => {
    const grouped: { [storeId: string]: { storeName: string; storeAddress?: string; items: typeof cart } } = {};

    // Verificar se usuário tem endereço completo (cidade, estado e CEP)
    const hasCompleteAddress = user?.city && user?.state && user?.zipCode;

    // Para usuários NÃO AUTENTICADOS ou SEM ENDEREÇO COMPLETO: não agrupar por loja, mostrar todos os produtos juntos
    if (!isAuthenticated || !user || !hasCompleteAddress) {
      const reason = !isAuthenticated ? 'não autenticado' :
                    !user ? 'dados do usuário não carregados' :
                    'sem endereço completo';
      console.log(`[Cart] Usuário ${reason} - não agrupando por loja`);

      const allItems = [...cart];

      // Para usuários sem endereço, criar um grupo único sem loja específica
      grouped['guest-cart'] = {
        storeName: 'Produtos no Carrinho',
        storeAddress: undefined,
        items: allItems
      };

      return grouped;
    }

    // Para usuários AUTENTICADOS COM ENDEREÇO COMPLETO: usar lógica geográfica igual ao checkout
    console.log('[Cart] Usuário autenticado com endereço completo - usando lógica geográfica');

    // Obter endereço do usuário para cálculo de proximidade
    const userAddress = {
      city: user.city,
      state: user.state,
      zipCode: user.zipCode
    };

    cart.forEach(item => {
      let storeId: string = 'unknown';
      let storeName: string | undefined;
      let storeAddress: string | undefined;

      // USAR A MESMA LÓGICA GEOGRÁFICA DO CHECKOUT
      if (item.product.storeInventory && Array.isArray(item.product.storeInventory) && item.product.storeInventory.length > 0) {
        // Buscar todas as lojas ativas com estoque
        const storesWithStock = item.product.storeInventory
          .filter((inv: any) => inv.store?.isActive && inv.quantity > 0 && inv.store?.name && inv.store?.zipCode)
          .map(inv => ({
            inventory: inv,
            store: inv.store
          }))
          .filter(item => item.store); // Remover lojas não encontradas

        if (storesWithStock.length > 0) {
          // Função para calcular prioridade de proximidade (mesma do checkout)
          const calculateProximityScore = (store: any) => {
            if (!store) return 999;

            let score = 0;

            // Normalizar strings para comparação (remover acentos, espaços extras, converter para minúsculo)
            const normalizeString = (str: string) => {
              if (!str) return '';
              return str
                .toLowerCase()
                .trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                .replace(/\s+/g, ' ') // Normalizar espaços
                .replace(/^(sao|sto|santa|sant)\s+/i, 'são ') // Corrigir abreviações comuns
                .replace(/^(sao|sto|santa|sant)$/i, match => {
                  const corrections: { [key: string]: string } = {
                    'sao': 'são',
                    'sto': 'santo',
                    'santa': 'santa',
                    'sant': 'sant'
                  };
                  return corrections[match.toLowerCase()] || match;
                });
            };

            const normalizedUserCity = normalizeString(userAddress.city || '');
            const normalizedUserState = (userAddress.state || '').toUpperCase().trim();
            const normalizedStoreCity = normalizeString(store.city || '');
            const normalizedStoreState = (store.state || '').toUpperCase().trim();

            // Debug: mostrar comparações se necessário
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Proximity] Comparando: "${userAddress.city}/${userAddress.state}" vs "${store.city}/${store.state}"`);
              console.log(`[Proximity] Normalizado: "${normalizedUserCity}/${normalizedUserState}" vs "${normalizedStoreCity}/${normalizedStoreState}"`);
            }

            // Prioridade 1: Mesma cidade E mesmo estado
            if (normalizedStoreCity === normalizedUserCity &&
                normalizedStoreState === normalizedUserState) {
              score = 1;
            }
            // Prioridade 2: Mesmo estado (diferente cidade)
            else if (normalizedStoreState === normalizedUserState) {
              score = 2;
            }
            // Prioridade 3: Estados diferentes
            else {
              score = 3;
            }

            return score;
          };

          // Filtrar e ordenar lojas por proximidade e estoque
          const storesWithProximity = storesWithStock
            .map(storeItem => ({
              ...storeItem,
              proximityScore: calculateProximityScore(storeItem.store)
            }))
            .sort((a, b) => {
              // Ordenar por proximidade primeiro, depois por estoque
              if (a.proximityScore !== b.proximityScore) {
                return a.proximityScore - b.proximityScore;
              }
              return b.inventory.quantity - a.inventory.quantity;
            });

          // Usar a loja mais próxima (mesma lógica do checkout)
          const selectedStore = storesWithProximity[0];
          storeId = selectedStore.inventory.storeId;
          storeName = selectedStore.store?.name;
          storeAddress = selectedStore.store?.address;

          console.log(`[Cart] Produto ${item.product.id}: loja selecionada por proximidade:`, {
            storeId,
            storeName,
            proximityScore: selectedStore.proximityScore,
            stock: selectedStore.inventory.quantity
          });
        } else {
          // Fallback: usar storeInventory sem considerar localização
          console.log(`[Cart] Produto ${item.product.id}: nenhuma loja com localização, usando fallback`);
          const firstStore = item.product.storeInventory.find((inv: any) => inv.store?.isActive && inv.store?.name);
          if (firstStore) {
            storeId = firstStore.storeId;
            storeName = firstStore.store?.name;
            storeAddress = firstStore.store?.address;
          }
        }
      }
      // Fallback para produtos sem storeInventory
      else if (item.product.storeId && item.product.store?.name) {
        storeId = item.product.storeId;
        storeName = item.product.store.name;
        storeAddress = item.product.store.address;
      }

      // Fallback: usar cache ou buscar informações
      if (!storeName || storeId === 'unknown') {
        if (storeId !== 'unknown' && storeId !== '') {
          storeName = storeInfoCache[storeId]?.name;
        }
        if (!storeName) {
          storeName = `Loja ${storeId.substring(0, 8)}`;
        }
      }

      if (!grouped[storeId]) {
        grouped[storeId] = {
          storeName: storeName || `Loja ${storeId.substring(0, 8)}`,
          storeAddress,
          items: []
        };
      }

      // Atualizar o produto com as informações de exibição da loja
      if (item.product) {
        item.product.displayStoreId = storeId;
        item.product.displayStoreName = storeName;
        item.product.displayStoreAddress = storeAddress;
      }

      grouped[storeId].items.push(item);
    });

    console.log('[Cart] Agrupamento final:', Object.keys(grouped).length, 'grupos');
    return grouped;
  }, [cart, storeInfoCache, isAuthenticated, user]);

  // Produtos selecionados
  const selectedCartItems = useMemo(() => {
    return cart.filter(item => selectedProducts.has(item.product.id));
  }, [cart, selectedProducts]);

  // Calcular total dos produtos selecionados (com desconto se houver oferta)
  const selectedTotal = useMemo(() => {
    return selectedCartItems.reduce((total, item) => {
      const currentPrice = getCurrentPrice(item.product);
      return total + (currentPrice * item.quantity);
    }, 0);
  }, [selectedCartItems]);

  // Função para calcular frete estimado baseado no peso dos produtos
  // O valor real será calculado no checkout usando cálculo manual de frete,
  // aqui é apenas uma estimativa simples para o resumo do carrinho.
  const calculateShipping = (): number => {
    // Calcular estimativa básica baseada no peso total dos produtos selecionados
    const totalWeight = selectedCartItems.reduce((total, item) => {
      // Assumir 0.5kg por produto se não tiver peso definido
      // O peso pode vir como string ou number, então convertemos para number
      let itemWeight = 0.5;
      if (item.product.weight) {
        if (typeof item.product.weight === 'string') {
          itemWeight = parseFloat(item.product.weight) || 0.5;
        } else {
          itemWeight = Number(item.product.weight) || 0.5;
        }
      }
      return total + (itemWeight * item.quantity);
    }, 0);
    
    // Estimativa: R$ 10 base + R$ 2,50 por kg
    const estimatedShipping = 10.00 + (totalWeight * 2.50);
    return Math.round(estimatedShipping * 100) / 100;
  };

  // Função para calcular total final dos selecionados
  const finalTotal = selectedTotal + calculateShipping();

  // Verificar se todos os produtos de uma loja estão selecionados
  const isStoreSelected = (storeId: string) => {
    const storeItems = productsByStore[storeId]?.items || [];
    if (storeItems.length === 0) return false;
    return storeItems.every(item => selectedProducts.has(item.product.id));
  };

  // Verificar se pelo menos um produto da loja está selecionado
  const isStorePartiallySelected = (storeId: string) => {
    const storeItems = productsByStore[storeId]?.items || [];
    if (storeItems.length === 0) return false;
    const hasSelected = storeItems.some(item => selectedProducts.has(item.product.id));
    const allSelected = storeItems.every(item => selectedProducts.has(item.product.id));
    return hasSelected && !allSelected;
  };

  // Selecionar/desselecionar todos os produtos de uma loja
  const toggleStoreSelection = (storeId: string) => {
    const storeItems = productsByStore[storeId]?.items || [];
    const allSelected = isStoreSelected(storeId);
    
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      storeItems.forEach(item => {
        if (allSelected) {
          newSet.delete(item.product.id);
        } else {
          newSet.add(item.product.id);
        }
      });
      return newSet;
    });
  };

  // Selecionar/desselecionar produto individual
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Selecionar/desselecionar todos os produtos
  const toggleAllProducts = () => {
    const allSelected = cart.every(item => selectedProducts.has(item.product.id));
    setSelectedProducts(allSelected ? new Set() : new Set(cart.map(item => item.product.id)));
  };

  // Função para checkout apenas com produtos selecionados
  const handleCheckout = () => {
    if (selectedCartItems.length === 0) {
      showAlert('warning', 'Selecione pelo menos um produto para finalizar a compra');
      return;
    }
    
    // Verificar autenticação antes de continuar
    if (!isAuthenticated) {
      showAlert('info', 'Faça login para continuar com a compra');
      router.push('/login?redirect=/cart');
      return;
    }
    
    // Salvar produtos selecionados no sessionStorage para a página de checkout
    if (typeof window !== 'undefined') {
      const selectedIds = Array.from(selectedProducts);
      sessionStorage.setItem('checkout-selected-products', JSON.stringify(selectedIds));
    }
    
    // Mostrar modal de teste de IA antes de ir para checkout
    setShowAIModal(true);
  };

  // Função para continuar para checkout (chamada após o modal)
  const handleContinueToCheckout = () => {
    setShowAIModal(false);
    router.push('/checkout');
  };

  // Função para continuar comprando
  const continueShopping = () => {
    router.push('/products');
  };

  // Função para limpar carrinho
  const handleClearCart = async () => {
    const confirmed = await showConfirm(
      'Tem certeza que deseja limpar o carrinho?',
      'Limpar carrinho',
      'Limpar',
      'Cancelar',
      'destructive'
    );
    if (confirmed) {
      clearCart();
    }
  };

  // Função para adicionar aos favoritos
  const addToFavorites = async (product: any) => {
    // Se o usuário não estiver autenticado, apenas exibir mensagem de login
    if (!isAuthenticated || !user) {
      showAlert('error', 'Faça login para adicionar produtos aos favoritos.');
      return;
    }

    try {
      // Integração simples com o sistema de favoritos
      const { customerAPI } = await import('@/lib/api');
      await customerAPI.addToFavorites(product.id);
      showAlert('success', `${product.name} adicionado aos favoritos!`);
    } catch (error) {
      console.error('Erro ao adicionar aos favoritos a partir do carrinho:', error);
      showAlert('error', 'Não foi possível adicionar aos favoritos. Tente novamente.');
    }
  };

  // Buscar produtos recomendados do banco de dados
  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      try {
        setIsLoadingRecommended(true);
        // Buscar produtos públicos do banco, limitando a 4 produtos
        const params = new URLSearchParams({
          limit: '4',
          page: '1',
        });
        
        // Usar endpoint público de produtos (sem autenticação)
        const response = await fetch(`${env.API_URL}/public/products?${params.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          // Se o endpoint não existir, tentar endpoint alternativo
          console.warn('Endpoint /public/products não disponível, tentando endpoint alternativo...');
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Resposta da API de produtos recomendados:', data);
        
        // Extrair produtos da resposta (pode ter estrutura de paginação)
        let productsArray: any[] = [];
        if (data.products && Array.isArray(data.products)) {
          productsArray = data.products;
        } else if (data.data && Array.isArray(data.data)) {
          productsArray = data.data;
        } else if (data.items && Array.isArray(data.items)) {
          productsArray = data.items;
        } else if (Array.isArray(data)) {
          productsArray = data;
        }
        
        if (productsArray.length > 0) {
          // Mapear produtos do backend para o formato esperado (limitar a 4 produtos)
          const mappedProducts = productsArray.slice(0, 4).map((product: any) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: Number(product.price),
            originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
            category: product.category?.toLowerCase() || 'mesa',
            color: product.colorHex || product.color || '#8B4513',
            imageUrl: product.imageUrls?.[0] || product.imageUrl || '',
            imageUrls: product.imageUrls || (product.imageUrl ? [product.imageUrl] : []),
            rating: product.rating || 4.5,
            reviews: product.reviewCount || product.reviews || 0,
            stock: product.stock || 0,
            storeId: product.storeId || product.store?.id || '',
            storeName: product.store?.name,
            brand: product.brand,
            colorName: product.colorName,
            colorHex: product.colorHex || product.color,
          }));
          setRecommendedProducts(mappedProducts);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos recomendados:', error);
        // Em caso de erro, manter array vazio
        setRecommendedProducts([]);
      } finally {
        setIsLoadingRecommended(false);
      }
    };

    fetchRecommendedProducts();
  }, []);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header />
        
        {/* Empty Cart State */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-50 pb-20">
          <div className="text-center">
            {/* Empty Cart Icon */}
            <div className="mx-auto w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-8 shadow-lg">
              <ShoppingCart className="h-16 w-16 text-gray-400" />
            </div>
            
            <h1 className="text-4xl font-bold text-[#3e2626] mb-4">
              Seu carrinho está vazio
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Que tal adicionar alguns móveis incríveis ao seu carrinho?
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={continueShopping}
                className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              >
                <span>Continuar Comprando</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push('/')}
                className="border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 flex items-center space-x-2"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar ao Início</span>
              </Button>
            </div>
          </div>
          
          {/* Recommended Products */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-[#3e2626] text-center mb-12">
              Produtos Recomendados
            </h2>
            
            {isLoadingRecommended ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626]"></div>
              </div>
            ) : recommendedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {recommendedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product as any}
                    variant="default"
                    showFavorite={true}
                    showAddToCart={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Nenhum produto disponível no momento.</p>
              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-50 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              onClick={() => router.back()}
              className="text-[#3e2626] hover:bg-[#3e2626]/10 rounded-full p-2 transition-all duration-200 hover:scale-110"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2626] bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] bg-clip-text text-transparent">
                Carrinho de Compras
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {cart.length} {cart.length === 1 ? 'item' : 'itens'} no seu carrinho
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline"
            onClick={handleClearCart}
            className="text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-400 rounded-full px-4 py-2 transition-all duration-200 hover:shadow-md"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Carrinho
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items - Agrupados por Loja */}
          <div className="lg:col-span-2 space-y-6">
            {/* Checkbox para selecionar todos */}
            <Card className="p-5 bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] border-2 border-[#3e2626] shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={cart.every(item => selectedProducts.has(item.product.id))}
                  onCheckedChange={(checked) => {
                    toggleAllProducts();
                  }}
                  className="h-5 w-5 border-white/50 data-[state=checked]:bg-white data-[state=checked]:border-white"
                />
                <label className="text-sm font-bold text-white cursor-pointer hover:text-gray-200 transition-colors flex items-center space-x-2" onClick={toggleAllProducts}>
                  <span>Selecionar todos</span>
                  <Badge className="bg-white text-[#3e2626] font-bold px-2 py-0.5 ml-1">
                    {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                  </Badge>
                </label>
              </div>
            </Card>

            {/* Mensagem para usuários sem endereço completo */}
            {isAuthenticated && user && !(user?.city && user?.state && user?.zipCode) && (
              <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-blue-800 text-lg mb-2">
                      Endereço para entrega otimizada
                    </h3>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      Para garantir que você receba seus produtos da loja mais próxima, informe seu endereço completo durante o checkout.
                      Isso nos ajuda a otimizar o frete e a entrega dos seus móveis!
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Agrupar por loja */}
            {Object.entries(productsByStore).map(([storeId, storeData]) => (
              <Card key={storeId} className="overflow-hidden shadow-xl border-2 border-gray-200 hover:shadow-2xl hover:border-[#3e2626]/40 transition-all duration-300 bg-white">
                {/* Header da Loja */}
                <div className="bg-gradient-to-r from-[#3e2626] via-[#4a2f2f] to-[#3e2626] p-5 border-b-2 border-[#5a3a3a] shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <StoreCheckbox
                        checked={isStoreSelected(storeId)}
                        indeterminate={isStorePartiallySelected(storeId)}
                        onCheckedChange={() => toggleStoreSelection(storeId)}
                      />
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
                          <Store className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-white drop-shadow-sm">
                            {storeData.storeName}
                          </h3>
                          {storeData.storeAddress && (
                            <p className="text-xs text-white/80 mt-0.5">{storeData.storeAddress}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className="text-xs bg-white text-[#3e2626] font-bold px-3 py-1 shadow-md border-2 border-white/50">
                      {storeData.items.length} {storeData.items.length === 1 ? 'produto' : 'produtos'}
                    </Badge>
                  </div>
                </div>

                {/* Produtos da Loja */}
                <div className="divide-y divide-gray-200">
                  {storeData.items.map((item, index) => (
                    <div 
                      key={item.id || `${item.product.id}-${index}`} 
                      className="relative flex flex-col sm:flex-row p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:via-blue-50/30 hover:to-gray-50 transition-all duration-300 group"
                    >
                      {/* Background decoration */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Checkbox do produto */}
                      <div className="flex items-start space-x-4 mb-4 sm:mb-0 sm:mr-6 relative z-10">
                        <div className="pt-1">
                          <Checkbox
                            checked={selectedProducts.has(item.product.id)}
                            onCheckedChange={() => toggleProductSelection(item.product.id)}
                            className="h-5 w-5 border-2"
                          />
                        </div>
                        {/* Product Image */}
                        <div className="sm:w-36 h-36 sm:h-auto relative overflow-hidden rounded-xl flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 border-2 border-gray-100 group-hover:border-[#3e2626]/30 group-hover:scale-[1.02]">
                          {(() => {
                            const imageUrl = item.product.imageUrls && item.product.imageUrls.length > 0 
                              ? item.product.imageUrls[0] 
                              : item.product.imageUrl;
                            return imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  console.error('Erro ao carregar imagem:', imageUrl);
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : (
                              <div 
                                className="w-full h-full flex items-center justify-center relative"
                                style={{ backgroundColor: item.product.color || '#8B4513' }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/30"></div>
                                <div className="relative z-10 text-center">
                                  {renderCategoryIcon(item.product.category)}
                                  <p className="text-white font-semibold text-xs mt-1 drop-shadow-lg">Móvel</p>
                                </div>
                              </div>
                            );
                          })()}
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0 relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-xl font-bold text-[#3e2626] mb-1 group-hover:text-[#5a3a3a] transition-colors pr-2">
                                {item.product.name}
                              </h3>
                              {/* Actions */}
                              <div className="flex space-x-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => addToFavorites(item.product)}
                                  className="text-gray-400 hover:text-red-500 h-9 w-9 p-0 rounded-full hover:bg-red-50 transition-all duration-200"
                                >
                                  <Heart className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="text-gray-400 hover:text-red-600 h-9 w-9 p-0 rounded-full hover:bg-red-50 transition-all duration-200"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {item.product.description && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                                {item.product.description}
                              </p>
                            )}
                            
                            {/* Product Details */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {item.product.category && (
                                <Badge variant="secondary" className="text-xs  border border-blue-200 hover:bg-blue-100 transition-colors">
                                  <div className="flex items-center space-x-1">
                                    {renderCategoryIcon(item.product.category)}
                                    <span className="capitalize font-semibold">{item.product.category}</span>
                                  </div>
                                </Badge>
                              )}
                              {item.product.brand && (
                                <Badge variant="secondary" className="text-xs  border border-purple-200 hover:bg-purple-100 transition-colors">
                                  <div className="flex items-center space-x-1">
                                    <Tag className="h-3 w-3" />
                                    <span className="font-semibold">{item.product.brand}</span>
                                  </div>
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Price and Quantity */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50/50 to-transparent rounded-lg p-4 -mx-4 sm:-mx-0">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-semibold text-gray-600">Quantidade:</span>
                            <div className="flex items-center space-x-1 border-2 border-gray-300 rounded-xl hover:border-[#3e2626] transition-all duration-200 bg-white shadow-sm">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-10 h-10 p-0 hover:bg-[#3e2626]/10 disabled:opacity-30 rounded-l-xl"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-lg font-bold text-[#3e2626] min-w-[3rem] text-center px-2 border-x border-gray-200">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                                className="w-10 h-10 p-0 hover:bg-[#3e2626]/10 rounded-r-xl"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-right sm:text-left">
                            {(() => {
                              const originalPrice = Number(item.product.price);
                              const currentPrice = getCurrentPrice(item.product);
                              const hasDiscount = currentPrice < originalPrice;
                              const itemTotal = currentPrice * item.quantity;
                              
                              return (
                                <>
                                  <div className="flex items-baseline space-x-2">
                                    <span className="text-sm text-gray-500">Total:</span>
                                    <div className="flex flex-col items-end sm:items-start">
                                      <div className="text-2xl font-bold text-[#3e2626] bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] bg-clip-text text-transparent">
                                        R$ {itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </div>
                                      {hasDiscount && (
                                        <div className="text-xs text-gray-500 line-through mt-0.5">
                                          R$ {(originalPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {item.quantity > 1 && (
                                    <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                                      <span>R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                      {hasDiscount && (
                                        <span className="text-gray-400 line-through ml-1">
                                          R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                      )}
                                      <span className="text-gray-400">×</span>
                                      <span>{item.quantity} un.</span>
                                    </div>
                                  )}
                                  {hasDiscount && item.product.isFlashSale && (
                                    <div className="mt-1">
                                      <Badge className="bg-yellow-500 text-white text-xs font-bold">
                                        <Zap className="h-3 w-3 mr-1" />
                                        Oferta Relâmpago
                                      </Badge>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="top-8 shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Resumo do Pedido</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6 bg-white rounded-b-lg">
                {/* Order Details */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                    <span className="text-gray-600">Subtotal ({selectedCartItems.length} {selectedCartItems.length === 1 ? 'item selecionado' : 'itens selecionados'})</span>
                    <span className="font-semibold text-[#3e2626]">
                      R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                
                 
                  
                  <div className="border-t-2 border-[#3e2626] pt-4 mt-4">
                    <div className="flex justify-between text-xl font-bold text-[#3e2626]">
                      <span>Total</span>
                      <span className="text-2xl">R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
                
               
                
                {/* Checkout Button */}
                <div className="w-full">
                  <Button 
                    onClick={handleCheckout}
                    disabled={isCheckingOut || selectedCartItems.length === 0 || !isAuthenticated}
                    className="w-full bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white hover:from-[#2a1f1f] hover:to-[#3e2626] py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCheckingOut ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        <span>Continuar</span>
                      </>
                    )}
                  </Button>
                  
                  {/* Mensagem informativa quando desabilitado */}
                  {!isAuthenticated && selectedCartItems.length > 0 && (
                    <p className="mt-2 text-sm text-center text-amber-600 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Faça login para continuar com a compra</span>
                      </span>
                    </p>
                  )}
                  {selectedCartItems.length === 0 && (
                    <p className="mt-2 text-sm text-center text-gray-500">
                      Selecione pelo menos um produto para continuar
                    </p>
                  )}
                </div>
                
                {/* Continue Shopping */}
                <Button 
                  variant="outline"
                  onClick={continueShopping}
                  className="w-full border-2 border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white py-3 rounded-full font-semibold transition-all duration-300 hover:shadow-md"
                >
                  Continuar Comprando
                </Button>
              </CardContent>
            </Card>
            
            {/* Payment Methods Section */}
            <Card className="shadow-xl rounded-lg  border-2 border-gray-100 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-[#3e2626] flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Pagamento</span>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  Formas de pagamento aceitas
                </CardDescription>
              </CardHeader>
              
              {/* Pagamento Section */}
            <div className="flex flex-col">
            
              <div className="grid grid-cols-3 gap-2.5">
                {/* VISA - Substitua a URL abaixo pela sua imagem */}
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12 hover:scale-105 transition-transform">
                  <img 
                    src="https://down-br.img.susercontent.com/file/a65c5d1c5e556c6197f8fbd607482372" 
                    alt="Visa" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
                
                {/* Mastercard - Substitua a URL abaixo pela sua imagem */}
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12 hover:scale-105 transition-transform">
                  <img 
                    src="https://down-br.img.susercontent.com/file/95d849253f75d5e6e6b867af4f7c65aa" 
                    alt="Mastercard" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
                
                {/* Elo - Substitua a URL abaixo pela sua imagem */}
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12 hover:scale-105 transition-transform">
                  <img 
                    src="https://down-br.img.susercontent.com/file/br-11134258-7r98o-lxsovyseln7jc5" 
                    alt="Elo" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
                
                {/* American Express - Substitua a URL abaixo pela sua imagem */}
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12 hover:scale-105 transition-transform">
                  <img 
                    src="https://down-br.img.susercontent.com/file/285e5ab6207eb562a9e893a42ff7ee46 " 
                    alt="American Express" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
                
                {/* Boleto - Substitua a URL abaixo pela sua imagem */}
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12 hover:scale-105 transition-transform">
                  <img 
                    src="https://down-br.img.susercontent.com/file/44734b7fc343eb46237c2d90c6c9ca60" 
                    alt="Boleto" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
                
                {/* PIX - Substitua a URL abaixo pela sua imagem */}
                <div className="bg-white rounded-lg p-2 flex items-center justify-center h-12 hover:scale-105 transition-transform">
                  <img 
                    src="https://down-br.img.susercontent.com/file/2a2cfeb34b00ef7b3be23ea516dcd1c5" 
                    alt="PIX" 
                    className="h-6 w-auto object-contain"
                  />
                </div>
              </div>
            </div>
            </Card>
          </div>
        </div>
        
        {/* Recommended Products */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-[#3e2626] text-center mb-12">
            Você também pode gostar
          </h2>
          
          {isLoadingRecommended ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626]"></div>
            </div>
          ) : recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendedProducts.map((product) => (
                <Card key={product.id} className="group relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="relative">
                    {product.imageUrl ? (
                      <div className="aspect-square relative overflow-hidden">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/20"></div>
                      </div>
                    ) : (
                      <div 
                        className="aspect-square flex items-center justify-center relative group"
                        style={{ backgroundColor: product.color }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/20"></div>
                        <div className="relative z-10 text-center">
                          {renderCategoryIcon(product.category)}
                          <p className="text-white font-semibold text-sm mt-2">Móvel Premium</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Favorite Tooltip */}
                    <FavoriteTooltip productId={product.id} />
                    
                    {/* Discount Badge */}
                    {product.originalPrice && (
                      <div className="absolute top-4 left-4 z-20">
                        <Badge className="bg-red-500 text-white">
                          -{calculateDiscount(product.originalPrice, product.price)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-[#3e2626] line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                    
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.rating.toFixed(1)} ({product.reviews} avaliações)
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-[#3e2626]">
                          R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            R$ {product.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => addToCart(product as any, 1)}
                        className="bg-[#3e2626] text-white hover:bg-[#2a1f1f] rounded-full w-10 h-10 p-0 hover:scale-110 transition-all duration-300"
                      >
                        <ShoppingCart className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum produto disponível no momento.</p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />

      {/* Modal de Teste de IA */}
      <AITestModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onContinue={handleContinueToCheckout}
        products={selectedCartItems.map(item => ({
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
          color: item.product.color,
          category: item.product.category,
        }))}
      />
    </div>
  );
}






