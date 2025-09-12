'use client';

import { useEffect, useState } from 'react';
import { useAppStore, Product } from '@/lib/store';
import { productsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Filter, ShoppingCart, Star, Palette } from 'lucide-react';
import Link from 'next/link';

type ProductCategory = 'tinta' | 'pincel' | 'rolo' | 'fita' | 'kit' | 'outros';

export default function ProductsPage() {
  const { products, setProducts, addToCart, isLoading, setLoading } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedColor, setSelectedColor] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');

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
    { value: 'tinta', label: 'Tintas' },
    { value: 'pincel', label: 'Pincéis' },
    { value: 'rolo', label: 'Rolos' },
    { value: 'fita', label: 'Fitas' },
    { value: 'kit', label: 'Kits' },
    { value: 'outros', label: 'Outros' },
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nossos Produtos
          </h1>
          <p className="text-xl text-gray-600">
            Encontre as melhores tintas e materiais para seu projeto
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
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

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Carregando produtos...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <Palette className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-sm line-clamp-2">{product.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {product.brand && `${product.brand} • `}
                    {product.color && `${product.color} • `}
                    {product.category}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-600 text-lg">
                        R$ {Number(product.price).toFixed(2)}
                      </span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500 ml-1">4.8</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
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

                    <div className="flex space-x-2">
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
