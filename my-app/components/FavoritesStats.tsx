'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Heart, 
  Package, 
  DollarSign, 
  Star, 
  TrendingUp,
  Calendar,
  MapPin,
  Award,
  Zap,
  Target
} from 'lucide-react';

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

interface FavoritesStatsProps {
  favorites: FavoriteProduct[];
}

export default function FavoritesStats({ favorites }: FavoritesStatsProps) {
  // Calcular estatísticas
  const totalFavorites = favorites.length;
  const totalValue = favorites.reduce((sum, fav) => sum + fav.product.price, 0);
  const averageRating = favorites.length > 0 
    ? favorites.reduce((sum, fav) => sum + fav.product.rating, 0) / favorites.length 
    : 0;
  
  const categories = new Set(favorites.map(f => f.product.category)).size;
  const brands = new Set(favorites.map(f => f.product.brand)).size;
  
  const mostExpensive = favorites.reduce((max, fav) => 
    fav.product.price > max.product.price ? fav : max, 
    favorites[0]
  );
  
  const highestRated = favorites.reduce((max, fav) => 
    fav.product.rating > max.product.rating ? fav : max, 
    favorites[0]
  );

  // Produtos mais recentes
  const recentFavorites = favorites
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Categorias mais populares
  const categoryCount = favorites.reduce((acc, fav) => {
    acc[fav.product.category] = (acc[fav.product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topCategory = Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)[0];

  const stats = [
    {
      title: 'Total de Favoritos',
      value: totalFavorites.toString(),
      icon: Heart,
      color: 'from-red-50 to-pink-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-500',
      valueColor: 'text-red-700'
    },
    {
      title: 'Categorias Diferentes',
      value: categories.toString(),
      icon: Package,
      color: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500',
      valueColor: 'text-blue-700'
    },
    {
      title: 'Valor Total',
      value: `R$ ${totalValue.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-500',
      valueColor: 'text-green-700'
    },
    {
      title: 'Média de Avaliação',
      value: averageRating.toFixed(1),
      icon: Star,
      color: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-500',
      valueColor: 'text-purple-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card 
              key={index}
              className={`bg-gradient-to-br ${stat.color} ${stat.borderColor} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className={`text-3xl font-bold ${stat.valueColor}`}>
                      {stat.value}
                    </p>
                  </div>
                  <IconComponent className={`w-8 h-8 ${stat.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Categoria Favorita
              </h3>
            </div>
            {topCategory && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {topCategory[0]}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {topCategory[1]} produtos
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(topCategory[1] / totalFavorites) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Insights Rápidos
              </h3>
            </div>
            <div className="space-y-3">
              {mostExpensive && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Produto mais caro:</span>
                  <span className="font-medium text-gray-900">
                    R$ {mostExpensive.product.price.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
              
              {highestRated && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Melhor avaliado:</span>
                  <span className="font-medium text-gray-900">
                    {highestRated.product.rating}/5 ⭐
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Marcas diferentes:</span>
                <span className="font-medium text-gray-900">{brands}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Favorites */}
      {recentFavorites.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Adicionados Recentemente
              </h3>
            </div>
            <div className="space-y-3">
              {recentFavorites.map((favorite, index) => (
                <div key={favorite.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {favorite.product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(favorite.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900">
                      R$ {favorite.product.price.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
