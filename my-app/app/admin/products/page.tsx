'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import ClientOnly from '@/components/ClientOnly';
import HydrationBoundary from '@/components/HydrationBoundary';
import NoSSR from '@/components/NoSSR';
import ImageUpload from '@/components/ImageUpload';
import { 
  Building2, 
  Bell, 
  LogOut, 
  Users, 
  Store,      
  Package, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Plus,
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart3,
  Building,
  CheckCircle,
  Zap, 
  UserCheck,
  Download, 
  Settings,
  ArrowUp,
  Menu,
  ChevronDown,
  UserPlus,
  RefreshCw,
  X,
  Filter,
  MoreHorizontal,
  FileText,
  Star,
  Palette,
  Ruler,
  Camera,
  Tag,
  Home,
  User,
  Users2,
  Grid3X3,
  ShoppingCart,
  Shield,
  BookOpen,
  Layers,
  History,
  MapPin,
  Phone,
  Mail,
  Heart,
  BarChart,
  TrendingDown,
  Box,
  Upload
} from 'lucide-react';
import AdminProductModal from '@/components/AdminProductModal';
import ProductViewer3D from '@/components/ProductViewer3D';
import ProductViewer3DAdvanced from '@/components/ProductViewer3DAdvanced';
import PhotoTo3DConverter from '@/components/PhotoTo3DConverter';
import Direct3DUploader from '@/components/Direct3DUploader';

