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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import ClientOnly from '@/components/ClientOnly';
import HydrationBoundary from '@/components/HydrationBoundary';
import NoSSR from '@/components/NoSSR';
import ImageUpload from '@/components/ImageUpload';
import DeleteProductConfirmDialog from '@/components/DeleteProductConfirmDialog';
import { toast } from 'sonner';
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
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import AdminProductModal from '@/components/AdminProductModal';
import ProductViewer3D from '@/components/ProductViewer3D';
import ProductViewer3DAdvanced from '@/components/ProductViewer3DAdvanced';
import PhotoTo3DConverter from '@/components/PhotoTo3DConverter';
import Direct3DUploader from '@/components/Direct3DUploader';
import FlashSalePanel from '@/components/FlashSalePanel';

export default function ProductsPage() {
  const router = useRouter();
  const { token } = useAppStore();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Aumentar limite padrão para 50

  // Filtros para produtos
  const [productFilters, setProductFilters] = useState({
    category: 'all',
    status: 'all',
    search: ''
  });
  
  // Estados para o modal de produto
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  
  // Estados para o visualizador 3D
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [productFor3D, setProductFor3D] = useState<any | null>(null);
  const [viewerMode, setViewerMode] = useState<'basic' | 'advanced'>('advanced');
  
  // Estados para o conversor de foto para 3D
  const [isPhotoTo3DOpen, setIsPhotoTo3DOpen] = useState(false);
  
  // Estados para o upload direto de 3D
  const [isDirect3DUploadOpen, setIsDirect3DUploadOpen] = useState(false);
  
  // Estados para o modal de confirmação de exclusão
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estado para o painel de oferta relâmpago
  const [showFlashSalePanel, setShowFlashSalePanel] = useState(false);
  
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState<'all' | 'on-sale'>('all');

  // Removido useEffect que estava causando recarregamentos constantes
  // Os filtros agora são gerenciados no componente ProductsSection

  // Carregar dados quando o componente montar ou quando página/limite mudarem
  useEffect(() => {
    loadProductsData(currentPage, pageLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageLimit]);

  const loadProductsData = async (page: number = currentPage, limit: number = pageLimit, filters?: { search?: string; category?: string }) => {
    try {
      setIsLoading(true);
      
      console.log('Carregando dados de produtos do banco...', { page, limit, filters });
      
      // Usar filtros fornecidos ou os do estado
      const searchFilter = filters?.search ?? productFilters.search;
      const categoryFilter = filters?.category ?? productFilters.category;
      
      // Carregar dados reais da API
      try {
        console.log('📦 Chamando adminAPI.getProducts()...');
        const productsData = await adminAPI.getProducts(
          page,
          limit,
          searchFilter || undefined,
          categoryFilter !== 'all' ? categoryFilter : undefined
        );
        console.log('📦 Dados recebidos:', productsData);
        
        // A API retorna { products: [...], pagination: {...} }
        const productsArray = Array.isArray(productsData) 
          ? productsData 
          : (productsData?.products || []);
        
        // Atualizar informações de paginação (sem atualizar currentPage para evitar loops)
        if (productsData?.pagination) {
          const newTotalPages = productsData.pagination.pages || 1;
          const newTotal = productsData.pagination.total || 0;
          
          // Só atualizar se os valores realmente mudaram
          if (newTotalPages !== totalPages) {
            setTotalPages(newTotalPages);
          }
          if (newTotal !== totalProducts) {
            setTotalProducts(newTotal);
          }
          // NÃO atualizar currentPage aqui para evitar loops infinitos
        }
        
        console.log('📦 Produtos extraídos:', productsArray.length, 'produtos de', productsData?.pagination?.total || 0, 'total');
        setProducts(productsArray);
      } catch (apiError) {
        console.error('❌ Erro ao chamar API de produtos:', apiError);
        setProducts([]);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
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
    // Fechar modal primeiro
    setIsModalOpen(false);
    setSelectedProduct(null);
    // Atualizar produtos via callback - usar página atual
    // Usar setTimeout para evitar conflitos com estados
    setTimeout(() => {
      loadProductsData(currentPage, pageLimit);
    }, 100);
  };

  const handleProductDeleted = (productId: string) => {
    // Fechar modal primeiro
    setIsModalOpen(false);
    setSelectedProduct(null);
    // Atualizar produtos via callback - usar página atual
    // Usar setTimeout para evitar conflitos com estados
    setTimeout(() => {
      loadProductsData(currentPage, pageLimit);
    }, 100);
  };

  // Abrir modal de confirmação de exclusão
  const handleDeleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      console.log('Deletando produto:', productToDelete.id);
      
      const response = await fetch(`http://localhost:3001/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast.success('Produto deletado com sucesso!', {
          description: `${productToDelete.name} foi removido do sistema.`,
          duration: 4000,
        });
        loadProductsData();
        setIsDeleteDialogOpen(false);
        setProductToDelete(null);
      } else {
        const errorData = await response.json();
        toast.error('Erro ao deletar produto', {
          description: errorData.message || 'Erro desconhecido',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      toast.error('Erro ao deletar produto', {
        description: 'Tente novamente mais tarde.',
        duration: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancelar exclusão
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  // Função para recarregar produtos após atualização
  const onProductsChange = () => {
    loadProductsData(currentPage, pageLimit);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section - sempre visível */}
      <div className="bg-[#3e2626] text-white py-12 px-4 rounded-2xl mb-8 shadow-xl">
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
            <div className="flex space-x-3 flex-wrap gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowFlashSalePanel(!showFlashSalePanel)}
                className={`border-2 border-yellow-500 font-semibold shadow-lg ${
                  showFlashSalePanel 
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                    : 'text-yellow-600 hover:bg-yellow-500 hover:text-white'
                }`}
              >
                <Zap className="h-4 w-4 mr-2" />
                {showFlashSalePanel ? 'Voltar para Produtos' : 'Oferta Relâmpago'}
              </Button>
              {!showFlashSalePanel && (
                <>
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
                    onClick={() => {
                      setSelectedProduct(null);
                      setModalMode('create');
                      setIsModalOpen(true);
                    }}
                    className="bg-[#3e2626] hover:bg-[#8B4513]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Renderização condicional: Painel de Oferta Relâmpago ou conteúdo normal */}
      {showFlashSalePanel ? (
        <div className="px-6 pb-6">
          <FlashSalePanel
            products={products}
            onProductUpdated={onProductsChange}
            onClose={() => setShowFlashSalePanel(false)}
            token={token || ''}
          />
        </div>
      ) : (
        <div className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'on-sale')} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Todos os Produtos
              </TabsTrigger>
              <TabsTrigger value="on-sale" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Produtos em Oferta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <ProductsSection 
                products={products}
                isLoading={isLoading}
                token={token}
                onProductsChange={onProductsChange}
                onDeleteProduct={handleDeleteProduct}
                currentPage={currentPage}
                totalPages={totalPages}
                totalProducts={totalProducts}
                pageLimit={pageLimit}
                onPageChange={(page: number) => {
                  setCurrentPage(page);
                  loadProductsData(page, pageLimit);
                }}
                onLimitChange={(limit: number) => {
                  setPageLimit(limit);
                  setCurrentPage(1);
                  loadProductsData(1, limit);
                }}
                showOnlyOnSale={false}
              />
            </TabsContent>

            <TabsContent value="on-sale" className="mt-0">
              <ProductsSection 
                products={products}
                isLoading={isLoading}
                token={token}
                onProductsChange={onProductsChange}
                onDeleteProduct={handleDeleteProduct}
                currentPage={currentPage}
                totalPages={totalPages}
                totalProducts={totalProducts}
                pageLimit={pageLimit}
                onPageChange={(page: number) => {
                  setCurrentPage(page);
                  loadProductsData(page, pageLimit);
                }}
                onLimitChange={(limit: number) => {
                  setPageLimit(limit);
                  setCurrentPage(1);
                  loadProductsData(1, limit);
                }}
                showOnlyOnSale={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <DeleteProductConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        productName={productToDelete?.name || ''}
        productCategory={productToDelete?.category}
        isLoading={isDeleting}
      />

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
              onClose={() => {
                setIs3DViewerOpen(false);
                setProductFor3D(null);
              }}
            />
          ) : (
            <ProductViewer3DAdvanced
              product={productFor3D}
              isOpen={is3DViewerOpen}
              onClose={() => {
                setIs3DViewerOpen(false);
                setProductFor3D(null);
              }}
            />
          )}
        </>
      )}

      {/* Conversor de Foto para 3D */}
      {isPhotoTo3DOpen && (
        <PhotoTo3DConverter
          onConverted={(model3D) => {
            onProductsChange();
            setIsPhotoTo3DOpen(false);
          }}
          onClose={() => setIsPhotoTo3DOpen(false)}
        />
      )}

      {/* Upload Direto de 3D */}
      {isDirect3DUploadOpen && (
        <Direct3DUploader
          onUploaded={(model3D) => {
            onProductsChange();
            setIsDirect3DUploadOpen(false);
          }}
          onClose={() => setIsDirect3DUploadOpen(false)}
        />
      )}
    </div>
  );
}

// Componente da seção de produtos
function ProductsSection({ 
  products, 
  isLoading, 
  token, 
  onProductsChange, 
  onDeleteProduct,
  currentPage = 1,
  totalPages = 1,
  totalProducts = 0,
  pageLimit = 50,
  onPageChange,
  onLimitChange,
  showOnlyOnSale = false
}: any) {
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

  // Visualizar produto por ID (não utilizado atualmente)
  // Mantido como utilitário opcional; prefira handleViewProduct(product)
  // function handleViewProductById(productId: string) {
  //   const product = products.find((p: any) => p.id === productId);
  //   if (product) {
  //     handleViewProduct(product);
  //   }
  // }


  // Função para verificar se um produto está em oferta relâmpago ativa
  const isFlashSaleActive = (product: any) => {
    if (!product.isFlashSale || !product.flashSaleStartDate || !product.flashSaleEndDate) {
      return false;
    }
    const now = new Date();
    const start = new Date(product.flashSaleStartDate);
    const end = new Date(product.flashSaleEndDate);
    return now >= start && now <= end;
  };

   // Função para filtrar produtos
  const getFilteredProducts = () => {
    if (!Array.isArray(products)) return [];
    
    return products
      .filter((product: any) => {
        // Filtro por oferta relâmpago ativa
        if (showOnlyOnSale) {
          if (!isFlashSaleActive(product)) {
            return false;
          }
        }
        
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
          return product.name?.toLowerCase().includes(searchTerm);
        }
        
        return true;
      })
      .sort((a: any, b: any) => {
        // Se estiver mostrando apenas ofertas, ordenar por desconto (maior primeiro)
        if (showOnlyOnSale) {
          const discountA = a.flashSaleDiscountPercent || 0;
          const discountB = b.flashSaleDiscountPercent || 0;
          if (discountB !== discountA) {
            return discountB - discountA;
          }
        }
        return a.name.localeCompare(b.name);
      });
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  
  // Estados para o visualizador 3D
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [productFor3D, setProductFor3D] = useState<any | null>(null);
  const [viewerMode, setViewerMode] = useState<'basic' | 'advanced'>('advanced');
  
  // Estados para o conversor de foto para 3D
  const [isPhotoTo3DOpen, setIsPhotoTo3DOpen] = useState(false);
  
  // Estados para o upload direto de 3D
  const [isDirect3DUploadOpen, setIsDirect3DUploadOpen] = useState(false);


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

  const handleView3D = (product: any) => {
    setProductFor3D(product);
    setIs3DViewerOpen(true);
  };

  const handleClose3DViewer = () => {
    setIs3DViewerOpen(false);
    setProductFor3D(null);
  };

  const handleGenerate3D = async (product: any) => {
    if (!product.imageUrls || product.imageUrls.length === 0) {
      toast.error('Produto sem imagem', {
        description: 'Produto precisa ter pelo menos uma imagem para gerar modelo 3D.',
        duration: 4000,
      });
      return;
    }

    try {
      toast.info('Gerando modelo 3D...', {
        description: 'Isso pode levar alguns minutos.',
        duration: 3000,
      });

      // Download da primeira imagem do produto
      const response = await fetch(product.imageUrls[0]);
      const blob = await response.blob();
      const file = new File([blob], 'product-image.jpg', { type: blob.type });
      
      console.log('📤 Download da imagem:', {
        url: product.imageUrls[0],
        size: blob.size,
        type: blob.type,
        fileName: file.name
      });

      // Criar FormData para enviar ao backend
      const formData = new FormData();
      formData.append('images', file);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      console.log('📤 Enviando para:', `${API_BASE_URL}/admin/products/${product.id}/generate-3d`);
      
      const backendResponse = await fetch(`${API_BASE_URL}/admin/products/${product.id}/generate-3d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });
      
      console.log('📥 Resposta do backend:', backendResponse.status, backendResponse.statusText);

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({ message: 'Erro desconhecido' }));
        console.error('❌ Erro do backend:', errorData);
        throw new Error(errorData.message || 'Erro ao gerar modelo 3D');
      }

      const result = await backendResponse.json();
      
      toast.success('Modelo 3D gerado!', {
        description: 'Produto atualizado com sucesso.',
        duration: 4000,
      });

      // Recarregar produtos
      onProductsChange();
    } catch (error: any) {
      console.error('Erro ao gerar modelo 3D:', error);
      toast.error('Erro ao gerar modelo 3D', {
        description: error.message || 'Tente novamente mais tarde.',
        duration: 4000,
      });
    }
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

  const handleProductUpdated = (updatedProduct: any) => {
    // Atualizar produtos via callback
    onProductsChange();
  };

  const handleProductDeleted = (productId: string) => {
    // Atualizar produtos via callback
    onProductsChange();
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

  // Calcular produtos em oferta
  const productsOnSale = products.filter((p: any) => isFlashSaleActive(p));
  const filteredProductsList = getFilteredProducts();

  return (
    <div className="px-6 pb-6">
      {/* Stats Cards - Brand Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {showOnlyOnSale ? (
          <>
            <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-2 border-yellow-500/20 shadow-lg hover:shadow-xl hover:border-yellow-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-yellow-600 uppercase tracking-wide">Produtos em Oferta</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {filteredProductsList.length}
                    </p>
                    <p className="text-xs text-yellow-600/70">Ofertas ativas</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-2 border-red-500/20 shadow-lg hover:shadow-xl hover:border-red-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Desconto Médio</p>
                    <p className="text-3xl font-bold text-red-600">
                      {filteredProductsList.length > 0 
                        ? `${Math.round(filteredProductsList.reduce((sum: number, p: any) => sum + (p.flashSaleDiscountPercent || 0), 0) / filteredProductsList.length)}%`
                        : '0%'}
                    </p>
                    <p className="text-xs text-red-600/70">Desconto médio</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-2 border-green-500/20 shadow-lg hover:shadow-xl hover:border-green-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Valor Economizado</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatPrice(filteredProductsList.reduce((sum: number, p: any) => {
                        const originalPrice = p.price || 0;
                        const salePrice = p.flashSalePrice || originalPrice;
                        return sum + (originalPrice - salePrice);
                      }, 0))}
                    </p>
                    <p className="text-xs text-green-600/70">Total em descontos</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
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
                      {formatPrice(filteredProductsList.reduce((sum: number, p: any) => sum + ((p.flashSalePrice || p.price) * p.stock), 0))}
                    </p>
                    <p className="text-xs text-purple-600/70">Com desconto</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="bg-gradient-to-br from-[#3e2626]/5 to-[#3e2626]/10 border-2 border-[#3e2626]/20 shadow-lg hover:shadow-xl hover:border-[#3e2626]/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#3e2626] uppercase tracking-wide">Total</p>
                    <p className="text-3xl font-bold text-[#3e2626]">
                      {totalProducts > 0 ? totalProducts : products.length}
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
                    <p className="text-sm font-semibold text-yellow-600 uppercase tracking-wide">Em Oferta</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {productsOnSale.length}
                    </p>
                    <p className="text-xs text-yellow-600/70">Ofertas ativas</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-yellow-600" />
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
          </>
        )}
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
            {filteredProductsList.map((product: any) => {
              const stockStatus = getStockStatus(product.stock);
              const isOnSale = isFlashSaleActive(product);
              const salePrice = product.flashSalePrice || product.price;
              const originalPrice = product.price;
              
              return (
                <Card key={product.id} className={`bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden ${isOnSale ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}>
                  <CardContent className="p-0">
                    {/* Imagem do produto */}
                    {(product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : product.imageUrl) && (
                      <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
                        <img
                          src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        {isOnSale && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                            <Zap className="h-3 w-3" />
                            OFERTA RELÂMPAGO
                          </div>
                        )}
                        {product.imageUrls && product.imageUrls.length > 1 && (
                          <div className="absolute bottom-2 right-2 text-white text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(62, 38, 38, 0.7)' }}>
                            +{product.imageUrls.length - 1} mais
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`bg-gradient-to-r ${isOnSale ? 'from-yellow-50 to-orange-50' : 'from-[#3e2626]/5 to-[#3e2626]/10'} p-6`}>
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 ${isOnSale ? 'bg-yellow-500' : 'bg-[#3e2626]'} rounded-xl flex items-center justify-center`}>
                          {isOnSale ? (
                            <Zap className="h-6 w-6 text-white" />
                          ) : (
                            <Package className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {product.category}
                          </p>
                          <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
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
                            {isOnSale && product.flashSaleDiscountPercent && (
                              <Badge className="bg-red-500 text-white text-xs font-bold">
                                -{product.flashSaleDiscountPercent}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          {isOnSale ? (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-green-600">
                                {formatPrice(salePrice)}
                              </span>
                              <span className="text-lg text-gray-400 line-through">
                                {formatPrice(originalPrice)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-[#3e2626]">
                              {formatPrice(originalPrice)}
                            </span>
                          )}
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
                            className={`h-8 w-8 p-0 ${product.model3DUrl ? 'text-purple-600 hover:text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}
                            onClick={product.model3DUrl ? () => handleView3D(product) : () => handleGenerate3D(product)}
                            title={product.model3DUrl ? "Visualizar 3D" : "Gerar Modelo 3D"}
                          >
                            <Box className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewProduct(product)}
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
                            onClick={() => onDeleteProduct(product.id)}
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
                    {filteredProductsList.map((product: any) => {
                      const stockStatus = getStockStatus(product.stock);
                      const isOnSale = isFlashSaleActive(product);
                      const salePrice = product.flashSalePrice || product.price;
                      const originalPrice = product.price;
                      
                      return (
                        <tr 
                          key={product.id} 
                          className={`hover:bg-gray-50 ${isOnSale ? 'bg-yellow-50/50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 ${isOnSale ? 'bg-yellow-500' : 'bg-[#3e2626]'} rounded-lg flex items-center justify-center mr-3`}>
                                {isOnSale ? (
                                  <Zap className="h-5 w-5 text-white" />
                                ) : (
                                  <Package className="h-5 w-5 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {product.name}
                                  </div>
                                  {isOnSale && (
                                    <Badge className="bg-yellow-500 text-white text-xs font-bold animate-pulse">
                                      <Zap className="h-3 w-3 mr-1" />
                                      OFERTA
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.sku || 'Sem SKU'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {product.category}
                              </Badge>
                              {isOnSale && product.flashSaleDiscountPercent && (
                                <Badge className="bg-red-500 text-white text-xs font-bold">
                                  -{product.flashSaleDiscountPercent}%
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isOnSale ? (
                              <div className="flex flex-col">
                                <span className="font-bold text-green-600">
                                  {formatPrice(salePrice)}
                                </span>
                                <span className="text-xs text-gray-400 line-through">
                                  {formatPrice(originalPrice)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-900">
                                {formatPrice(originalPrice)}
                              </span>
                            )}
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
                                className={`h-8 w-8 p-0 ${product.model3DUrl ? 'text-purple-600 hover:text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}
                                onClick={product.model3DUrl ? () => handleView3D(product) : () => handleGenerate3D(product)}
                                title={product.model3DUrl ? "Visualizar 3D" : "Gerar Modelo 3D"}
                              >
                                <Box className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewProduct(product)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                onClick={() => onDeleteProduct(product.id)}
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

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="page-limit" className="text-sm font-medium text-gray-700">
                  Itens por página:
                </Label>
                <select
                  id="page-limit"
                  value={pageLimit}
                  onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2626]/20 focus:border-[#3e2626]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">
                  Mostrando {((currentPage - 1) * pageLimit) + 1} - {Math.min(currentPage * pageLimit, totalProducts)} de {totalProducts} produtos
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange && onPageChange(1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Primeira</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange && onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                
                <div className="flex items-center gap-1 px-4">
                  <span className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange && onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Próxima</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange && onPageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Última</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}