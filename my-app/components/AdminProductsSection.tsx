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
  Star,
  Filter
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import AdminProductModal from './AdminProductModal';

interface AdminProductsSectionProps {
  products: any[];
  isLoading: boolean;
  onProductDeleted?: (productId: string) => void;
}

export default function AdminProductsSection({ products, isLoading, onProductDeleted }: AdminProductsSectionProps) {
  // Estados para filtros
  const [productFilters, setProductFilters] = useState({
    category: 'all',
    status: 'all',
    search: ''
  });

  // Estados para o modal de produto
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Função para filtrar produtos
  const getFilteredProducts = () => {
    if (!Array.isArray(products)) return [];
    
    return products
      .filter((product: any) => {
        // Filtro por categoria
        if (productFilters.category !== 'all' && product.category !== productFilters.category) {
          return false;
        }
        
        // Filtro por status
        if (productFilters.status !== 'all') {
          if (productFilters.status === 'active' && !product.isActive) return false;
          if (productFilters.status === 'inactive' && product.isActive) return false;
        }
        
        // Filtro por busca
        if (productFilters.search) {
          const searchTerm = productFilters.search.toLowerCase();
          const matchesName = product.name?.toLowerCase().includes(searchTerm);
          const matchesDescription = product.description?.toLowerCase().includes(searchTerm);
          const matchesSku = product.sku?.toLowerCase().includes(searchTerm);
          
          if (!matchesName && !matchesDescription && !matchesSku) return false;
        }
        
        return true;
      });
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
        
        // Notificar o componente pai para atualizar a lista
        if (onProductDeleted) {
          onProductDeleted(product.id);
        }
        
        // Mostrar mensagem de sucesso
        alert('Produto excluído com sucesso!');
        
      } catch (error: any) {
        console.error('❌ Erro ao excluir produto:', error);
        alert('Erro ao excluir produto. Tente novamente.');
      }
    }
  };

  const handleProductUpdated = (updatedProduct: any) => {
    // Esta função será chamada pelo modal quando um produto for atualizado
    // O componente pai (dashboard) deve lidar com a atualização da lista
    console.log('Produto atualizado:', updatedProduct);
  };

  const handleProductDeleted = (productId: string) => {
    // Esta função será chamada pelo modal quando um produto for excluído
    // O componente pai (dashboard) deve lidar com a atualização da lista
    console.log('Produto excluído:', productId);
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleRefreshProducts = () => {
    // Recarregar a página para atualizar os dados
    window.location.reload();
  };

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

  const filteredProducts = getFilteredProducts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3e2626] to-[#8B4513] rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold">Gestão de Produtos</h1>
              <p className="text-white/80 text-lg">Gerencie o catálogo de produtos da empresa</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="secondary" 
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={handleRefreshProducts}
            >
              Atualizar
            </Button>
            <Button 
              className="bg-white text-[#3e2626] hover:bg-gray-100"
              onClick={handleCreateProduct}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {products.length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Produtos cadastrados</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Ativos</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {products.filter(p => p.isActive).length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Disponíveis</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Estoque Baixo</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {products.filter(p => p.stock < 10).length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Atenção necessária</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Valor Total</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {formatPrice(products.reduce((sum, p) => sum + (p.price * p.stock), 0))}
                </p>
                <p className="text-xs text-[#3e2626]/70">Em estoque</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite nome, descrição ou SKU..."
                  value={productFilters.search}
                  onChange={(e) => setProductFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={productFilters.category}
                onChange={(e) => setProductFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todas as categorias</option>
                <option value="Tintas">Tintas</option>
                <option value="Pincéis">Pincéis</option>
                <option value="Rolos">Rolos</option>
                <option value="Acessórios">Acessórios</option>
              </select>
              <select
                value={productFilters.status}
                onChange={(e) => setProductFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                >
                  Lista
                </Button>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                X Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Lista de Produtos</h2>
          <p className="text-sm text-gray-600">{filteredProducts.length} produto(s) encontrado(s)</p>
        </div>
        <Button variant="outline">
          Exportar
        </Button>
      </div>

      {/* Products Grid */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
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
                      <Package className="h-4 w-4 mr-1" />
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
