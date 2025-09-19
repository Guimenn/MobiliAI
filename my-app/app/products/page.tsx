'use client';

import { useEffect, useState } from 'react';
import { useAppStore, Product } from '@/lib/store';
import { productsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Filter, ShoppingCart, Star, Sparkles, ArrowLeft, Grid, List } from 'lucide-react';
import Link from 'next/link';

type ProductCategory = 'SOFA' | 'MESA' | 'CADEIRA' | 'ARMARIO' | 'CAMA' | 'DECORACAO' | 'ILUMINACAO' | 'OUTROS';

export default function ProductsPage() {
  const { products, setProducts, addToCart, isLoading, setLoading } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedColor, setSelectedColor] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await productsAPI.getAll();
        setProducts(data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [setProducts, setLoading]);

  const categories: { value: ProductCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'SOFA', label: 'Sofás' },
    { value: 'MESA', label: 'Mesas' },
    { value: 'CADEIRA', label: 'Cadeiras' },
    { value: 'ARMARIO', label: 'Armários' },
    { value: 'CAMA', label: 'Camas' },
    { value: 'DECORACAO', label: 'Decoração' },
    { value: 'ILUMINACAO', label: 'Iluminação' },
    { value: 'OUTROS', label: 'Outros' },
  ];

  const colors = Array.from(new Set(products.map(p => p.color).filter(Boolean)));

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesColor = !selectedColor || product.color === selectedColor;
      
      return matchesSearch && matchesCategory && matchesColor;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return Number(a.price) - Number(b.price);
        case 'stock':
          return b.stock - a.stock;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    // Aqui você pode adicionar um toast de sucesso
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">MobiliAI</span>
            </Link>
            <Link href="/" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/furniture-visualizer" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
              IA Decoradora
            </Link>
            <Link href="/ai-processor" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
              Processador
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Catálogo de Móveis
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Descubra nossa seleção completa de móveis e decorações
          </p>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {filteredProducts.length} produtos encontrados
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Visualizar:</span>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nome ou marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'all')}
                  className="mt-2 w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Filter */}
              <div>
                <Label htmlFor="color">Cor</Label>
                <select
                  id="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="mt-2 w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as cores</option>
                  {colors.map(color => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <Label htmlFor="sort">Ordenar por</Label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'stock')}
                  className="mt-2 w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Nome</option>
                  <option value="price">Preço</option>
                  <option value="stock">Estoque</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Carregando produtos...</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
            {filteredProducts.map((product) => (
              <Card key={product.id} className={`hover:shadow-lg transition-shadow border-0 ${
                viewMode === 'list' ? 'flex flex-row' : ''
              }`}>
                <CardHeader className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Sparkles className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-sm line-clamp-2">{product.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {product.brand && `${product.brand} • `}
                        {product.color && `${product.color} • `}
                        {product.category}
                      </CardDescription>
                    </>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Sparkles className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {product.brand && `${product.brand} • `}
                          {product.color && `${product.color} • `}
                          {product.category}
                        </CardDescription>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className={`p-4 ${viewMode === 'list' ? 'pt-4' : 'pt-0'}`}>
                  <div className={viewMode === 'grid' ? 'space-y-3' : 'flex items-center justify-between'}>
                    <div className={viewMode === 'list' ? 'flex items-center space-x-4' : ''}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-600 text-lg">
                          R$ {Number(product.price).toFixed(2)}
                        </span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500 ml-1">4.8</span>
                        </div>
                      </div>

                      <div className={`${viewMode === 'list' ? 'ml-4' : 'mt-2'}`}>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.stock > 10 
                            ? 'bg-green-100 text-green-800' 
                            : product.stock > 0 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock > 0 ? `${product.stock} em estoque` : 'Sem estoque'}
                        </span>
                      </div>
                    </div>

                    <div className={`flex space-x-2 ${viewMode === 'list' ? 'ml-auto' : ''}`}>
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="flex-1"
                        size="sm"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                      <Link href={`/products/${product.id}`}>
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-500">
              Tente ajustar os filtros para encontrar o que procura.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
