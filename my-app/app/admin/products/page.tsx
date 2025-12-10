'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { adminAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { 
  Package, 
  DollarSign, 
  Plus,
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle,
  Zap, 
  RefreshCw,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Loader } from '@/components/ui/ai/loader';
import AdminProductModal from '@/components/AdminProductModal';
import FlashSalePanel from '@/components/FlashSalePanel';
import DeleteProductConfirmDialog from '@/components/DeleteProductConfirmDialog';

export default function ProductsPage() {
  const router = useRouter();
  const { token } = useAppStore();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageLimit, setPageLimit] = useState(50);

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  
  
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [showFlashSalePanel, setShowFlashSalePanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'on-sale'>('all');

  useEffect(() => {
    loadProductsData(currentPage, pageLimit);
  }, [currentPage, pageLimit]);

  const loadProductsData = async (page: number = currentPage, limit: number = pageLimit) => {
    try {
      setIsLoading(true);
      
      const productsData = await adminAPI.getProducts(page, limit);
        
      const productsArray = Array.isArray(productsData) 
        ? productsData 
        : (productsData?.products || []);
        
      if (productsData?.pagination) {
        setTotalPages(productsData.pagination.pages || 1);
        setTotalProducts(productsData.pagination.total || 0);
      }
        
      setProducts(productsArray);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
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
    setIsModalOpen(false);
    setSelectedProduct(null);
    setTimeout(() => {
      loadProductsData(currentPage, pageLimit);
    }, 100);
  };

  const handleProductDeleted = (productId: string) => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setTimeout(() => {
      loadProductsData(currentPage, pageLimit);
    }, 100);
  };

  const handleDeleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
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
        });
        loadProductsData();
        setIsDeleteDialogOpen(false);
        setProductToDelete(null);
      } else {
        const errorData = await response.json();
        toast.error('Erro ao deletar produto', {
          description: errorData.message || 'Erro desconhecido',
        });
      }
    } catch (error) {
      toast.error('Erro ao deletar produto', {
        description: 'Tente novamente mais tarde.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const onProductsChange = () => {
    loadProductsData(currentPage, pageLimit);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader size={40} className="mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showFlashSalePanel ? (
        <FlashSalePanel
          products={products}
          onProductUpdated={onProductsChange}
          onClose={() => setShowFlashSalePanel(false)}
          token={token || ''}
        />
      ) : (
        <>
          {/* Hero Section */}
          <section className="rounded-3xl border border-border bg-[#3e2626] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 text-primary-foreground shadow-sm">
            <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl space-y-4 w-full min-w-0">
                <Badge
                  variant="outline"
                  className="border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground"
                >
                  Gestão de Produtos
                </Badge>
                <div className="space-y-3">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight">
                    Gerenciar Produtos
                  </h1>
                  <p className="text-sm text-primary-foreground/80 lg:text-base">
                    Gerencie o catálogo de produtos da empresa. Controle estoque, preços e ofertas.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                  <Button 
                    onClick={() => {
                      setSelectedProduct(null);
                      setModalMode('create');
                      setIsModalOpen(true);
                    }}
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </Button>
                  <Button
                    variant="outline"
                    className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 w-full sm:w-auto"
                    onClick={() => setShowFlashSalePanel(true)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Oferta Relâmpago</span>
                    <span className="sm:hidden">Oferta</span>
                  </Button>
                 
                </div>
              </div>

              <ProductsStats products={products} totalProducts={totalProducts} />
            </div>
          </section>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'on-sale')} className="w-full">
            <TabsList className="grid w-full max-w-full sm:max-w-md grid-cols-2">
              <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Todos os Produtos</span>
                <span className="sm:hidden">Todos</span>
              </TabsTrigger>
              <TabsTrigger value="on-sale" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Produtos em Oferta</span>
                <span className="sm:hidden">Ofertas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <ProductsSection 
                products={products}
                isLoading={isLoading}
                token={token}
                onProductsChange={onProductsChange}
                onDeleteProduct={handleDeleteProduct}
                onViewProduct={handleViewProduct}
                onEditProduct={handleEditProduct}
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

            <TabsContent value="on-sale" className="mt-6">
              <ProductsSection 
                products={products}
                isLoading={isLoading}
                token={token}
                onProductsChange={onProductsChange}
                onDeleteProduct={handleDeleteProduct}
                onViewProduct={handleViewProduct}
                onEditProduct={handleEditProduct}
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
        </>
      )}

      <DeleteProductConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        productName={productToDelete?.name || ''}
        productCategory={productToDelete?.category}
        isLoading={isDeleting}
      />

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

