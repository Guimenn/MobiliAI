'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/lib/store';
import { useAppStore } from '@/lib/store';
import FavoriteTooltip from '@/components/FavoriteTooltip';
import { customerAPI } from '@/lib/api';
import { 
  ShoppingCart, 
  Star, 
  Zap,
  Truck,
  CreditCard,
  Package,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
  showFavorite?: boolean;
  showAddToCart?: boolean;
  className?: string;
  onClick?: () => void;
}

// Função para formatar categoria
const formatCategory = (category: string | undefined): string => {
  if (!category) return '';
  const categoryMap: { [key: string]: string } = {
    'sofa': 'Sofá',
    'mesa': 'Mesa',
    'cadeira': 'Cadeira',
    'estante': 'Estante',
    'poltrona': 'Poltrona',
    'quadro': 'Quadro',
    'luminaria': 'Luminária',
    'mesa_centro': 'Mesa de Centro',
    'armario': 'Armário',
    'cama': 'Cama',
    'decoracao': 'Decoração',
    'iluminacao': 'Iluminação'
  };
  return categoryMap[category.toLowerCase()] || category;
};

export default function ProductCard({
  product,
  variant = 'default',
  showFavorite = true,
  showAddToCart = true,
  className = '',
  onClick
}: ProductCardProps) {
  const router = useRouter();
  const { addToCart, isAuthenticated, user } = useAppStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  // Verificar se há oferta ativa
  const isSaleActive = (product: Product): boolean => {
    const now = new Date();
    
    if (product.isFlashSale) {
      if (product.flashSaleStartDate && product.flashSaleEndDate) {
        const start = new Date(product.flashSaleStartDate);
        const end = new Date(product.flashSaleEndDate);
        return now >= start && now <= end;
      }
      return true;
    }
    
    if (product.isOnSale) {
      if (product.saleStartDate && product.saleEndDate) {
        const start = new Date(product.saleStartDate);
        const end = new Date(product.saleEndDate);
        return now >= start && now <= end;
      }
      return true;
    }
    
    return false;
  };

  const hasActiveSale = isSaleActive(product);
  const isFlashSaleActive = hasActiveSale && product.isFlashSale;
  const isNormalSaleActive = hasActiveSale && product.isOnSale && !product.isFlashSale;

  // Calcular preço atual
  const getCurrentPrice = (product: Product): number => {
    if (isFlashSaleActive && product.flashSalePrice) {
      return parseFloat(product.flashSalePrice.toString());
    }
    if (isFlashSaleActive && product.flashSaleDiscountPercent && product.price) {
      const discount = parseFloat(product.flashSaleDiscountPercent.toString()) / 100;
      return parseFloat(product.price.toString()) * (1 - discount);
    }
    if (isNormalSaleActive && product.salePrice) {
      return parseFloat(product.salePrice.toString());
    }
    if (isNormalSaleActive && product.saleDiscountPercent && product.price) {
      const discount = parseFloat(product.saleDiscountPercent.toString()) / 100;
      return parseFloat(product.price.toString()) * (1 - discount);
    }
    return product.price ? parseFloat(product.price.toString()) : 0;
  };

  const currentPrice = getCurrentPrice(product);
  const originalPrice = product.price ? parseFloat(product.price.toString()) : 0;

  // Calcular percentual de desconto
  const discountPercent = isFlashSaleActive && product.flashSaleDiscountPercent
    ? product.flashSaleDiscountPercent
    : isNormalSaleActive && product.saleDiscountPercent
    ? product.saleDiscountPercent
    : hasActiveSale && originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  // Obter imagem do produto
  const imageUrl = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : product.imageUrl;

  // Calcular parcelamento
  const installmentValue = currentPrice / 12;
  const isOutOfStock = (product.stock || 0) === 0;
  const hasReviews = (product.reviewCount || 0) > 0 && (product.rating || 0) > 0;
  const rating = product.rating || 0;
  const reviewCount = product.reviewCount || 0;

  // Verificar se está nos favoritos
  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated) {
        setIsFavorite(false);
        return;
      }
      
      try {
        const response = await customerAPI.checkFavorite(product.id);
        setIsFavorite(response.isFavorite || false);
      } catch (error: any) {
        setIsFavorite(false);
      }
    };

    if (isAuthenticated) {
      checkFavorite();
    } else {
      setIsFavorite(false);
    }
  }, [product.id, isAuthenticated]);

  // Handler para toggle favorito
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // VERIFICAÇÃO CRÍTICA: Verificar token diretamente
    const store = useAppStore.getState();
    const hasToken = !!store.token;
    const hasUser = !!store.user;
    const isReallyAuthenticated = hasToken && hasUser && store.isAuthenticated;
    
    // Se não estiver autenticado, SEMPRE mostrar mensagem de erro e retornar
    if (!isReallyAuthenticated || !isAuthenticated || !hasToken) {
      toast.error('Faça login para adicionar aos favoritos');
      return;
    }

    if (isFavoriteLoading) return;

    try {
      setIsFavoriteLoading(true);
      
      // Verificar novamente antes de fazer qualquer chamada
      const currentStore = useAppStore.getState();
      if (!currentStore.token || !currentStore.user || !currentStore.isAuthenticated) {
        toast.error('Faça login para adicionar aos favoritos');
        return;
      }
      
      if (isFavorite) {
        await customerAPI.removeFromFavorites(product.id);
        const checkResponse = await customerAPI.checkFavorite(product.id);
        setIsFavorite(checkResponse.isFavorite || false);
        // Verificar novamente autenticação ANTES de mostrar mensagem
        const finalCheck = useAppStore.getState();
        if (!checkResponse.isFavorite && finalCheck.token && finalCheck.user && finalCheck.isAuthenticated) {
          toast.success('Produto removido dos favoritos');
        }
      } else {
        await customerAPI.addToFavorites(product.id);
        const checkResponse = await customerAPI.checkFavorite(product.id);
        setIsFavorite(checkResponse.isFavorite || false);
        
        // VERIFICAÇÃO FINAL ABSOLUTA: Verificar token, user E isAuthenticated antes de mostrar sucesso
        const finalCheck = useAppStore.getState();
        const canShowSuccess = finalCheck.token && 
                               finalCheck.user && 
                               finalCheck.isAuthenticated && 
                               checkResponse.isFavorite;
        
        if (canShowSuccess) {
          window.dispatchEvent(new CustomEvent('notification:favorite-added'));
          toast.success('Produto adicionado aos favoritos');
        } else {
          // Se não passou na verificação, mostrar erro
          toast.error('Faça login para adicionar aos favoritos');
        }
      }
    } catch (error: any) {
      console.error('Erro ao alternar favorito:', error);
      // SEMPRE mostrar erro de autenticação se não estiver autenticado
      const errorCheck = useAppStore.getState();
      if (!errorCheck.token || !errorCheck.user || 
          error?.response?.status === 401 || 
          error?.response?.status === 403 || 
          error?.message === 'Usuário não autenticado') {
        toast.error('Faça login para adicionar aos favoritos');
      } else {
        toast.error(error?.response?.data?.message || 'Erro ao atualizar favoritos');
      }
      setIsFavorite(!isFavorite);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // Handler para adicionar ao carrinho
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error('Produto fora de estoque');
      return;
    }
    try {
      // Determinar qual loja usar para este produto
      let storeInfo = undefined;

      if (product.storeInventory && Array.isArray(product.storeInventory) && product.storeInventory.length > 0) {
        // Filtrar lojas ativas com estoque
        const availableStores = product.storeInventory
          .filter((inv: any) => inv.store?.isActive && inv.quantity > 0 && inv.store?.name)
          .sort((a: any, b: any) => b.quantity - a.quantity); // Priorizar lojas com mais estoque

        if (availableStores.length > 0) {
          const selectedStore = availableStores[0];
          storeInfo = {
            storeId: selectedStore.storeId,
            storeName: selectedStore.store?.name,
            storeAddress: selectedStore.store?.address
          };
        }
      }

      await addToCart(product, 1, storeInfo);
      
      if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
        window.dispatchEvent(new CustomEvent('notification:cart-added'));
      }
      
      toast.success('Produto adicionado ao carrinho!', {
        description: product.name,
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
    }
  };

  // Handler para clicar no card
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/products/${product.id}`);
    }
  };

  // Variante compacta (para produtos relacionados)
  if (variant === 'compact') {
    return (
      <div
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative bg-white border border-gray-200 hover:border-[#3e2626] hover:shadow-lg rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${className}`}
      >
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500 scale-110"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="h-12 w-12" />
            </div>
          )}
          
          {isFlashSaleActive && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-[#3e2626] text-white font-bold shadow-lg flex items-center gap-1.5 px-2.5 py-1">
                <Zap className="h-3 w-3 fill-white" />
                {discountPercent > 0 ? `-${discountPercent}%` : 'RELÂMPAGO'}
              </Badge>
            </div>
          )}

          {/* Botão de favoritos no hover */}
          {showFavorite && isHovered && !isOutOfStock && (
            <div className="absolute top-2 right-2 z-20">
              <FavoriteTooltip productId={product.id} />
            </div>
          )}
        </div>

        <div className="p-3 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#3e2626] transition-colors">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              {hasActiveSale && originalPrice > currentPrice ? (
                <div className="space-y-0.5">
                  <span className="text-base font-bold text-[#3e2626]">
                    R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-gray-500 line-through block">
                    R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <span className="text-base font-bold text-[#3e2626]">
                  R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Variante padrão (grid)
  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative bg-white rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg flex flex-col h-full ${
        isFlashSaleActive 
          ? 'border-[#3e2626] hover:border-[#2a1f1f]' 
          : isNormalSaleActive
          ? 'border-[#3e2626]/50 hover:border-[#3e2626]'
          : 'border-gray-200 hover:border-[#3e2626]'
      } ${isOutOfStock ? 'opacity-75' : ''} ${className}`}
    >
      {/* Container da imagem */}
      <div 
        className="relative aspect-[4/3] bg-gray-50 overflow-hidden group/image"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            width={600}
            height={450}
            className="w-full h-full object-cover  transition-transform duration-500 ease-out scale-135"
            unoptimized
            onError={(e) => {
              console.error('Erro ao carregar imagem:', imageUrl);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package className="h-12 w-12 opacity-50" />
          </div>
        )}

        {/* Badge de Oferta Relâmpago */}
        {isFlashSaleActive && (
          <div className="absolute top-2 left-2 z-20">
            <Badge className="bg-[#3e2626] text-white font-bold shadow-lg flex items-center gap-1.5 px-2.5 py-1">
              <Zap className="h-3 w-3 fill-white" />
              <span className="text-xs">
                {discountPercent > 0 ? `-${discountPercent}%` : 'RELÂMPAGO'}
              </span>
            </Badge>
          </div>
        )}

        {/* Badge de Oferta Normal */}
        {isNormalSaleActive && discountPercent > 0 && (
          <div className="absolute top-2 left-2 z-20">
            <Badge className="bg-[#3e2626] text-white font-bold shadow-lg px-2.5 py-1">
              <span className="text-xs">-{discountPercent}%</span>
            </Badge>
          </div>
        )}

        {/* Badges de status */}
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-[#3e2626] text-white text-[10px] font-semibold px-2 py-0.5">
              Novo
            </Badge>
          )}
          {product.isBestSeller && (
            <Badge className="bg-[#3e2626] text-white text-[10px] font-semibold px-2 py-0.5">
              Top
            </Badge>
          )}
          {product.isFeatured && (
            <Badge className="bg-[#3e2626] text-white text-[10px] font-semibold px-2 py-0.5">
              Destaque
            </Badge>
          )}
        </div>

        {/* Indicador de estoque */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/30 z-30 flex items-center justify-center">
            <Badge className="bg-[#3e2626] text-white font-semibold px-3 py-1.5">
              Fora de Estoque
            </Badge>
          </div>
        )}

        {/* Botão de favoritos no hover da imagem */}
        {showFavorite && isAuthenticated && isHovered && !isOutOfStock && (
          <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
            <button
              type="button"
              onClick={handleToggleFavorite}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              disabled={isFavoriteLoading}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                shadow-lg transition-all duration-200
                ${isFavorite 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:text-red-500'
                }
                ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
              `}
              title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart 
                className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo do produto */}
      <div className="p-4 flex flex-col flex-1">
        <div className="space-y-3 flex-1">
          {/* Título e Marca */}
          <div>
            <h3 className="text-base font-bold text-[#3e2626] leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-[#2a1f1f] transition-colors">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-xs text-gray-500 mt-0.5">{product.brand}</p>
            )}
          </div>

          {/* Categoria */}
          {product.category && (
            <div>
              <Badge variant="outline" className="text-[10px] px-2 py-0 border-gray-200 text-gray-600">
                {formatCategory(product.category)}
              </Badge>
            </div>
          )}

          {/* Rating - sempre mostrar, mesmo sem avaliações */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => {
                const fullStars = Math.floor(rating);
                const hasHalfStar = rating % 1 >= 0.5;
                const isFullStar = i < fullStars;
                const isHalfStar = i === fullStars && hasHalfStar;
                const isEmptyStar = i >= fullStars + (hasHalfStar ? 1 : 0);

                if (isHalfStar) {
                  // Meia estrela: estrela cinza completa + estrela amarela cortada pela metade
                  return (
                    <div key={i} className="relative h-3 w-3 inline-block">
                      <Star className="h-3 w-3 fill-gray-300 text-gray-300" />
                      <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                  );
                }

                return (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      isFullStar
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-300 text-gray-300'
                    }`}
                  />
                );
              })}
            </div>
            <span className={`text-xs font-medium ${hasReviews ? 'text-gray-700' : 'text-gray-500'}`}>
              {hasReviews ? rating.toFixed(1) : '0.0'}
            </span>
            <span className="text-xs text-gray-500">
              ({reviewCount > 1000 ? `${(reviewCount / 1000).toFixed(1)}k` : reviewCount})
            </span>
          </div>

          {/* Preço */}
          <div className="space-y-1">
            {hasActiveSale && originalPrice > currentPrice ? (
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-[#3e2626]">
                    R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xl font-black text-[#3e2626]">
                R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            )}
            
            {/* Parcelamento */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CreditCard className="h-3.5 w-3.5 text-[#3e2626]" />
              <span>ou 12x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros</span>
            </div>
          </div>
        </div>

        {/* Botão de adicionar ao carrinho - sempre alinhado na parte inferior */}
        {showAddToCart && (
          <Button 
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full rounded-lg transition-all duration-300 font-semibold text-sm py-5 mt-4 ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#3e2626] hover:bg-[#2a1f1f] text-white shadow-md hover:shadow-lg'
            }`}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isOutOfStock ? 'Fora de Estoque' : 'Adicionar ao Carrinho'}
          </Button>
        )}
      </div>
    </div>
  );
}
