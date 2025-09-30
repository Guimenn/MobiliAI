'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { adminAPI } from '@/lib/api-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  DollarSign,
  BarChart3,
  Tag,
  Store,
  Calendar,
  Star
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  brand: string;
  colorName: string;
  colorHex: string;
  style: string;
  material: string;
  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  store: {
    id: string;
    name: string;
  };
}

export default function AdminProducts() {
  const { user, isAuthenticated, token, isUserAuthenticated } = useAppStore();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (!isUserAuthenticated()) {
      router.push('/login');
      return;
    }

    if (user?.role?.toLowerCase() !== 'admin') {
      router.push('/');
      return;
    }

    fetchProducts();
  }, [isAuthenticated, user, router, isUserAuthenticated]);

  const fetchProducts = async () => {
    if (!token) {
      console.error('Token não disponível');
      setLoading(false);
      return;
    }

    try {
      const response = await adminAPI.getProducts(token);

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      SOFA: { label: 'Sofá', color: 'bg-blue-100 text-blue-800' },
      CHAIR: { label: 'Cadeira', color: 'bg-green-100 text-green-800' },
      TABLE: { label: 'Mesa', color: 'bg-yellow-100 text-yellow-800' },
      BED: { label: 'Cama', color: 'bg-purple-100 text-purple-800' },
      WARDROBE: { label: 'Guarda-roupa', color: 'bg-pink-100 text-pink-800' },
      DECORATION: { label: 'Decoração', color: 'bg-indigo-100 text-indigo-800' }
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || { label: category, color: 'bg-gray-100 text-gray-800' };
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: 'Sem estoque', color: 'bg-red-100 text-red-800' };
    if (stock <= minStock) return { label: 'Estoque baixo', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Em estoque', color: 'bg-green-100 text-green-800' };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Produtos</h1>
              <p className="text-sm text-gray-600">Gerencie todos os produtos do sistema</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/admin/products/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as categorias</option>
              <option value="SOFA">Sofás</option>
              <option value="CHAIR">Cadeiras</option>
              <option value="TABLE">Mesas</option>
              <option value="BED">Camas</option>
              <option value="WARDROBE">Guarda-roupas</option>
              <option value="DECORATION">Decoração</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Mais Filtros
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock, product.minStock);
            return (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      {product.isFeatured && (
                        <Badge className="bg-yellow-100 text-yellow-800">Destaque</Badge>
                      )}
                      {product.isNew && (
                        <Badge className="bg-green-100 text-green-800">Novo</Badge>
                      )}
                      {product.isBestSeller && (
                        <Badge className="bg-purple-100 text-purple-800">Mais Vendido</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Categoria</span>
                      {getCategoryBadge(product.category)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Preço</span>
                      <span className="font-semibold text-lg">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estoque</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{product.stock}</span>
                        <Badge className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Marca</span>
                      <span className="text-sm font-medium">{product.brand}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Loja</span>
                      <div className="flex items-center space-x-1">
                        <Store className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{product.store.name}</span>
                      </div>
                    </div>

                    {product.rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avaliação</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{product.rating}</span>
                          <span className="text-sm text-gray-500">({product.reviewCount})</span>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || categoryFilter !== 'all' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || categoryFilter !== 'all'
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece criando seu primeiro produto'
              }
            </p>
            {!searchTerm && categoryFilter === 'all' && (
              <Button onClick={() => router.push('/admin/products/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Produto
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