export default function ProductsPage() {
  const router = useRouter();
  const { token } = useAppStore();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros para produtos
  const [productFilters, setProductFilters] = useState({
    category: 'all',
    status: 'all',
    search: ''
  });
  
  // Estados para o modal de produto
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  
  // Estados para o visualizador 3D
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [productFor3D, setProductFor3D] = useState<any | null>(null);
  const [viewerMode, setViewerMode] = useState<'basic' | 'advanced'>('advanced');
  
  // Estados para o conversor de foto para 3D
  const [isPhotoTo3DOpen, setIsPhotoTo3DOpen] = useState(false);
  
  // Estados para o upload direto de 3D
  const [isDirect3DUploadOpen, setIsDirect3DUploadOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await loadProductsData();
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    // Usar setTimeout para evitar problemas de hidratação
    const timer = setTimeout(checkAuth, 0);
    return () => clearTimeout(timer);
  }, []);

  // Atualizar dados a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadProductsData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  const loadProductsData = async () => {
    try {
      setIsLoading(true);
      
      console.log('Carregando dados de produtos do banco...');
      
      // Carregar dados reais da API
      try {
        console.log('📦 Chamando adminAPI.getProducts()...');
        const productsData = await adminAPI.getProducts();
        console.log('📦 Dados recebidos:', productsData);
        console.log('📦 Tipo:', typeof productsData);
        console.log('📦 É array?', Array.isArray(productsData));
        
        // A API retorna { products: [...], pagination: {...} }
        const productsArray = Array.isArray(productsData) 
          ? productsData 
          : (productsData?.products || []);
        
        console.log('📦 Produtos extraídos:', productsArray.length, 'produtos');
        setProducts(productsArray);
      } catch (apiError) {
        console.error('❌ Erro ao chamar API de produtos:', apiError);
        
        // Fallback para dados mock em caso de erro da API
        console.log('Usando dados mock como fallback...');
        const mockProducts = [
          {
            id: 1,
            name: 'Tinta Branca Premium',
            description: 'Tinta de alta qualidade para interiores',
            price: 89.90,
            stock: 50,
            category: 'Tintas',
            sku: 'TINTA-001',
            isActive: true,
            rating: 4.5,
            reviews: 12
          },
          {
            id: 2,
            name: 'Pincel Chato 2"',
            description: 'Pincel profissional para pintura',
            price: 15.50,
            stock: 25,
            category: 'Pincéis',
            sku: 'PIN-002',
            isActive: true,
            rating: 4.2,
            reviews: 8
          },
          {
            id: 3,
            name: 'Rolo de Pintura',
            description: 'Rolo para aplicação de tinta',
            price: 22.90,
            stock: 15,
            category: 'Rolos',
            sku: 'ROL-003',
            isActive: true,
            rating: 4.0,
            reviews: 5
          }
        ];
        setProducts(mockProducts);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      // Dados mock para desenvolvimento incluindo uma cadeira
      setProducts([
        {
          id: '1',
          name: 'Cadeira de Escritório Premium',
          category: 'cadeira',
          price: 599.90,
          color: 'Marrom',
          colorCode: '#8B4513',
          description: 'Cadeira ergonômica com apoio lombar e ajuste de altura',
          brand: 'OfficePro',
          stock: 15,
          isActive: true,
          imageUrl: '/images/cadeira-premium.jpg'
        },
        {
          id: '2',
          name: 'Galão de Tinta Branca',
          category: 'tinta',
          price: 89.90,
          color: 'Branco',
          colorCode: '#FFFFFF',
          description: 'Tinta látex PVA 18L para uso interno',
          brand: 'Coral',
          stock: 50,
          isActive: true,
          imageUrl: '/images/tinta-branca.jpg'
        },
        {
          id: '3',
          name: 'Pincel Premium',
          category: 'pincel',
          price: 25.90,
          color: 'Natural',
          colorCode: '#D2B48C',
          description: 'Pincel beiçola 2 polegadas cerdas naturais',
          brand: 'Suvinil',
          stock: 100,
          isActive: true,
          imageUrl: '/images/pincel-premium.jpg'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    router.push('/login');
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

  const handleProductUpdated = (updatedProduct: any) => {
    // Atualizar produtos via callback
    loadProductsData();
  };

  const handleProductDeleted = (productId: string) => {
    // Atualizar produtos via callback
    loadProductsData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ProductsSection 
        products={products}
        isLoading={isLoading}
        token={token}
        onProductsChange={loadProductsData}
      />
    </div>
  );
}

// Componente da seção de produtos
function ProductsSection({ products, isLoading, token, onProductsChange }: any) {
  // Estados para filtros
  const [productFilters, setProductFilters] = useState({
    category: 'all',
    status: 'all',
    search: ''
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Função para abrir modal de novo produto
  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Função para editar produto (versão simplificada)
  const handleEditProductById = async (productId: string) => {
    try {
      console.log('Editando produto:', productId);
      const product = products.find((p: any) => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        setModalMode('edit');
        setIsModalOpen(true);
      } else {
        console.error('Produto não encontrado:', productId);
      }
    } catch (error) {
      console.error('Erro ao editar produto:', error);
      alert('Erro ao editar produto');
    }
  };

  const handleViewProduct = async (productId: string) => {
    try {
      console.log('Visualizando produto:', productId);
      const product = products.find((p: any) => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        setModalMode('view');
        setIsModalOpen(true);
      } else {
        console.error('Produto não encontrado:', productId);
      }
    } catch (error) {
      console.error('Erro ao visualizar produto:', error);
      alert('Erro ao visualizar produto');
    }
  };

  // Função para deletar produto
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) {
      return;
    }

    try {
      console.log('Deletando produto:', productId);
      
      // Usar fetch direto para deletar produto
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('Produto deletado com sucesso');
        alert('Produto deletado com sucesso!');
        
        // Recarregar dados do banco
        onProductsChange();
      } else {
        const errorData = await response.json();
        console.error('Erro na API:', errorData);
        alert(`Erro ao deletar produto: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      alert('Erro ao deletar produto');
    }
  };

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
          return (
            product.name?.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm) ||
            product.sku?.toLowerCase().includes(searchTerm)
          );
        }
        
        return true;
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
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

  // Estados para o modal de produto
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  
  // Estados para o visualizador 3D
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [productFor3D, setProductFor3D] = useState<any | null>(null);
  const [viewerMode, setViewerMode] = useState<'basic' | 'advanced'>('advanced');
  
  // Estados para o conversor de foto para 3D
  const [isPhotoTo3DOpen, setIsPhotoTo3DOpen] = useState(false);
  
  // Estados para o upload direto de 3D
  const [isDirect3DUploadOpen, setIsDirect3DUploadOpen] = useState(false);




  const handleView3D = (product: any) => {
    setProductFor3D(product);
    setIs3DViewerOpen(true);
  };

  const handleClose3DViewer = () => {
    setIs3DViewerOpen(false);
    setProductFor3D(null);
  };

  const handlePhotoTo3DConverted = (model3D: any) => {
    // Recarregar produtos após conversão
    onProductsChange();
    setIsPhotoTo3DOpen(false);
  };

  const handleDirect3DUploaded = (model3D: any) => {
    // Recarregar produtos após upload
    onProductsChange();
    setIsDirect3DUploadOpen(false);
  };

  // Handlers para o modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleProductUpdated = (updatedProduct: any) => {
    onProductsChange();
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleProductDeleted = (productId: string) => {
    onProductsChange();
    setIsModalOpen(false);
    setSelectedProduct(null);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"> 
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white py-12 px-4 rounded-2xl mb-8 shadow-xl">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold">Gestão de Produtos</h1>
                  <p className="text-white/80 text-lg">Gerencie o catálogo de produtos da empresa</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={() => setIsPhotoTo3DOpen(true)}
                className="border-2 border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white"
              >
                <Camera className="h-4 w-4 mr-2" />
                Foto para 3D
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsDirect3DUploadOpen(true)}
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload 3D
              </Button>
              <Button 
                onClick={handleCreateProduct}
                className="bg-[#3e2626] hover:bg-[#8B4513]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Brand Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total</p>
                <p className="text-3xl font-bold text-[#3e2626]">
                  {products.length}
                </p>
                <p className="text-xs text-[#3e2626]/70">Produtos cadastrados</p>
              </div>
              <div className="w-12 h-12 bg-[#3e2626]/10 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-[#3e2626]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-2 border-green-500/20 shadow-lg hover:shadow-xl hover:border-green-500/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Ativos</p>
                <p className="text-3xl font-bold text-green-600">
                  {products.filter((p: any) => p.isActive).length}
                </p>
                <p className="text-xs text-green-600/70">Em estoque</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-2 border-yellow-500/20 shadow-lg hover:shadow-xl hover:border-yellow-500/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-yellow-600 uppercase tracking-wide">Estoque Baixo</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {products.filter((p: any) => p.stock < 10).length}
                </p>
                <p className="text-xs text-yellow-600/70">Atenção</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-2 border-purple-500/20 shadow-lg hover:shadow-xl hover:border-purple-500/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Valor Total</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatPrice(products.reduce((sum: number, p: any) => sum + (p.price * p.stock), 0))}
                </p>
                <p className="text-xs text-purple-600/70">Em estoque</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
                  Categoria:
                </Label>
                <select
                  id="category-filter"
                  value={productFilters.category}
                  onChange={(e) => setProductFilters({ ...productFilters, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                >
                  <option value="all">Todas</option>
                  <option value="Tintas">Tintas</option>
                  <option value="Pincéis">Pincéis</option>
                  <option value="Rolos">Rolos</option>
                  <option value="Acessórios">Acessórios</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                  Status:
                </Label>
                <select
                  id="status-filter"
                  value={productFilters.status}
                  onChange={(e) => setProductFilters({ ...productFilters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={productFilters.search}
                  onChange={(e) => setProductFilters({ ...productFilters, search: e.target.value })}
                  className="w-64"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center space-x-2"
              >
                <Grid3X3 className="h-4 w-4" />
                <span>Grade</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Lista</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <div className="space-y-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredProducts().map((product: any) => {
              const stockStatus = getStockStatus(product.stock);
              return (
                <Card key={product.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-[#3e2626]/5 to-[#3e2626]/10 p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[#3e2626] rounded-xl flex items-center justify-center">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {product.category}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              variant="outline"
                              className="text-xs"
                            >
                              {product.category}
                            </Badge>
                            <Badge 
                              variant={product.isActive ? 'default' : 'secondary'}
                              className={`text-xs ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            >
                              {product.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-2xl font-bold text-[#3e2626]">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Package className="h-4 w-4" />
                          <span>Estoque: {product.stock} unidades</span>
                        </div>
                        {product.sku && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Tag className="h-4 w-4" />
                            <span>SKU: {product.sku}</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <Badge className={stockStatus.color}>
                            {stockStatus.label}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewProduct(product.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditProductById(product.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estoque
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredProducts().map((product: any) => {
                      const stockStatus = getStockStatus(product.stock);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-[#3e2626] rounded-lg flex items-center justify-center mr-3">
                                <Package className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.sku || 'Sem SKU'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline">
                              {product.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(product.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-900">{product.stock}</span>
                              <Badge className={stockStatus.color}>
                                {stockStatus.label}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={product.isActive ? 'default' : 'secondary'}
                              className={product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            >
                              {product.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewProduct(product.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditProductById(product.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Produto */}
      <AdminProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        mode={modalMode}
        onClose={handleCloseModal}
        onProductUpdated={handleProductUpdated}
        onProductDeleted={handleProductDeleted}
      />

      {/* Visualizador 3D */}
      {productFor3D && (
        <>
          {viewerMode === 'basic' ? (
            <ProductViewer3D
              product={productFor3D}
              isOpen={is3DViewerOpen}
              onClose={handleClose3DViewer}
            />
          ) : (
            <ProductViewer3DAdvanced
              product={productFor3D}
              isOpen={is3DViewerOpen}
              onClose={handleClose3DViewer}
            />
          )}
        </>
      )}

      {/* Conversor de Foto para 3D */}
      {isPhotoTo3DOpen && (
        <PhotoTo3DConverter
          onConverted={handlePhotoTo3DConverted}
          onClose={() => setIsPhotoTo3DOpen(false)}
        />
      )}

      {/* Upload Direto de 3D */}
      {isDirect3DUploadOpen && (
        <Direct3DUploader
          onUploaded={handleDirect3DUploaded}
          onClose={() => setIsDirect3DUploadOpen(false)}
        />
      )}
    </div>
  );
}