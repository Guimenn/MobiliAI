'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { 
  Search, 
  Package, 
  Star,
  ShoppingCart,
  Filter,
  Grid,
  List,
  Plus,
  Minus
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  image?: string;
  rating?: number;
  brand?: string;
  color?: string;
  finish?: string;
  coverage?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'cashier' | 'customer';
  storeId?: string;
}

export default function ProductsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);

  // Mock products data - tintas e produtos relacionados
  const mockProducts: Product[] = [
    { 
      id: 'prod1', 
      name: 'Tinta Acrílica Premium Branco Gelo', 
      price: 89.90, 
      stock: 25, 
      category: 'TINTAS',
      description: 'Tinta acrílica de alta qualidade para interiores e exteriores',
      image: '/api/placeholder/300/200',
      rating: 4.8,
      brand: 'ColorMax',
      color: 'Branco Gelo',
      finish: 'Fosco',
      coverage: '16m²/L'
    },
    { 
      id: 'prod2', 
      name: 'Tinta Esmalte Sintético Azul Royal', 
      price: 125.50, 
      stock: 15, 
      category: 'TINTAS',
      description: 'Esmalte sintético para madeiras e metais',
      image: '/api/placeholder/300/200',
      rating: 4.6,
      brand: 'Premium Paint',
      color: 'Azul Royal',
      finish: 'Brilhante',
      coverage: '12m²/L'
    },
    { 
      id: 'prod3', 
      name: 'Primer Universal Branco', 
      price: 45.00, 
      stock: 30, 
      category: 'PRIMERS',
      description: 'Primer universal para qualquer tipo de superfície',
      image: '/api/placeholder/300/200',
      rating: 4.5,
      brand: 'BaseTech',
      color: 'Branco',
      finish: 'Fosco',
      coverage: '20m²/L'
    },
    { 
      id: 'prod4', 
      name: 'Kit Pintura Completo - Verde Menta', 
      price: 299.90, 
      stock: 8, 
      category: 'KITS',
      description: 'Kit completo com tinta, primer, pincéis e rolos',
      image: '/api/placeholder/300/200',
      rating: 4.9,
      brand: 'Complete Paint',
      color: 'Verde Menta',
      finish: 'Fosco',
      coverage: '45m²'
    },
    { 
      id: 'prod5', 
      name: 'Pincel Chato 2" Profissional', 
      price: 15.90, 
      stock: 50, 
      category: 'FERRAMENTAS',
      description: 'Pincel de cerdas naturais para acabamento perfeito',
      image: '/api/placeholder/300/200',
      rating: 4.7,
      brand: 'ProTools'
    },
    { 
      id: 'prod6', 
      name: 'Rolo de Pintura 7"', 
      price: 12.50, 
      stock: 40, 
      category: 'FERRAMENTAS',
      description: 'Rolo de lã para pintura de grandes áreas',
      image: '/api/placeholder/300/200',
      rating: 4.4,
      brand: 'RollMax'
    },
    { 
      id: 'prod7', 
      name: 'Fita Crepe 48mm x 50m', 
      price: 8.90, 
      stock: 60, 
      category: 'FERRAMENTAS',
      description: 'Fita crepe para proteção e acabamento',
      image: '/api/placeholder/300/200',
      rating: 4.3,
      brand: 'TapePro'
    },
    { 
      id: 'prod8', 
      name: 'Tinta Látex PVA Rosa Pink', 
      price: 67.80, 
      stock: 20, 
      category: 'TINTAS',
      description: 'Tinta látex PVA para quartos infantis',
      image: '/api/placeholder/300/200',
      rating: 4.6,
      brand: 'Kids Color',
      color: 'Rosa Pink',
      finish: 'Fosco',
      coverage: '18m²/L'
    }
  ];

  const categories = [
    { id: 'all', name: 'Todos', count: mockProducts.length },
    { id: 'TINTAS', name: 'Tintas', count: mockProducts.filter(p => p.category === 'TINTAS').length },
    { id: 'PRIMERS', name: 'Primers', count: mockProducts.filter(p => p.category === 'PRIMERS').length },
    { id: 'KITS', name: 'Kits', count: mockProducts.filter(p => p.category === 'KITS').length },
    { id: 'FERRAMENTAS', name: 'Ferramentas', count: mockProducts.filter(p => p.category === 'FERRAMENTAS').length }
  ];

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('loja-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
    setProducts(mockProducts);
  }, []);

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCart([]);
    localStorage.removeItem('loja-user');
  };

  const handleSearch = () => {
    let filtered = mockProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    setProducts(filtered);
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => [...prevCart, product]);
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa fazer login para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user}
      cartCount={cart.length}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catálogo de Produtos</h1>
            <p className="text-gray-600 mt-2">
              Encontre a tinta perfeita e todos os acessórios para sua pintura
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
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

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="flex-1 flex space-x-2">
                <Input
                  type="text"
                  placeholder="Buscar por nome, marca, cor ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg mb-3">
                    <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{product.category}</Badge>
                    {product.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{product.rating}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    R$ {product.price.toFixed(2)}
                  </p>
                  
                  {product.color && (
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-600">Cor:</span>
                      <span className="text-sm font-medium">{product.color}</span>
                    </div>
                  )}
                  
                  {product.coverage && (
                    <p className="text-sm text-gray-600 mb-3">
                      Rendimento: {product.coverage}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Estoque: {product.stock}
                    </span>
                    <Button 
                      onClick={() => addToCart(product)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map(product => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {product.name}
                          </h3>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="secondary">{product.category}</Badge>
                            {product.brand && (
                              <span className="text-sm text-gray-600">{product.brand}</span>
                            )}
                            {product.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600">{product.rating}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-blue-600 mb-2">
                            R$ {product.price.toFixed(2)}
                          </p>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                              Estoque: {product.stock}
                            </span>
                            <Button 
                              onClick={() => addToCart(product)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros ou termo de busca.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
