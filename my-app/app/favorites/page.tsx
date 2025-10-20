'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { customerAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  Search, 
  ShoppingCart, 
  User, 
  Star, 
  ArrowLeft, 
  ArrowRight,
  Grid,
  List,
  Trash2,
  Package,
  Sofa,
  Table,
  UserCircle,
  Bed,
  Frame,
  Lamp,
  ChevronDown,
  RefreshCw,
  Share2,
  Calendar,
  DollarSign,
  MapPin,
  Plus,
  X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

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

export default function FavoritesPage() {
  const { user, isAuthenticated } = useAppStore();
  const router = useRouter();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Verificar autenticação
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Carregar favoritos
  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getFavorites(1, 20);
      setFavorites(response.favorites || []);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      // Dados mock para demonstração
      setFavorites([
        {
          id: '1',
          product: {
            id: '1',
            name: 'Sofá 3 Lugares Moderno',
            description: 'Sofá confortável com design moderno',
            price: 2500,
            imageUrls: ['/image.png'],
            category: 'SOFA',
            brand: 'MobiliAI',
            rating: 4.8,
            reviewCount: 24,
            isFeatured: true,
            isNew: false,
            isBestSeller: true,
            store: { name: 'Loja Central' }
          },
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          product: {
            id: '2',
            name: 'Mesa de Jantar Rústica',
            description: 'Mesa de jantar em madeira rústica',
            price: 1800,
            imageUrls: ['/image.png'],
            category: 'MESA',
            brand: 'MobiliAI',
            rating: 4.6,
            reviewCount: 18,
            isFeatured: false,
            isNew: true,
            isBestSeller: false,
            store: { name: 'Loja Central' }
          },
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated]);

  // Remover dos favoritos
  const removeFromFavorites = async (productId: string) => {
    try {
      await customerAPI.removeFromFavorites(productId);
      setFavorites(prev => prev.filter(fav => fav.product.id !== productId));
      toast.success('Produto removido dos favoritos');
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      toast.error('Erro ao remover dos favoritos');
    }
  };

  // Adicionar ao carrinho
  const addToCart = async (productId: string) => {
    try {
      await customerAPI.addToCart(productId, 1);
      toast.success('Produto adicionado ao carrinho!');
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho');
    }
  };

  // Filtrar favoritos
  const filteredFavorites = favorites.filter(fav => 
    fav.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fav.product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Renderizar estrelas
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


  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Simples */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MobiliAI</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/favorites" className="relative">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {favorites.length}
                </Badge>
              </Link>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2"
              >
                <User className="w-5 h-5" />
                <span>{user?.name}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Favoritos</h1>
          <p className="text-gray-600">Produtos que você salvou para depois</p>
        </div>

        {/* Busca e Controles */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar nos favoritos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Lista de Favoritos */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum favorito ainda'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Tente ajustar sua busca'
                  : 'Adicione produtos aos favoritos para vê-los aqui'
                }
              </p>
              <Link href="/">
                <Button>
                  <Package className="w-4 h-4 mr-2" />
                  Explorar Produtos
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {filteredFavorites.map((favorite) => (
              <Card key={favorite.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="relative">
                    <Image
                      src={favorite.product.imageUrls[0] || '/image.png'}
                      alt={favorite.product.name}
                      width={400}
                      height={250}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex space-x-2">
                      {favorite.product.isFeatured && (
                        <Badge className="bg-blue-500 text-white">Destaque</Badge>
                      )}
                      {favorite.product.isNew && (
                        <Badge className="bg-green-500 text-white">Novo</Badge>
                      )}
                    </div>

                    {/* Botão Remover */}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFromFavorites(favorite.product.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {favorite.product.category}
                      </Badge>
                      <div className="flex items-center">
                        {renderStars(favorite.product.rating)}
                        <span className="text-sm text-gray-500 ml-1">
                          ({favorite.product.reviewCount})
                        </span>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {favorite.product.name}
                    </h3>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {favorite.product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-gray-900">
                          R$ {favorite.product.price.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {favorite.product.store.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button
                        className="flex-1"
                        onClick={() => addToCart(favorite.product.id)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Comprar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => removeFromFavorites(favorite.product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