function ProductsStats({ products, totalProducts }: any) {
  const stats = useMemo(() => {
    const isFlashSaleActive = (product: any) => {
      if (!product.isFlashSale || !product.flashSaleStartDate || !product.flashSaleEndDate) {
        return false;
      }
      const now = new Date();
      const start = new Date(product.flashSaleStartDate);
      const end = new Date(product.flashSaleEndDate);
      return now >= start && now <= end;
    };

    const productsOnSale = products.filter((p: any) => isFlashSaleActive(p));
    const firstProductOnSale = productsOnSale.length > 0 ? productsOnSale[0] : null;

    return {
      total: totalProducts > 0 ? totalProducts : products.length,
      active: products.filter((p: any) => p.isActive).length,
      onSale: productsOnSale.length,
      onSaleProduct: firstProductOnSale,
      totalValue: products.reduce((sum: number, p: any) => sum + (p.price * (p.stock || 0)), 0),
      totalProfit: products.reduce((sum: number, p: any) => {
        if (p.costPrice && p.stock) {
          const profitPerUnit = p.price - p.costPrice;
          return sum + (profitPerUnit * p.stock);
        }
        return sum;
      }, 0),
    };
  }, [products, totalProducts]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid w-full max-w-full sm:max-w-md grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:max-w-xl">
      <div className="rounded-xl sm:rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-3 sm:p-4">
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary-foreground/10 text-primary-foreground mb-2 sm:mb-3">
          <Package className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <p className="text-xl sm:text-2xl font-semibold leading-tight">{stats.total}</p>
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Total</p>
      </div>
      <div className="rounded-xl sm:rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-3 sm:p-4">
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary-foreground/10 text-primary-foreground mb-2 sm:mb-3">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <p className="text-xl sm:text-2xl font-semibold leading-tight">{stats.active}</p>
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Ativos</p>
      </div>
      <div className="rounded-xl sm:rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-3 sm:p-4">
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary-foreground/10 text-primary-foreground mb-2 sm:mb-3">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <p className="text-sm sm:text-base font-semibold leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
          {stats.onSaleProduct ? stats.onSaleProduct.name : 'Nenhum'}
        </p>
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Em Oferta</p>
      </div>
      <div className="rounded-xl sm:rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-3 sm:p-4">
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary-foreground/10 text-primary-foreground mb-2 sm:mb-3">
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <p className="text-lg sm:text-2xl font-semibold leading-tight truncate">{formatPrice(stats.totalValue)}</p>
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-primary-foreground/70 mt-1">Valor Total</p>
      </div>
      <div className="rounded-xl sm:rounded-2xl border border-green-500/30 bg-green-500/20 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-300" />
        </div>
        <p className="text-lg sm:text-2xl font-semibold leading-tight truncate text-green-300">{formatPrice(stats.totalProfit)}</p>
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-green-300/70 mt-1">Lucro Potencial</p>
      </div>
    </div>
  );
}

