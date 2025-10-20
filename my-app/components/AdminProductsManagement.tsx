'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  DollarSign,
  BarChart3,
  Tag,
  ArrowLeft,
  Filter,
  Star
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import AdminProductModal from './AdminProductModal';

export default function AdminProductsManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  
  // Estados para o modal de produto
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await adminAPI.getProducts();
      console.log('📦 Dados recebidos da API:', data);
      console.log('📦 Tipo dos dados:', typeof data);
      console.log('📦 É array?', Array.isArray(data));
      
      // Garantir que sempre seja um array
      const productsArray = Array.isArray(data) ? data : (data?.products || []);
      console.log('📦 Array final de produtos:', productsArray);
      setProducts(productsArray);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]); // Definir array vazio em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && product.isActive) ||
                         (filterStatus === 'inactive' && !product.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price':
        return a.price - b.price;
      case 'stock':
        return a.stock - b.stock;
      default:
        return 0;
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Sem Estoque', color: 'bg-red-100 text-red-800' };
    if (stock < 10) return { label: 'Estoque Baixo', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Em Estoque', color: 'bg-green-100 text-green-800' };
  };

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleDeleteProduct = async (product: any) => {
    // Mostrar confirmação com botões Sim/Não
    const confirmDelete = confirm(`Deseja realmente excluir o produto "${product.name}"?`);
    
    if (confirmDelete) {
      try {
        console.log('🗑️ Excluindo produto:', product.id);
        
        // Chamar API para deletar o produto
        await adminAPI.deleteProduct(product.id);
        
        // Remover da lista local
        setProducts(products.filter(p => p.id !== product.id));
        
        // Mostrar mensagem de sucesso
        alert('Produto excluído com sucesso!');
        
      } catch (error: any) {
        console.error('❌ Erro ao excluir produto:', error);
        alert('Erro ao excluir produto. Tente novamente.');
      }
    }
  };

  const handleProductUpdated = (updatedProduct: any) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleProductDeleted = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3e2626] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Produtos</h1>
          <p className="text-sm text-gray-600">Gerencie o catálogo de produtos da empresa</p>
        </div>
        <Button className="bg-[#3e2626] hover:bg-[#8B4513]">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Todas as Categorias</option>
            <option value="Tintas">Tintas</option>
            <option value="Pincéis">Pincéis</option>
            <option value="Rolos">Rolos</option>
            <option value="Acessórios">Acessórios</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="name">Ordenar por Nome</option>
            <option value="price">Ordenar por Preço</option>
            <option value="stock">Ordenar por Estoque</option>
          </select>
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('active')}
            size="sm"
          >
            Ativos
          </Button>
          <Button
            variant={filterStatus === 'inactive' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('inactive')}
            size="sm"
          >
            Inativos
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-sm text-gray-500">Total de Produtos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.isActive).length}
                </p>
                <p className="text-sm text-gray-500">Produtos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <Package className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.stock < 10).length}
                </p>
                <p className="text-sm text-gray-500">Estoque Baixo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(products.reduce((sum, p) => sum + (p.price * p.stock), 0))}
                </p>
                <p className="text-sm text-gray-500">Valor em Estoque</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product.stock);
          return (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#3e2626] rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>{product.category}</CardDescription>
                    </div>
                  </div>
                  <Badge className={stockStatus.color}>
                    {stockStatus.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {product.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#3e2626]">
                      {formatPrice(product.price)}
                    </span>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Estoque</p>
                      <p className="font-semibold">{product.stock} unidades</p>
                    </div>
                  </div>

                  {product.sku && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Tag className="h-4 w-4 mr-1" />
                      SKU: {product.sku}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-600">
                        {product.rating || 'N/A'} ({product.reviews || 0} avaliações)
                      </span>
                    </div>
                    <Badge className={product.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {product.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 pb-4">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewProduct(product)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteProduct(product)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-500">Tente ajustar os filtros ou criar um novo produto.</p>
        </div>
      )}

      {/* Modal de Produto */}
      <AdminProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        mode={modalMode}
        onClose={handleCloseModal}
        onProductUpdated={handleProductUpdated}
        onProductDeleted={handleProductDeleted}
      />
    </div>
  );
}
