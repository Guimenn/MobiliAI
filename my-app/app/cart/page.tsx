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

// Componente para checkbox com suporte a indeterminate
function StoreCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <Checkbox
      ref={checkboxRef}
      checked={checked}
      onChange={onChange}
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
      const storeId = item.product.storeId;
      if (storeId && storeId !== 'unknown' && storeId !== '' && !item.product.storeName && !storeInfoCache[storeId]) {
        missingInfo.push({ productId: item.product.id, storeId });
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
      'outros': PackageIcon,
    };
    
    const IconComponent = iconMap[category] || PackageIcon;
    return <IconComponent className="h-6 w-6" />;
  };

  // Função para calcular desconto
  const calculateDiscount = (originalPrice: number, currentPrice: number) => {
    if (originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  // Agrupar produtos por loja
  const productsByStore = useMemo(() => {
    const grouped: { [storeId: string]: { storeName: string; storeAddress?: string; items: typeof cart } } = {};
    
    cart.forEach(item => {
      const storeId = item.product.storeId || 'unknown';
      // Usar informações do produto, cache ou fallback
      // Se não tiver storeName, tenta usar o cache ou gera um nome baseado no ID
      let storeName = item.product.storeName;
      if (!storeName) {
        storeName = storeInfoCache[storeId]?.name;
        if (!storeName && storeId !== 'unknown') {
          storeName = `Loja ${storeId.substring(0, 8)}`;
        } else if (!storeName) {
          storeName = 'Loja não identificada';
        }
      }
      const storeAddress = item.product.storeAddress || storeInfoCache[storeId]?.address;
      
      if (!grouped[storeId]) {
        grouped[storeId] = {
          storeName,
          storeAddress,
          items: []
        };
      }
      grouped[storeId].items.push(item);
    });
    
    return grouped;
  }, [cart, storeInfoCache]);

  // Produtos selecionados
  const selectedCartItems = useMemo(() => {
    return cart.filter(item => selectedProducts.has(item.product.id));
  }, [cart, selectedProducts]);

  // Calcular total dos produtos selecionados
  const selectedTotal = useMemo(() => {
    return selectedCartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }, [selectedCartItems]);

  // Função para calcular frete baseado no total selecionado
  const calculateShipping = () => {
    if (selectedTotal >= 500) return 0; // Frete grátis acima de R$ 500
    return 29.90; // Frete padrão
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
  const handleCheckout = async () => {
    if (selectedCartItems.length === 0) {
      alert('Selecione pelo menos um produto para finalizar a compra');
      return;
    }
    
    setIsCheckingOut(true);
    // Simular processo de checkout
    setTimeout(() => {
      setIsCheckingOut(false);
      alert(`Redirecionando para o pagamento de ${selectedCartItems.length} item(ns)...`);
      // Aqui você integraria com o sistema de pagamento
    }, 2000);
  };

  // Função para continuar comprando
  const continueShopping = () => {
    router.push('/products');
  };

  // Função para limpar carrinho
  const handleClearCart = () => {
    if (confirm('Tem certeza que deseja limpar o carrinho?')) {
      clearCart();
    }
  };

  // Função para adicionar aos favoritos
  const addToFavorites = (product: any) => {
    // Aqui você integraria com o sistema de favoritos
    alert(`${product.name} adicionado aos favoritos!`);
  };

  // Produtos recomendados (simulados)
  const recommendedProducts = [
    {
      id: 'rec1',
      name: 'Cadeira Executiva Premium',
      price: 899.99,
      originalPrice: 1199.99,
      category: 'cadeira',
      color: '#8B4513',
      rating: 4.8,
      reviews: 89,
      stock: 10,
      storeId: 'default-store'
    },
    {
      id: 'rec2',
      name: 'Mesa de Centro Elegante',
      price: 1299.99,
      originalPrice: 1599.99,
      category: 'mesa',
      color: '#D2B48C',
      rating: 4.7,
      reviews: 124,
      stock: 8,
      storeId: 'default-store'
    },
    {
      id: 'rec3',
      name: 'Luminária Pendant Moderna',
      price: 599.99,
      category: 'iluminacao',
      color: '#A0522D',
      rating: 4.6,
      reviews: 67,
      stock: 15,
      storeId: 'default-store'
    }
  ];

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header />
        
        {/* Empty Cart State */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recommendedProducts.map((product) => (
                <Card key={product.id} className="group relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="relative">
                    <div 
                      className="aspect-square flex items-center justify-center relative"
                      style={{ backgroundColor: product.color }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/20"></div>
                      <div className="relative z-10 text-center">
                        {renderCategoryIcon(product.category)}
                        <p className="text-white font-semibold text-sm mt-2">Móvel Premium</p>
                      </div>
                    </div>
                    
                    {/* Discount Badge */}
                    {product.originalPrice && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-500 text-white">
                          -{calculateDiscount(product.originalPrice, product.price)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-[#3e2626]">
                        {product.name}
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addToFavorites(product)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Heart className="h-5 w-5" />
                      </Button>
                    </div>
                    
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
                        {product.rating} ({product.reviews} avaliações)
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
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white page-with-fixed-header">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
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
                  onChange={toggleAllProducts}
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
                        onChange={() => toggleStoreSelection(storeId)}
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
                      key={item.product.id} 
                      className="relative flex flex-col sm:flex-row p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:via-blue-50/30 hover:to-gray-50 transition-all duration-300 group"
                    >
                      {/* Background decoration */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Checkbox do produto */}
                      <div className="flex items-start space-x-4 mb-4 sm:mb-0 sm:mr-6 relative z-10">
                        <div className="pt-1">
                          <Checkbox
                            checked={selectedProducts.has(item.product.id)}
                            onChange={() => toggleProductSelection(item.product.id)}
                            className="h-5 w-5 border-2"
                          />
                        </div>
                        {/* Product Image */}
                        <div className="sm:w-36 h-36 sm:h-auto relative overflow-hidden rounded-xl flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 border-2 border-gray-100 group-hover:border-[#3e2626]/30 group-hover:scale-[1.02]">
                          {item.product.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                          )}
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
                            <div className="flex items-baseline space-x-2">
                              <span className="text-sm text-gray-500">Total:</span>
                              <div className="text-2xl font-bold text-[#3e2626] bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] bg-clip-text text-transparent">
                                R$ {(item.product.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                                <span>R$ {item.product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <span className="text-gray-400">×</span>
                                <span>{item.quantity} un.</span>
                              </div>
                            )}
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
                  
                  <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                    <span className="text-gray-600">Frete</span>
                    <span className="font-semibold">
                      {calculateShipping() === 0 ? (
                        <span className="text-green-600 flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Grátis</span>
                        </span>
                      ) : (
                        `R$ ${calculateShipping().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      )}
                    </span>
                  </div>
                  
                  {calculateShipping() > 0 && (
                    <div className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-black-600" />
                        <span>Frete grátis para compras acima de R$ 500,00</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t-2 border-[#3e2626] pt-4 mt-4">
                    <div className="flex justify-between text-xl font-bold text-[#3e2626]">
                      <span>Total</span>
                      <span className="text-2xl">R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
                
               
                
                {/* Checkout Button */}
                <Button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut || selectedCartItems.length === 0}
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
                      <span>Finalizar Compra</span>
                    </>
                  )}
                </Button>
                
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
              
              <CardContent className="p-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {/* Mastercard */}
                  <div className="flex items-center justify-center p-3 bg-white rounded-lg border border-gray-200 hover:border-[#3e2626] hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <div className="flex items-center space-x-1">
                      <div className="w-6 h-6 rounded-full bg-red-500"></div>
                      <div className="w-6 h-6 rounded-full bg-orange-500 -ml-2"></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 ml-1 group-hover:text-[#3e2626]">MC</span>
                  </div>

                  {/* Visa */}
                  <div className="flex items-center justify-center p-3 bg-[#1a1f71] rounded-lg border border-gray-200 hover:border-[#3e2626] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <span className="text-white font-bold text-xs">VISA</span>
                  </div>

                  {/* Maestro */}
                  <div className="flex items-center justify-center p-3 bg-white rounded-lg border border-gray-200 hover:border-[#3e2626] hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <div className="flex items-center space-x-1">
                      <div className="w-6 h-6 rounded-full bg-red-500"></div>
                      <div className="w-6 h-6 rounded-full bg-blue-400 -ml-2"></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 ml-1 group-hover:text-[#3e2626]">M</span>
                  </div>

                  {/* Diners Club */}
                  <div className="flex items-center justify-center p-3 bg-[#0079be] rounded-lg border border-gray-200 hover:border-[#3e2626] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <span className="text-white font-semibold text-[10px]">DINERS</span>
                  </div>

                  {/* American Express */}
                  <div className="flex items-center justify-center p-3 bg-[#006fcf] rounded-lg border border-gray-200 hover:border-[#3e2626] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <span className="text-white font-bold text-[9px]">AMEX</span>
                  </div>

                  {/* Elo */}
                  <div className="flex items-center justify-center p-3 bg-black rounded-lg border border-gray-200 hover:border-[#3e2626] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <span className="text-white font-bold text-xs">elo</span>
                  </div>

                  {/* Hipercard */}
                  <div className="flex items-center justify-center p-3 bg-[#c41230] rounded-lg border border-gray-200 hover:border-[#3e2626] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <span className="text-white font-semibold text-[10px]">HIPERCARD</span>
                  </div>

                  {/* Boleto */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-gray-200 hover:border-[#3e2626] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="w-full h-4 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded mb-1"></div>
                    <span className="text-black font-semibold text-[10px]">BOLETO</span>
                  </div>

                  {/* PayPal */}
                  <div className="flex items-center justify-center p-3 bg-[#003087] rounded-lg border border-gray-200 hover:border-[#3e2626] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <span className="text-white font-bold text-xs">PayPal</span>
                  </div>

                  {/* Parcelamento */}
                  <div className="flex items-center justify-center p-3 bg-[#2d5016] rounded-lg border border-gray-200 hover:border-[#3e2626] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <span className="text-white font-semibold text-[9px]">PARCELAMENTO</span>
                  </div>

                  {/* Caixa */}
                  <div className="flex items-center justify-center p-3 bg-[#0066cc] rounded-lg border border-gray-200 hover:border-[#3e2626] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <span className="text-white font-bold text-xs">CAIXA</span>
                  </div>

                  {/* Apple Pay */}
                  <div className="flex items-center justify-center p-3 bg-white rounded-lg border-2 border-black hover:border-[#3e2626] hover:shadow-md transition-all duration-200 cursor-pointer">
                    <span className="text-black font-semibold text-xs">Apple Pay</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Seus dados estão protegidos e criptografados
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Recommended Products */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-[#3e2626] text-center mb-12">
            Você também pode gostar
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recommendedProducts.map((product) => (
              <Card key={product.id} className="group relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
                <div className="relative">
                  <div 
                    className="aspect-square flex items-center justify-center relative group"
                    style={{ backgroundColor: product.color }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/20"></div>
                    <div className="relative z-10 text-center">
                      {renderCategoryIcon(product.category)}
                      <p className="text-white font-semibold text-sm mt-2">Móvel Premium</p>
                    </div>
                    {/* Favorite Tooltip */}
                    <FavoriteTooltip productId={product.id} />
                  </div>
                  
                  {/* Discount Badge */}
                  {product.originalPrice && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-500 text-white">
                        -{calculateDiscount(product.originalPrice, product.price)}%
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-[#3e2626]">
                      {product.name}
                    </h3>
                  </div>
                  
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
                      {product.rating} ({product.reviews} avaliações)
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
        </div>
      </div>
      
      <Footer />
    </div>
  );
}