function ProductsSection({ 
  products, 
  isLoading, 
  token, 
  onProductsChange, 
  onDeleteProduct,
  onViewProduct,
  onEditProduct,
  currentPage = 1,
  totalPages = 1,
  totalProducts = 0,
  pageLimit = 50,
  onPageChange,
  onLimitChange,
  showOnlyOnSale = false
}: any) {
  const [productFilters, setProductFilters] = useState({
    category: 'all',
    status: 'all',
    search: ''
  });

  const handleEditProductById = (productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    if (product && onEditProduct) {
      onEditProduct(product);
    }
  };

  const isFlashSaleActive = (product: any) => {
    if (!product.isFlashSale || !product.flashSaleStartDate || !product.flashSaleEndDate) {
      return false;
    }
    const now = new Date();
    const start = new Date(product.flashSaleStartDate);
    const end = new Date(product.flashSaleEndDate);
    return now >= start && now <= end;
  };

  const getFilteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    return products
      .filter((product: any) => {
        if (showOnlyOnSale) {
          if (!isFlashSaleActive(product)) {
            return false;
          }
        }
        
        if (productFilters.category !== 'all' && product.category !== productFilters.category) {
          return false;
        }
        
        if (productFilters.status !== 'all') {
          if (productFilters.status === 'active' && !product.isActive) return false;
          if (productFilters.status === 'inactive' && product.isActive) return false;
        }
        
        if (productFilters.search) {
          const searchTerm = productFilters.search.toLowerCase();
          return product.name?.toLowerCase().includes(searchTerm);
        }
        
        return true;
      })
      .sort((a: any, b: any) => {
        if (showOnlyOnSale) {
          const discountA = a.flashSaleDiscountPercent || 0;
          const discountB = b.flashSaleDiscountPercent || 0;
          if (discountB !== discountA) {
            return discountB - discountA;
          }
        }
        return a.name.localeCompare(b.name);
      });
  }, [products, productFilters, showOnlyOnSale]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Sem Estoque', color: 'border-border bg-muted/50 text-muted-foreground' };
    if (stock < 10) return { label: 'Estoque Baixo', color: 'border-border bg-muted/50 text-muted-foreground' };
    return { label: 'Em Estoque', color: 'border-border bg-muted/50 text-foreground' };
  };



  return (
    <>
      {/* Search and Filters */}
      <Card className="border border-border shadow-sm">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar produtos por nome..."
                  value={productFilters.search}
                  onChange={(e) => setProductFilters({ ...productFilters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={productFilters.category}
                onChange={(e) => setProductFilters({ ...productFilters, category: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Todas as categorias</option>
                <option value="SOFA">Sofá</option>
                <option value="MESA">Mesa</option>
                <option value="CADEIRA">Cadeira</option>
                <option value="ARMARIO">Armário</option>
                <option value="ESTANTE">Estante</option>
                <option value="POLTRONA">Poltrona</option>
                <option value="QUADRO">Quadro</option>
                <option value="LUMINARIA">Luminária</option>
                <option value="MESA_CENTRO">Mesa de centro</option>
              </select>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={productFilters.status}
                onChange={(e) => setProductFilters({ ...productFilters, status: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      {getFilteredProducts.length === 0 ? (
        <Card className="border border-border shadow-sm mt-2">
          <CardContent className="py-12 text-center mt-2">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {productFilters.search || productFilters.category !== 'all' || productFilters.status !== 'all'
                ? 'Tente ajustar os filtros para encontrar produtos.'
                : 'Comece criando seu primeiro produto.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4 sm:mt-8">
            {getFilteredProducts.map((product: any) => {
              const stockStatus = getStockStatus(product.stock);
              const isOnSale = isFlashSaleActive(product);
              const salePrice = product.flashSalePrice || product.price;
              const originalPrice = product.price;
              const imageUrl = (product.imageUrls && product.imageUrls.length > 0) 
                ? product.imageUrls[0] 
                : product.imageUrl;
              
              return (
                <Card key={product.id} className="border border-border shadow-sm transition hover:shadow-md overflow-hidden">
                  {imageUrl && (
                    <div className="aspect-video w-full overflow-hidden bg-muted relative">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {isOnSale && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-primary text-primary-foreground">
                            <Zap className="h-3 w-3 mr-1" />
                            OFERTA
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 truncate">{product.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{product.category}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground">
                          {product.category}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={
                            product.isActive 
                              ? 'border-border bg-muted/50 text-foreground' 
                              : 'border-border bg-muted/50 text-muted-foreground'
                          }
                        >
                          {product.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {isOnSale && product.flashSaleDiscountPercent && (
                          <Badge variant="outline" className="border-border bg-muted/50 text-foreground">
                            -{product.flashSaleDiscountPercent}%
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          {isOnSale ? (
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg sm:text-xl font-semibold text-foreground">
                                {formatPrice(salePrice)}
                              </span>
                              <span className="text-xs sm:text-sm text-muted-foreground line-through">
                                {formatPrice(originalPrice)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg sm:text-xl font-semibold text-foreground">
                              {formatPrice(originalPrice)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">Estoque: {product.stock || 0} unidades</span>
                        </div>
                        {product.sku && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Tag className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">SKU: {product.sku}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-border">
                        <Badge variant="outline" className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 pt-3 border-t border-border">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                            onClick={() => onViewProduct && onViewProduct(product)}
                            title="Visualizar produto"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-9 w-9 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                            onClick={() => handleEditProductById(product.id)}
                            title="Editar produto"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                            onClick={() => onDeleteProduct(product.id)}
                            title="Deletar produto"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="border border-border shadow-sm">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                      <Label htmlFor="page-limit" className="text-xs sm:text-sm whitespace-nowrap">
                        Itens por página:
                      </Label>
                      <select
                        id="page-limit"
                        value={pageLimit}
                        onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
                        className="h-10 rounded-md border border-input bg-background px-2 sm:px-3 py-2 text-sm flex-1 sm:flex-initial"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * pageLimit) + 1} - {Math.min(currentPage * pageLimit, totalProducts)} de {totalProducts} produtos
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center sm:justify-end gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange && onPageChange(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                    >
                      <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange && onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    
                    <span className="text-xs sm:text-sm text-foreground px-2 sm:px-4 min-w-[80px] sm:min-w-[120px] text-center">
                      Página {currentPage} de {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange && onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                    >
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange && onPageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                    >
                      <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      
    </>
  );
}
