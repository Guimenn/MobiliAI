'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  ShoppingCart, 
  Trash2, 
  RefreshCw,
  TrendingUp,
  Package,
  Sofa,
  Table,
  UserCircle,
  Bed,
  Frame,
  Lamp,
  Eye,
  Heart,
  Share2,
  BookmarkPlus,
  Calendar,
  MapPin
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { customerAPI } from '@/lib/api';

interface FavoriteProduct {
  id: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrls: string[];
    category: string;
    brand: string;
    colorName?: string;
    colorHex?: string;
    rating: number;
    reviewCount: number;
    isFeatured: boolean;
    isNew: boolean;
    isBestSeller: boolean;
    store: {
      name: string;
    };
  };
  createdAt: string;
}

interface FavoriteProductCardProps {
  favorite: FavoriteProduct;
  viewMode: 'grid' | 'list';
  onRemove: (productId: string) => void;
  isRemoving: boolean;
}

export default function FavoriteProductCard({ 
  favorite, 
  viewMode, 
  onRemove, 
  isRemoving 
}: FavoriteProductCardProps) {
  
  // Renderizar ícone de categoria
  const renderCategoryIcon = (category: string) => {
    const icons = {
      SOFA: Sofa,
      MESA: Table,
      CADEIRA: UserCircle,
      CAMA: Bed,
      DECORACAO: Frame,
      ILUMINACAO: Lamp,
      OUTROS: Package
    };
    
    const IconComponent = icons[category as keyof typeof icons] || Package;
    return <IconComponent className="w-4 h-4" />;
  };

  // Renderizar estrelas de avaliação
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  // Adicionar ao carrinho
  const handleAddToCart = async () => {
    try {
      await customerAPI.addToCart(favorite.product.id, 1);
      toast.success('Produto adicionado ao carrinho!');
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho');
    }
  };

  // Compartilhar produto
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: favorite.product.name,
          text: favorite.product.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback: copiar URL para clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (viewMode === 'list') {
    return (
      <Card className="group bg-white/70 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
        <div className="flex">
          {/* Image */}
          <div className="relative w-48 h-32 flex-shrink-0 overflow-hidden rounded-l-lg">
            <Image
              src={favorite.product.imageUrls[0] || '/image.png'}
              alt={favorite.product.name}
              width={200}
              height={130}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col space-y-1">
              {favorite.product.isFeatured && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Destaque
                </Badge>
              )}
              {favorite.product.isNew && (
                <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs">
                  Novo
                </Badge>
              )}
              {favorite.product.isBestSeller && (
                <Badge className="bg-gradient-to-r from-purple-400 to-violet-500 text-white text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Mais Vendido
                </Badge>
              )}
            </div>

            {/* Color Indicator */}
            {favorite.product.colorHex && (
              <div className="absolute bottom-2 left-2">
                <div
                  className="w-5 h-5 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: favorite.product.colorHex }}
                  title={favorite.product.colorName}
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                {/* Category */}
                <div className="flex items-center space-x-2 mb-2">
                  {renderCategoryIcon(favorite.product.category)}
                  <Badge variant="outline" className="text-xs">
                    {favorite.product.category}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Adicionado em {formatDate(favorite.createdAt)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  {favorite.product.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {favorite.product.description}
                </p>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center">
                    {renderStars(favorite.product.rating)}
                  </div>
                  <span className="text-sm text-gray-500">
                    ({favorite.product.reviewCount} avaliações)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="text-right ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  R$ {favorite.product.price.toLocaleString('pt-BR')}
                </p>
                <p className="text-sm text-gray-500">
                  {favorite.product.store.name}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddToCart}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 hover:from-blue-600 hover:to-indigo-600"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Adicionar ao Carrinho
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="hover:bg-blue-50"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(favorite.product.id)}
                disabled={isRemoving}
                className="text-red-500 border-red-200 hover:bg-red-50"
              >
                {isRemoving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="group bg-white/70 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <Image
            src={favorite.product.imageUrls[0] || '/image.png'}
            alt={favorite.product.name}
            width={400}
            height={300}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {favorite.product.isFeatured && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Star className="w-3 h-3 mr-1" />
                Destaque
              </Badge>
            )}
            {favorite.product.isNew && (
              <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white">
                Novo
              </Badge>
            )}
            {favorite.product.isBestSeller && (
              <Badge className="bg-gradient-to-r from-purple-400 to-violet-500 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                Mais Vendido
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="secondary"
              className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm hover:bg-white"
              onClick={() => onRemove(favorite.product.id)}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 text-red-500" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm hover:bg-white"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 text-blue-500" />
            </Button>
          </div>

          {/* Color Indicator */}
          {favorite.product.colorHex && (
            <div className="absolute bottom-3 left-3">
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: favorite.product.colorHex }}
                title={favorite.product.colorName}
              />
            </div>
          )}

          {/* Date Badge */}
          <div className="absolute bottom-3 right-3">
            <Badge className="bg-black/50 text-white text-xs backdrop-blur-sm">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(favorite.createdAt)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Category */}
          <div className="flex items-center space-x-2">
            {renderCategoryIcon(favorite.product.category)}
            <Badge variant="outline" className="text-xs">
              {favorite.product.category}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {favorite.product.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2">
            {favorite.product.description}
          </p>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {renderStars(favorite.product.rating)}
            </div>
            <span className="text-sm text-gray-500">
              ({favorite.product.reviewCount})
            </span>
          </div>

          {/* Price and Store */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-900">
                R$ {favorite.product.price.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {favorite.product.store.name}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 hover:from-blue-600 hover:to-indigo-600"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Comprar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(favorite.product.id)}
              disabled={isRemoving}
              className="text-red-500 border-red-200 hover:bg-red-50"
            >
              {isRemoving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
