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
import { adminAPI } from '@/lib/api-admin';
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
  BarChart3,
  Building,
  CheckCircle,
  Zap, 
  Plus,
  UserCheck,
  Download, 
  Settings,
  ArrowUp,
  Search,
  Menu,
  ChevronDown,
  UserPlus,
  Edit,
  Trash2,
  Eye,
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
  TrendingDown
} from 'lucide-react';

export default function ProductsPage() {
  const router = useRouter();
  const { user: currentUser, token } = useAppStore();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filtros para produtos
  const [productFilters, setProductFilters] = useState({
    category: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simular usuário admin para demonstração
        const mockUser = {
          id: 1,
          name: 'Administrador',
          email: 'admin@mobiliai.com',
          role: 'ADMIN'
        };
        
        setUser(mockUser);
        setLastUpdated(new Date());
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
      let productsResponse;
      try {
        productsResponse = await adminAPI.getProducts(token || '');
      } catch (apiError) {
        console.error('Erro ao chamar API de produtos:', apiError);
        setProducts([]);
        return;
      }

      console.log('Resposta da API de produtos:', productsResponse);
      console.log('Tipo da resposta:', typeof productsResponse);
      console.log('Status da resposta:', productsResponse?.status);
      console.log('OK da resposta:', productsResponse?.ok);

      if (productsResponse && productsResponse.ok) {
        try {
          const productsData = await productsResponse.json();
          console.log('Dados de produtos recebidos:', productsData);
          
          // Verificar se os dados estão em productsData.products ou se é um array direto
          const productsArray = productsData?.products || productsData;
          setProducts(Array.isArray(productsArray) ? productsArray : []);
        } catch (jsonError) {
          console.error('Erro ao fazer parse do JSON:', jsonError);
          setProducts([]);
        }
      } else {
        console.error('Erro na API de produtos:', productsResponse?.status || 'No status', productsResponse?.statusText || 'No status text');
        console.error('Resposta completa:', productsResponse);
        
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
      console.error('Erro ao carregar dados do banco:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <NoSSR>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#3e2626] to-[#4a2f2f] rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#3e2626]">MobiliAI</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* User Profile */}
            <div className="p-6 border-b">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#3e2626] text-white">
                    {user?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'Administrador'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.role || 'Administrador'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                  onClick={() => router.push('/admin/dashboard')}
                >
                  <Home className="h-4 w-4 mr-3" />
                  Dashboard
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </div>

              <div className="pt-4">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  GESTÃO
                </p>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/stores')}
                  >
                    <Store className="h-4 w-4 mr-3" />
                    Lojas
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/users')}
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Usuários
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-[#3e2626] bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/products')}
                  >
                    <Package className="h-4 w-4 mr-3" />
                    Produtos
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/sales')}
                  >
                    <ShoppingCart className="h-4 w-4 mr-3" />
                    Vendas
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/reports')}
                  >
                    <BarChart3 className="h-4 w-4 mr-3" />
                    Relatórios
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/customers')}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Clientes
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                    onClick={() => router.push('/admin/settings')}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Configurações
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  SISTEMA
                </p>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                  >
                    <Activity className="h-4 w-4 mr-3" />
                    Atividade
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                  >
                    <Shield className="h-4 w-4 mr-3" />
                    Segurança
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-[#3e2626] hover:bg-[#3e2626]/5"
                  >
                    <FileText className="h-4 w-4 mr-3" />
                    Logs
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </div>
              </div>
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">N</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:ml-64">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-[#3e2626]">Gestão de Produtos</h1>
                  <p className="text-sm text-gray-600">Gerencie o catálogo de produtos da empresa</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search here"
                    className="pl-10 w-64"
                  />
                </div>
            
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">9</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6">
            <ProductsSection 
              products={products}
              isLoading={isLoading}
              token={token}
              onProductsChange={loadProductsData}
            />
          </main>
        </div>
      </div>
    </NoSSR>
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

  // Estados para modal de novo produto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: 'SOFA',
    price: 0,
    costPrice: 0,
    stock: 0,
    minStock: 0,
    style: 'MODERNO',
    material: 'MADEIRA',
    colorHex: '',
    colorName: '',
    customColor: '',
    width: 0,
    height: 0,
    depth: 0,
    weight: 0,
    brand: '',
    model: '',
    sku: '',
    barcode: '',
    videoUrl: '',
    tags: [] as string[],
    keywords: [] as string[],
    isFeatured: false,
    isNew: false,
    isBestSeller: false,
    isActive: true,
    isAvailable: true,
    storeId: ''
  });
  const [productImages, setProductImages] = useState<File[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Função para criar novo produto
  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsCreating(true);
    try {
      console.log('Criando produto no banco:', newProduct);
      
      // Preparar dados para envio
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category: newProduct.category,
        sku: newProduct.sku,
        isActive: newProduct.isActive
      };

      console.log('Dados do produto a serem enviados:', productData);

      // Chamar API para criar produto
      const response = await adminAPI.createProduct(token || '', productData);
      
      if (response.ok) {
        const createdProduct = await response.json();
        console.log('Produto criado com sucesso:', createdProduct);
        
        // Upload das imagens se fornecidas
        if (productImages.length > 0) {
          console.log('Enviando imagens:', productImages.length);
          // TODO: Implementar upload das imagens para o servidor
        }
        
        alert('Produto criado com sucesso!');
        setIsModalOpen(false);
        setNewProduct({
          name: '',
          description: '',
          price: '',
          stock: '',
          category: 'Tintas',
          sku: '',
          isActive: true
        });
        setProductImages([]);
        
        // Recarregar dados do banco
        onProductsChange();
      } else {
        const errorData = await response.json();
        console.error('Erro na API:', errorData);
        alert(`Erro ao criar produto: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      alert('Erro ao criar produto. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewProduct({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: 'Tintas',
      sku: '',
      isActive: true
    });
    setProductImages([]);
  };

  // Função para editar produto
  const handleEditProduct = async (productId: string) => {
    try {
      console.log('Editando produto:', productId);
      // TODO: Implementar modal de edição
      alert('Funcionalidade de edição será implementada em breve');
    } catch (error) {
      console.error('Erro ao editar produto:', error);
      alert('Erro ao editar produto');
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
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-[#3e2626] hover:bg-white/90 font-semibold px-6 py-2 rounded-xl"
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
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditProduct(product.id)}
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
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditProduct(product.id)}
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

      {/* Modal de Novo Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Novo Produto</CardTitle>
                  <CardDescription className="text-white/80">
                    Preencha os dados para criar um novo produto
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Ex: Sofá 3 Lugares Moderno"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <select
                      id="category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                    >
                      <option value="SOFA">Sofá</option>
                      <option value="MESA">Mesa</option>
                      <option value="CADEIRA">Cadeira</option>
                      <option value="ARMARIO">Armário</option>
                      <option value="ESTANTE">Estante</option>
                      <option value="POLTRONA">Poltrona</option>
                      <option value="QUADRO">Quadro</option>
                      <option value="LUMINARIA">Luminária</option>
                      <option value="OUTROS">Outros</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      placeholder="1299.90"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Preço de Custo</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      value={newProduct.costPrice}
                      onChange={(e) => setNewProduct({ ...newProduct, costPrice: Number(e.target.value) })}
                      placeholder="800.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Estoque *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Estoque Mínimo</Label>
                    <Input
                      id="minStock"
                      type="number"
                      value={newProduct.minStock}
                      onChange={(e) => setNewProduct({ ...newProduct, minStock: Number(e.target.value) })}
                      placeholder="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      placeholder="SOFA-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Código de Barras</Label>
                    <Input
                      id="barcode"
                      value={newProduct.barcode}
                      onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                      placeholder="7891234567890"
                    />
                  </div>
                </div>
              </div>

              {/* Descrições */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Descrições
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição Completa</Label>
                    <textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Descrição detalhada do produto..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626] resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shortDescription">Descrição Curta</Label>
                    <Input
                      id="shortDescription"
                      value={newProduct.shortDescription}
                      onChange={(e) => setNewProduct({ ...newProduct, shortDescription: e.target.value })}
                      placeholder="Descrição resumida para listagens"
                    />
                  </div>
                </div>
              </div>

              {/* Características */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Características
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="style">Estilo</Label>
                    <select
                      id="style"
                      value={newProduct.style}
                      onChange={(e) => setNewProduct({ ...newProduct, style: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                    >
                      <option value="MODERNO">Moderno</option>
                      <option value="MINIMALISTA">Minimalista</option>
                      <option value="RUSTICO">Rústico</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <select
                      id="material"
                      value={newProduct.material}
                      onChange={(e) => setNewProduct({ ...newProduct, material: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                    >
                      <option value="MADEIRA">Madeira</option>
                      <option value="METAL">Metal</option>
                      <option value="COURO">Couro</option>
                      <option value="TECIDO">Tecido</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      placeholder="Ex: Tok&Stok"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={newProduct.model}
                      onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
                      placeholder="Ex: Moderno 2024"
                    />
                  </div>
                </div>
              </div>

              {/* Cores */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Palette className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Cores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="colorName">Nome da Cor</Label>
                    <Input
                      id="colorName"
                      value={newProduct.colorName}
                      onChange={(e) => setNewProduct({ ...newProduct, colorName: e.target.value })}
                      placeholder="Ex: Azul Marinho"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colorHex">Código da Cor (HEX)</Label>
                    <Input
                      id="colorHex"
                      value={newProduct.colorHex}
                      onChange={(e) => setNewProduct({ ...newProduct, colorHex: e.target.value })}
                      placeholder="#1E3A8A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customColor">Cor Personalizada</Label>
                    <Input
                      id="customColor"
                      value={newProduct.customColor}
                      onChange={(e) => setNewProduct({ ...newProduct, customColor: e.target.value })}
                      placeholder="Descrição da cor customizada"
                    />
                  </div>
                </div>
              </div>

              {/* Dimensões */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Ruler className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Dimensões
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Largura (cm)</Label>
                    <Input
                      id="width"
                      type="number"
                      step="0.01"
                      value={newProduct.width}
                      onChange={(e) => setNewProduct({ ...newProduct, width: Number(e.target.value) })}
                      placeholder="200.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.01"
                      value={newProduct.height}
                      onChange={(e) => setNewProduct({ ...newProduct, height: Number(e.target.value) })}
                      placeholder="80.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depth">Profundidade (cm)</Label>
                    <Input
                      id="depth"
                      type="number"
                      step="0.01"
                      value={newProduct.depth}
                      onChange={(e) => setNewProduct({ ...newProduct, depth: Number(e.target.value) })}
                      placeholder="90.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={newProduct.weight}
                      onChange={(e) => setNewProduct({ ...newProduct, weight: Number(e.target.value) })}
                      placeholder="45.50"
                    />
                  </div>
                </div>
              </div>

              {/* Mídia */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Mídia
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Imagens do Produto</Label>
                    <ImageUpload
                      images={productImages}
                      onImagesChange={setProductImages}
                      maxImages={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">URL do Vídeo</Label>
                    <Input
                      id="videoUrl"
                      value={newProduct.videoUrl}
                      onChange={(e) => setNewProduct({ ...newProduct, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                </div>
              </div>

              {/* Tags e Palavras-chave */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Tags e Palavras-chave
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input
                      id="tags"
                      value={newProduct.tags.join(', ')}
                      onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })}
                      placeholder="moderno, confortável, elegante"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
                    <Input
                      id="keywords"
                      value={newProduct.keywords.join(', ')}
                      onChange={(e) => setNewProduct({ ...newProduct, keywords: e.target.value.split(',').map(keyword => keyword.trim()).filter(keyword => keyword) })}
                      placeholder="sofá, sala, moderno, conforto"
                    />
                  </div>
                </div>
              </div>

              {/* Status e Configurações */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-[#3e2626]" />
                  Status e Configurações
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={newProduct.isActive}
                        onChange={(e) => setNewProduct({ ...newProduct, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-[#3e2626] focus:ring-[#3e2626]"
                      />
                      <Label htmlFor="isActive" className="text-sm">
                        Produto ativo
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAvailable"
                        checked={newProduct.isAvailable}
                        onChange={(e) => setNewProduct({ ...newProduct, isAvailable: e.target.checked })}
                        className="rounded border-gray-300 text-[#3e2626] focus:ring-[#3e2626]"
                      />
                      <Label htmlFor="isAvailable" className="text-sm">
                        Disponível para venda
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        checked={newProduct.isFeatured}
                        onChange={(e) => setNewProduct({ ...newProduct, isFeatured: e.target.checked })}
                        className="rounded border-gray-300 text-[#3e2626] focus:ring-[#3e2626]"
                      />
                      <Label htmlFor="isFeatured" className="text-sm">
                        Produto em destaque
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isNew"
                        checked={newProduct.isNew}
                        onChange={(e) => setNewProduct({ ...newProduct, isNew: e.target.checked })}
                        className="rounded border-gray-300 text-[#3e2626] focus:ring-[#3e2626]"
                      />
                      <Label htmlFor="isNew" className="text-sm">
                        Produto novo
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isBestSeller"
                        checked={newProduct.isBestSeller}
                        onChange={(e) => setNewProduct({ ...newProduct, isBestSeller: e.target.checked })}
                        className="rounded border-gray-300 text-[#3e2626] focus:ring-[#3e2626]"
                      />
                      <Label htmlFor="isBestSeller" className="text-sm">
                        Mais vendido
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="flex items-center justify-end space-x-3 p-6 border-t">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateProduct}
                disabled={isCreating}
                className="bg-[#3e2626] hover:bg-[#4a2f2f]"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Produto
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}