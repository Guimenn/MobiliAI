'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Grid,
  List,
  Trash2,
  Package,
  CheckCircle2,
  Truck,
  CreditCard,
  X,
  Plus,
  Share2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
      id: string;
    } | null;
  };
  createdAt: string;
}

export default function FavoritesPage() {
  const { user, isAuthenticated, addToCart: addToCartStore } = useAppStore();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc' | 'name'>('recent');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<FavoriteProduct[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      const response = await customerAPI.getFavorites(1, 100);
      setFavorites(response.favorites || []);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setFavorites([]);
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
  const handleAddToCart = async (product: FavoriteProduct['product']) => {
    try {
      // Mapear categoria para o formato esperado
      const categoryMap: Record<string, 'sofa' | 'mesa' | 'cadeira' | 'armario' | 'cama' | 'decoracao' | 'iluminacao' | 'mesa_centro'> = {
        'SOFA': 'sofa',
        'MESA': 'mesa',
        'CADEIRA': 'cadeira',
        'ARMARIO': 'armario',
        'CAMA': 'cama',
        'DECORACAO': 'decoracao',
        'LUMINARIA': 'iluminacao',
        'QUADRO': 'decoracao',
        'POLTRONA': 'cadeira',
        'ESTANTE': 'armario',
        'MESA_CENTRO': 'mesa_centro'
      };
      
      const mappedCategory = categoryMap[product.category] || 'mesa_centro';
      
      // addToCartStore já gerencia backend automaticamente quando autenticado
      await addToCartStore({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrls[0] || '/image.png',
        category: mappedCategory,
        brand: product.brand,
        stock: 999, // Assumindo estoque disponível
        storeId: product.store.id || '',
      }, 1);

      // Disparar evento para atualizar notificações
      if (isAuthenticated && user?.role?.toUpperCase() === 'CUSTOMER') {
        window.dispatchEvent(new CustomEvent('notification:cart-added'));
      }

      toast.success('Produto adicionado ao carrinho!');
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho');
    }
  };

  // Gerar sugestões de autocomplete
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const suggestions = favorites
        .filter(fav => {
          const term = searchTerm.toLowerCase();
          return (
            fav.product.name.toLowerCase().includes(term) ||
            fav.product.description.toLowerCase().includes(term) ||
            fav.product.brand?.toLowerCase().includes(term) ||
            fav.product.category.toLowerCase().includes(term)
          );
        })
        .slice(0, 5); // Limitar a 5 sugestões
      
      setAutocompleteSuggestions(suggestions);
      setShowAutocomplete(suggestions.length > 0);
    } else {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
    }
  }, [searchTerm, favorites]);

  // Fechar autocomplete ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrar e ordenar favoritos
  const filteredAndSortedFavorites = React.useMemo(() => {
    let filtered = favorites.filter(fav => 
      fav.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fav.product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fav.product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fav.product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Ordenar
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.product.price - b.product.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.product.price - a.product.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.product.name.localeCompare(b.product.name));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  }, [favorites, searchTerm, sortBy]);

  // Selecionar sugestão do autocomplete
  const selectSuggestion = (favorite: FavoriteProduct) => {
    setSearchTerm(favorite.product.name);
    setShowAutocomplete(false);
    inputRef.current?.blur();
  };


  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Calcular parcelamento
  const calculateInstallment = (price: number, installments: number = 12) => {
    const installmentValue = price / installments;
    return formatPrice(installmentValue);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 page-with-fixed-header">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#3e2626] mb-2">Meus Favoritos</h1>
          <p className="text-gray-600">
            {filteredAndSortedFavorites.length} {filteredAndSortedFavorites.length === 1 ? 'produto salvo' : 'produtos salvos'}
          </p>
        </div>

        {/* Barra de Controles - Estilo Mercado Livre */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Busca com Autocomplete */}
            <div className="flex-1 w-full md:w-auto">
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <Input
                  ref={inputRef}
                  placeholder="Buscar nos favoritos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (autocompleteSuggestions.length > 0 && searchTerm.trim().length > 0) {
                      setShowAutocomplete(true);
                    }
                  }}
                  className="pl-10 border-gray-300 focus:border-[#3e2626] focus:ring-[#3e2626]"
                />
                
                {/* Dropdown de Autocomplete */}
                {showAutocomplete && autocompleteSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase">
                        Sugestões
                      </div>
                      {autocompleteSuggestions.map((favorite) => (
                        <button
                          key={favorite.id}
                          onClick={() => selectSuggestion(favorite)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left group"
                        >
                          <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                            <Image
                              src={(favorite.product.imageUrls && favorite.product.imageUrls.length > 0) 
                                ? favorite.product.imageUrls[0] 
                                : (favorite.product.imageUrl || '/image.png')}
                              alt={favorite.product.name}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                console.error('Erro ao carregar imagem do favorito:', favorite.product.name);
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm line-clamp-1 group-hover:text-[#3e2626]">
                              {favorite.product.name}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {favorite.product.brand || favorite.product.category}
                            </p>
                            <p className="text-sm font-bold text-[#3e2626] mt-1">
                              {formatPrice(favorite.product.price)}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#3e2626] flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-[#3e2626]"
              >
                <option value="recent">Mais recentes</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
                <option value="name">Nome A-Z</option>
              </select>
            </div>

            {/* Visualização */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-[#3e2626] hover:bg-[#2a1f1f]' : ''}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[#3e2626] hover:bg-[#2a1f1f]' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Favoritos */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando favoritos...</p>
            </div>
          </div>
        ) : filteredAndSortedFavorites.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum favorito ainda'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Tente ajustar sua busca'
                  : 'Adicione produtos aos favoritos para vê-los aqui'
                }
              </p>
              <Link href="/products">
                <Button className="bg-[#3e2626] hover:bg-[#2a1f1f]">
                  <Package className="w-4 h-4 mr-2" />
                  Explorar Produtos
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          // Layout Grid - Estilo Pichau
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedFavorites.map((favorite) => {
              return (
                <Card key={favorite.id} className="group hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <CardContent className="p-0">
                    {/* Imagem com Badges */}
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <Image
                        src={(favorite.product.imageUrls && favorite.product.imageUrls.length > 0) 
                          ? favorite.product.imageUrls[0] 
                          : (favorite.product.imageUrl || '/image.png')}
                        alt={favorite.product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          console.error('Erro ao carregar imagem do favorito:', favorite.product.name);
                        }}
                      />
                      
                      {/* Badges - Estilo Pichau */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <Badge className="bg-green-500 text-white font-bold px-2 py-1 text-xs">
                          EM ESTOQUE
                        </Badge>
                      </div>

                      {/* Ícone de Favorito - Estilo Pichau */}
                      <button
                        onClick={() => removeFromFavorites(favorite.product.id)}
                        className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg group/fav"
                      >
                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      </button>
                    </div>

                    {/* Informações do Produto */}
                    <div className="p-4 space-y-3">
                      {/* Título */}
                      <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm min-h-[2.5rem]">
                        {favorite.product.name}
                      </h3>

                      {/* Vendedor - Estilo Mercado Livre */}
                      {favorite.product.store && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <span>Por</span>
                          <span className="font-semibold text-[#3e2626]">{favorite.product.store.name}</span>
                          <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        </div>
                      )}

                      {/* Preços - Estilo Mercado Livre */}
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-[#3e2626]">
                            {formatPrice(favorite.product.price)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600">
                          em até 12x de {calculateInstallment(favorite.product.price, 12)} sem juros
                        </p>
                        <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          Frete grátis
                        </p>
                      </div>

                      {/* Botão de Comprar */}
                      <Button
                        onClick={() => handleAddToCart(favorite.product)}
                        className="w-full bg-[#3e2626] hover:bg-[#2a1f1f] text-white font-semibold"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Comprar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          // Layout Lista - Estilo Mercado Livre
          <div className="space-y-4">
            {filteredAndSortedFavorites.map((favorite) => {
              return (
                <Card key={favorite.id} className="group hover:shadow-lg transition-all duration-300 border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Imagem - Estilo Mercado Livre */}
                      <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden bg-gray-100">
                        <Image
                          src={(favorite.product.imageUrls && favorite.product.imageUrls.length > 0) 
                            ? favorite.product.imageUrls[0] 
                            : (favorite.product.imageUrl || '/image.png')}
                          alt={favorite.product.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            console.error('Erro ao carregar imagem do favorito:', favorite.product.name);
                          }}
                        />
                      </div>

                      {/* Conteúdo - Estilo Mercado Livre */}
                      <div className="flex-1 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Título e Vendedor */}
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
                              {favorite.product.name}
                            </h3>
                            {favorite.product.store && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <span>Por</span>
                                <span className="font-semibold text-[#3e2626]">{favorite.product.store.name}</span>
                                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                              </div>
                            )}
                          </div>

                          {/* Preços - Estilo Mercado Livre */}
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                              <p className="text-2xl font-bold text-[#3e2626]">
                                {formatPrice(favorite.product.price)}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600">
                              em até 12x de {calculateInstallment(favorite.product.price, 12)} sem juros
                            </p>
                            <p className="text-sm text-green-600 font-semibold flex items-center gap-1">
                              <Truck className="w-4 h-4" />
                              Frete grátis
                            </p>
                          </div>
                        </div>

                        {/* Ações - Estilo Mercado Livre */}
                        <div className="flex flex-col gap-2 sm:w-48">
                          <Button
                            onClick={() => handleAddToCart(favorite.product)}
                            className="w-full bg-[#3e2626] hover:bg-[#2a1f1f] text-white font-semibold"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Comprar
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromFavorites(favorite.product.id)}
                              className="flex-1 border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
