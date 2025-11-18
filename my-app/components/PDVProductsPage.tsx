'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { productsAPI } from '@/lib/api';
import { showAlert } from '@/lib/alerts';
import {
  Search,
  Plus,
  Minus,
  Package,
  Loader2,
  AlertCircle,
  Barcode,
  ShoppingCart,
} from 'lucide-react';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  barcode?: string;
  sku?: string;
}

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
  stock: number;
  imageUrl?: string;
}

interface PDVProductsPageProps {
  cart: CartItem[];
  onAddToCart: (product: Product, quantity: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
}

export default function PDVProductsPage({
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
}: PDVProductsPageProps) {
  const { user } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.storeId) {
      loadProducts();
    }
  }, [user?.storeId]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const loadProducts = async () => {
    if (!user?.storeId) return;
    
    try {
      setIsLoading(true);
      const data = await productsAPI.getAll(user.storeId);
      const availableProducts = data.filter((p: Product) => p.stock > 0);
      setProducts(availableProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      showAlert('error', 'Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      loadProducts();
      return;
    }

    if (!user?.storeId) return;

    try {
      setIsSearching(true);
      const allProducts = await productsAPI.getAll(user.storeId);
      
      const searchLower = value.toLowerCase();
      const filtered = allProducts.filter((p: Product) => {
        const matchesName = p.name.toLowerCase().includes(searchLower);
        const matchesBarcode = p.barcode?.toLowerCase().includes(searchLower);
        const matchesSku = p.sku?.toLowerCase().includes(searchLower);
        return (matchesName || matchesBarcode || matchesSku) && p.stock > 0;
      });
      
      setProducts(filtered);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && products.length > 0) {
      onAddToCart(products[0], 1);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Busca de Produtos */}
      <Card className="mb-6 shadow-lg border-2 border-[#3e2626]/10">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-[#3e2626] z-10" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por nome, SKU ou código de barras..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-12 pr-12 h-14 text-lg border-2 border-[#3e2626]/20 focus:border-[#3e2626] focus:ring-2 focus:ring-[#3e2626]/20 rounded-lg font-medium"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-[#3e2626] animate-spin" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card className="flex-1 shadow-lg border-0 overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between text-white">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos Disponíveis
            </span>
            {products.length > 0 && (
              <Badge className="bg-white text-[#3e2626] font-semibold">
                {products.length} encontrado{products.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#3e2626]" />
            </div>
          ) : products.length === 0 && searchTerm ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-4">
                <AlertCircle className="h-10 w-10 text-red-400" />
              </div>
              <p className="text-[#3e2626] font-semibold text-lg mb-2">Nenhum produto encontrado</p>
              <p className="text-gray-500 text-sm">Tente buscar com outro termo</p>
            </div>
          ) : products.length === 0 && !searchTerm ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-4">
                <Barcode className="h-10 w-10 text-blue-400" />
              </div>
              <p className="text-[#3e2626] font-semibold text-lg mb-2">Buscar Produtos</p>
              <p className="text-gray-500 text-sm">Digite o nome, SKU ou código de barras para buscar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => {
                const cartItem = cart.find(item => item.productId === product.id);
                const currentQuantity = cartItem?.quantity || 0;
                
                return (
                  <div
                    key={product.id}
                    className="border-2 rounded-xl p-4 hover:border-[#3e2626] hover:shadow-xl transition-all bg-white group"
                  >
                    <div className="flex flex-col space-y-3">
                      {/* Imagem do Produto */}
                      {product.imageUrl ? (
                        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Informações do Produto */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-[#3e2626] line-clamp-2 mb-2 min-h-[3rem]">
                          {product.name}
                        </h3>
                        <p className="text-2xl font-bold text-[#3e2626] mb-3">
                          {formatCurrency(product.price)}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <Badge 
                            variant={product.stock > 0 ? 'default' : 'destructive'} 
                            className="text-xs"
                          >
                            Estoque: {product.stock}
                          </Badge>
                          {product.barcode && (
                            <span className="text-xs text-gray-500">#{product.barcode}</span>
                          )}
                        </div>
                        
                        {/* Indicador de Item no Carrinho */}
                        {cartItem && (
                          <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs text-green-700 font-medium">
                              No carrinho: {currentQuantity} unidade{currentQuantity !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                        
                        {/* Controles de Quantidade */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (cartItem) {
                                onUpdateQuantity(product.id, cartItem.quantity - 1);
                              }
                            }}
                            disabled={!cartItem || cartItem.quantity <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product, 1);
                            }}
                            className="flex-1 bg-[#3e2626] hover:bg-[#5a3a3a] text-white h-9"
                            disabled={product.stock === 0 || (cartItem && cartItem.quantity >= product.stock)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (cartItem) {
                                onUpdateQuantity(product.id, cartItem.quantity + 1);
                              } else {
                                onAddToCart(product, 1);
                              }
                            }}
                            disabled={product.stock === 0 || (cartItem && cartItem.quantity >= product.stock)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

