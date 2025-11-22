'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { productsAPI, managerAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ImageUpload';
import { uploadMultipleProductImages } from '@/lib/supabase';
import { toast } from 'sonner';
import { showConfirm } from '@/lib/alerts';
import { 
  Package, 
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  Tag,
  Hash,
  Building,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Zap,
  Percent
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import FlashSalePanel from '@/components/FlashSalePanel';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  imageUrls?: string[];
  category?: string;
  brand?: string;
  isFlashSale?: boolean;
  flashSaleStartDate?: string;
  flashSaleEndDate?: string;
  flashSalePrice?: number;
  flashSaleDiscountPercent?: number;
  isOnSale?: boolean;
  saleStartDate?: string;
  saleEndDate?: string;
  salePrice?: number;
  saleDiscountPercent?: number;
}

export default function ManagerProductsPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Produtos
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Modal de Produto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editedProduct, setEditedProduct] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  // Carrossel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Estado para o painel de oferta relâmpago
  const [showFlashSalePanel, setShowFlashSalePanel] = useState(false);
  
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState<'all' | 'on-sale'>('all');

  const handleCreateProduct = () => {
    setEditedProduct({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: 'SOFA',
      brand: '',
      sku: '',
      colorName: '',
      supplierId: '',
      width: '',
      height: '',
      depth: '',
      weight: '',
      isActive: true,
      // Campos de oferta
      isOnSale: false,
      salePrice: undefined,
      saleDiscountPercent: undefined,
      saleStartDate: '',
      saleEndDate: ''
    });
    setExistingImages([]);
    setUploadedImages([]);
    setProductModalMode('create');
    setIsProductModalOpen(true);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setFilteredProducts(getFilteredProducts());
  }, [searchTerm, products, activeTab]);

  const loadProducts = async (forceReload = false) => {
    if (!user?.storeId) {
      console.warn('⚠️ Usuário não tem storeId associado:', user);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔄 [Manager] Carregando produtos da loja...', { 
        storeId: user.storeId,
        forceReload,
        timestamp: new Date().toISOString()
      });
      
      // IMPORTANTE: Usar o endpoint do manager que filtra APENAS produtos da loja do manager
      // Não usar productsAPI.getAll() que pode retornar produtos de outras lojas
      const response = await managerAPI.getStoreProducts(1, 1000, '', undefined);
      const productsData = response.products || [];
      
      console.log('📦 [Manager] Produtos carregados da loja:', {
        count: productsData?.length,
        storeId: user.storeId,
        products: productsData?.slice(0, 5).map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          storeId: p.storeId,
          originalStoreId: p.originalStoreId,
          availableViaStoreInventory: p.availableViaStoreInventory
        }))
      });
      
      // IMPORTANTE: Produtos podem ter storeId diferente se estiverem via StoreInventory
      // Isso é normal - o produto pode ter storeId de outra loja mas estar disponível
      // na loja do manager através do StoreInventory
      // Não é um erro, é o comportamento esperado para produtos em múltiplas lojas
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditedProduct({ ...product });
    const images = product?.imageUrls && product.imageUrls.length > 0 
      ? product.imageUrls 
      : product?.imageUrl 
        ? [product.imageUrl] 
        : [];
    setExistingImages(images);
    setUploadedImages([]);
    setCurrentImageIndex(0);
    setProductModalMode('view');
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    const processedProduct = { ...product };
    
    // Converter datas de oferta normal se existirem
    if (processedProduct.saleStartDate) {
      processedProduct.saleStartDate = typeof processedProduct.saleStartDate === 'string' 
        ? processedProduct.saleStartDate 
        : new Date(processedProduct.saleStartDate).toISOString();
    }
    if (processedProduct.saleEndDate) {
      processedProduct.saleEndDate = typeof processedProduct.saleEndDate === 'string' 
        ? processedProduct.saleEndDate 
        : new Date(processedProduct.saleEndDate).toISOString();
    }
    
    setEditedProduct(processedProduct);
    const images = product?.imageUrls && product.imageUrls.length > 0 
      ? product.imageUrls 
      : product?.imageUrl 
        ? [product.imageUrl] 
        : [];
    setExistingImages(images);
    setUploadedImages([]);
    setCurrentImageIndex(0);
    setProductModalMode('edit');
    setIsProductModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
    setEditedProduct(null);
    setExistingImages([]);
    setUploadedImages([]);
    setCurrentImageIndex(0);
  };

  const handleSaveProduct = async () => {
    if (!user?.storeId || !editedProduct) {
      toast.error('Erro ao criar produto', {
        description: 'Você não está associado a nenhuma filial',
      });
      return;
    }

    try {
      setIsLoading(true);

      if (!editedProduct.name || !editedProduct.category || editedProduct.price === undefined || editedProduct.stock === undefined) {
        toast.error('Campos obrigatórios', {
          description: 'Nome, categoria, preço e estoque são obrigatórios',
        });
        return;
      }

      let uploadedImageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        const tempProductId = productModalMode === 'create' ? `temp-${Date.now()}` : editedProduct.id;
        uploadedImageUrls = await uploadMultipleProductImages(uploadedImages, tempProductId);
      }

      const allImageUrls = [...existingImages, ...uploadedImageUrls];

      if (productModalMode === 'create') {
        const productData: any = {
          name: editedProduct.name.trim(),
          description: editedProduct.description?.trim() || '',
          price: Number(editedProduct.price),
          stock: Number(editedProduct.stock),
          category: editedProduct.category,
          brand: editedProduct.brand?.trim() || undefined,
          colorName: editedProduct.colorName?.trim() || undefined,
          imageUrl: allImageUrls[0] || undefined,
          imageUrls: allImageUrls.length > 0 ? allImageUrls : undefined,
          storeId: user.storeId
        };

        if (editedProduct.sku?.trim()) {
          productData.sku = editedProduct.sku.trim();
        }
        if (editedProduct.supplierId?.trim()) {
          productData.supplierId = editedProduct.supplierId.trim();
        }
        if (editedProduct.width && !isNaN(Number(editedProduct.width))) {
          productData.width = Number(editedProduct.width);
        }
        if (editedProduct.height && !isNaN(Number(editedProduct.height))) {
          productData.height = Number(editedProduct.height);
        }
        if (editedProduct.depth && !isNaN(Number(editedProduct.depth))) {
          productData.depth = Number(editedProduct.depth);
        }
        if (editedProduct.weight && !isNaN(Number(editedProduct.weight))) {
          productData.weight = Number(editedProduct.weight);
        }

        // Adicionar campos de oferta normal
        if (editedProduct.isOnSale) {
          productData.isOnSale = true;
          if (editedProduct.saleDiscountPercent) {
            productData.saleDiscountPercent = Number(editedProduct.saleDiscountPercent);
            // Calcular preço baseado no percentual
            if (editedProduct.price) {
              const discount = (editedProduct.price * editedProduct.saleDiscountPercent) / 100;
              productData.salePrice = editedProduct.price - discount;
            }
          } else if (editedProduct.salePrice) {
            productData.salePrice = Number(editedProduct.salePrice);
          }
          if (editedProduct.saleStartDate) {
            const startDate = new Date(editedProduct.saleStartDate);
            if (!isNaN(startDate.getTime())) {
              productData.saleStartDate = startDate.toISOString();
            }
          }
          if (editedProduct.saleEndDate) {
            const endDate = new Date(editedProduct.saleEndDate);
            if (!isNaN(endDate.getTime())) {
              productData.saleEndDate = endDate.toISOString();
            }
          }
        } else {
          productData.isOnSale = false;
        }

        await managerAPI.createStoreProduct(productData);
        toast.success('Produto criado com sucesso!');
      } else if (productModalMode === 'edit') {
        // IMPORTANTE: Não validar storeId no frontend
        // O backend verifica se o produto está disponível na loja do manager
        // de duas formas: via storeId direto OU via StoreInventory
        // Se o produto aparece na lista do manager, ele pode ser editado
        console.log('🔍 [Manager] Preparando para editar produto:', {
          productId: editedProduct.id,
          productName: editedProduct.name,
          productStoreId: editedProduct.storeId,
          managerStoreId: user.storeId,
          availableViaStoreInventory: editedProduct.availableViaStoreInventory
        });

        const updateData: any = {
          name: editedProduct.name.trim(),
          description: editedProduct.description?.trim() || '',
          price: Number(editedProduct.price),
          stock: Number(editedProduct.stock),
          category: editedProduct.category,
          imageUrl: allImageUrls[0] || undefined,
          imageUrls: allImageUrls.length > 0 ? allImageUrls : undefined,
          brand: editedProduct.brand?.trim() || undefined,
          colorName: editedProduct.colorName?.trim() || undefined
        };

        if (editedProduct.sku?.trim()) {
          updateData.sku = editedProduct.sku.trim();
        }
        if (editedProduct.supplierId?.trim()) {
          updateData.supplierId = editedProduct.supplierId.trim();
        }
        if (editedProduct.width && !isNaN(Number(editedProduct.width))) {
          updateData.width = Number(editedProduct.width);
        }
        if (editedProduct.height && !isNaN(Number(editedProduct.height))) {
          updateData.height = Number(editedProduct.height);
        }
        if (editedProduct.depth && !isNaN(Number(editedProduct.depth))) {
          updateData.depth = Number(editedProduct.depth);
        }
        if (editedProduct.weight && !isNaN(Number(editedProduct.weight))) {
          updateData.weight = Number(editedProduct.weight);
        }

        // Adicionar campos de oferta normal
        updateData.isOnSale = editedProduct.isOnSale || false;
        if (editedProduct.saleDiscountPercent) {
          updateData.saleDiscountPercent = Number(editedProduct.saleDiscountPercent);
          // Calcular preço baseado no percentual
          if (editedProduct.price) {
            const discount = (editedProduct.price * editedProduct.saleDiscountPercent) / 100;
            updateData.salePrice = editedProduct.price - discount;
          }
        } else if (editedProduct.salePrice) {
          updateData.salePrice = Number(editedProduct.salePrice);
        }
        if (editedProduct.saleStartDate) {
          const startDate = new Date(editedProduct.saleStartDate);
          if (!isNaN(startDate.getTime())) {
            updateData.saleStartDate = startDate.toISOString();
          }
        }
        if (editedProduct.saleEndDate) {
          const endDate = new Date(editedProduct.saleEndDate);
          if (!isNaN(endDate.getTime())) {
            updateData.saleEndDate = endDate.toISOString();
          }
        }

        console.log('📤 [Manager] Enviando atualização do produto:', {
          productId: editedProduct.id,
          updateData
        });

        const updatedProduct = await managerAPI.updateStoreProduct(editedProduct.id, updateData);
        console.log('✅ [Manager] Produto atualizado no backend:', {
          productId: updatedProduct?.id,
          productName: updatedProduct?.name,
          stock: updatedProduct?.stock,
          stockFromResponse: updatedProduct?.stock
        });
        
        // Usar o produto retornado do backend para atualizar o estado
        // Isso garante que estamos usando os dados corretos do servidor
        // IMPORTANTE: Preferir o stock do produto retornado do backend
        const finalStock = updatedProduct?.stock !== undefined ? updatedProduct.stock : Number(updateData.stock);
        
        setProducts(prevProducts => {
          const updated = prevProducts.map(p => {
            if (p.id === editedProduct.id) {
              const newProduct = { 
                ...p, 
                ...updatedProduct,
                stock: finalStock // Garantir que o stock seja o valor correto
              };
              console.log('📝 [Manager] Atualizando produto no estado com dados do backend:', {
                beforeStock: p.stock,
                afterStock: newProduct.stock,
                stockFromResponse: updatedProduct?.stock,
                stockFromUpdateData: updateData.stock,
                finalStock: finalStock,
                productId: p.id,
                productName: p.name
              });
              return newProduct;
            }
            return p;
          });
          return updated;
        });
        setFilteredProducts(prevFiltered => {
          const updated = prevFiltered.map(p => {
            if (p.id === editedProduct.id) {
              return { 
                ...p, 
                ...updatedProduct,
                stock: finalStock // Garantir que o stock seja o valor correto
              };
            }
            return p;
          });
          return updated;
        });
        
        toast.success('Produto atualizado com sucesso!');
        
        // Não recarregar imediatamente - usar os dados retornados da atualização
        // O recarregamento será feito quando o usuário recarregar a página ou navegar
        // Isso evita sobrescrever o estado com dados antigos
      } else {
        // Para criação de produto, recarregar normalmente
        await loadProducts();
      }

      handleCloseModal();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = await showConfirm(`Tem certeza que deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) {
      return;
    }

    try {
      setIsLoading(true);
      await managerAPI.deleteStoreProduct(product.id);
      toast.success('Produto excluído com sucesso!');
      await loadProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagesChange = (files: File[]) => {
    setUploadedImages(files);
  };

  const handleRemoveExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(img => img !== url));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para verificar se um produto está em oferta relâmpago ativa
  const isFlashSaleActive = (product: Product): boolean => {
    if (!product.isFlashSale || !product.flashSaleStartDate || !product.flashSaleEndDate) {
      return false;
    }
    const now = new Date();
    const start = new Date(product.flashSaleStartDate);
    const end = new Date(product.flashSaleEndDate);
    return now >= start && now <= end;
  };

  // Função para verificar se um produto está em oferta normal ativa
  const isNormalSaleActive = (product: Product): boolean => {
    if (!product.isOnSale || !product.saleStartDate || !product.saleEndDate) {
      return false;
    }
    const now = new Date();
    const start = new Date(product.saleStartDate);
    const end = new Date(product.saleEndDate);
    return now >= start && now <= end;
  };

  // Função para filtrar produtos
  const getFilteredProducts = () => {
    let filtered = products;
    
    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro por oferta (se estiver na aba "em oferta")
    if (activeTab === 'on-sale') {
      filtered = filtered.filter(product => 
        isFlashSaleActive(product) || isNormalSaleActive(product)
      );
    }
    
    return filtered;
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;
  const inStockProducts = products.filter(p => p.stock > 10).length;

  // Função para recarregar produtos após atualização
  const onProductsChange = () => {
    loadProducts();
  };

  // Função para renderizar seção de produtos
  const renderProductsSection = (showOnlyOnSale: boolean) => {
    const productsToShow = showOnlyOnSale 
      ? filteredProducts.filter(p => isFlashSaleActive(p) || isNormalSaleActive(p))
      : filteredProducts;

    return (
      <>
        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#3e2626] mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando produtos...</p>
            </div>
          </div>
        ) : productsToShow.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="text-center py-16">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'Tente buscar com outro termo' : showOnlyOnSale ? 'Nenhum produto em oferta no momento' : 'Comece adicionando seu primeiro produto'}
              </p>
              {!searchTerm && !showOnlyOnSale && (
                <Button 
                  onClick={handleCreateProduct}
                  className="bg-gradient-to-r from-[#3e2626] to-[#8B4513] hover:from-[#2a1f1f] hover:to-[#6B3410] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsToShow.map((product) => {
              const isFlashSale = isFlashSaleActive(product);
              const isNormalSale = isNormalSaleActive(product);
              const salePrice = isFlashSale ? (product.flashSalePrice || product.price) : (isNormalSale ? (product.salePrice || product.price) : product.price);
              const originalPrice = product.price;
              
              return (
                <Card key={product.id} className={`overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-2xl group ${isFlashSale ? 'ring-2 ring-yellow-400 ring-opacity-50' : isNormalSale ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}>
                  {(product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : product.imageUrl) ? (
                    <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
                      <img
                        src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {isFlashSale && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                          <Zap className="h-3 w-3" />
                          OFERTA RELÂMPAGO
                        </div>
                      )}
                      {isNormalSale && !isFlashSale && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          EM OFERTA
                        </div>
                      )}
                      {product.imageUrls && product.imageUrls.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
                          +{product.imageUrls.length - 1} mais
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge className={
                          product.stock > 10 
                            ? 'bg-green-500 text-white border-0 shadow-md' 
                            : product.stock > 0 
                            ? 'bg-orange-500 text-white border-0 shadow-md' 
                            : 'bg-red-500 text-white border-0 shadow-md'
                        }>
                          {product.stock > 10 ? 'OK' : product.stock > 0 ? 'BAIXO' : 'ZERO'}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                      <Package className="h-16 w-16 text-gray-300" />
                      {isFlashSale && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                          <Zap className="h-3 w-3" />
                          OFERTA RELÂMPAGO
                        </div>
                      )}
                      {isNormalSale && !isFlashSale && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          EM OFERTA
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge className={
                          product.stock > 10 
                            ? 'bg-green-500 text-white border-0 shadow-md' 
                            : product.stock > 0 
                            ? 'bg-orange-500 text-white border-0 shadow-md' 
                            : 'bg-red-500 text-white border-0 shadow-md'
                        }>
                          {product.stock > 10 ? 'OK' : product.stock > 0 ? 'BAIXO' : 'ZERO'}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 min-h-[3.5rem]">
                      {product.name}
                    </CardTitle>
                    {product.description && (
                      <CardDescription className="line-clamp-2 text-sm text-gray-600 min-h-[2.5rem]">
                        {product.description}
                      </CardDescription>
                    )}
                    {(isFlashSale || isNormalSale) && (
                      <div className="flex items-center gap-2 mt-2">
                        {isFlashSale && product.flashSaleDiscountPercent && (
                          <Badge className="bg-red-500 text-white border-0 shadow-md">
                            -{product.flashSaleDiscountPercent}%
                          </Badge>
                        )}
                        {isNormalSale && product.saleDiscountPercent && (
                          <Badge className="bg-blue-500 text-white border-0 shadow-md">
                            -{product.saleDiscountPercent}%
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Preço</span>
                      {isFlashSale || isNormalSale ? (
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-xl text-green-600">{formatCurrency(salePrice)}</span>
                          <span className="text-sm text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-xl text-[#3e2626]">{formatCurrency(originalPrice)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Estoque</span>
                      <span className="font-semibold text-gray-900">{product.stock} unidades</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewProduct(product)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 flex-1 transition-all"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white transition-all font-medium"
                      >
                        <Edit className="h-4 w-4 mr-1.5" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product)}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com busca e botão */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#3e2626]">Gestão de Estoque</h2>
          <p className="text-gray-600 mt-1">Gerencie os produtos e estoque da sua loja</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          {!showFlashSalePanel && (
            <>
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
                Oferta Relâmpago
              </Button>
              <Button 
                onClick={handleCreateProduct}
                className="bg-[#3e2626] hover:bg-[#2a1f1f] text-white shadow-lg font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Renderização condicional: Painel de Oferta Relâmpago ou conteúdo normal */}
      {showFlashSalePanel ? (
        <div className="px-6 pb-6">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Ofertas da sua loja:</strong> Você só pode configurar ofertas relâmpago para produtos da sua loja ({user?.store?.name || 'sua loja'}).
            </p>
          </div>
          <FlashSalePanel
            products={products}
            onProductUpdated={onProductsChange}
            onClose={() => setShowFlashSalePanel(false)}
            token={token || ''}
          />
        </div>
      ) : (
        <>
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
              {renderProductsSection(false)}
            </TabsContent>

            <TabsContent value="on-sale" className="mt-0">
              {renderProductsSection(true)}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modal de Produto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-[#3e2626] text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {productModalMode === 'create' ? 'Novo Produto' : productModalMode === 'view' ? 'Visualizar Produto' : 'Editar Produto'}
                    </h2>
                    <p className="text-sm text-white/90 mt-0.5">
                      {productModalMode === 'view' ? 'Visualização dos detalhes do produto' : 'Preencha as informações do produto'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {productModalMode === 'view' && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (selectedProduct) handleEditProduct(selectedProduct);
                      }}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                  {productModalMode !== 'view' && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={handleCloseModal} 
                        disabled={isLoading}
                        className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSaveProduct} 
                        disabled={isLoading}
                        className="bg-white text-[#3e2626] hover:bg-white/90 border border-white/30 shadow-lg font-semibold"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCloseModal}
                    className="text-white hover:bg-white/20 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)] bg-gradient-to-br from-gray-50 to-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Section */}
                <div className="space-y-4">
                  {(existingImages.length > 0 || uploadedImages.length > 0) && productModalMode === 'view' ? (
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl relative overflow-hidden group shadow-xl border border-gray-200">
                      {existingImages.length > 0 || uploadedImages.length > 0 ? (
                        <img
                          src={existingImages.length > 0 
                            ? existingImages[currentImageIndex] 
                            : URL.createObjectURL(uploadedImages[currentImageIndex])
                          }
                          alt={editedProduct?.name || 'Produto'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-20 w-20 text-gray-300" />
                        </div>
                      )}
                      
                      {(existingImages.length > 1 || uploadedImages.length > 1) && (
                        <>
                          <button
                            onClick={() => setCurrentImageIndex((prev) => prev === 0 ? (existingImages.length || uploadedImages.length) - 1 : prev - 1)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setCurrentImageIndex((prev) => (prev + 1) % (existingImages.length || uploadedImages.length))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      
                      {(existingImages.length > 1 || uploadedImages.length > 1) && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          {(existingImages.length > 0 ? existingImages : uploadedImages).map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2.5 h-2.5 rounded-full transition-all ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      
                      {(existingImages.length > 1 || uploadedImages.length > 1) && (
                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full font-medium shadow-lg">
                          {currentImageIndex + 1} / {existingImages.length || uploadedImages.length}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 shadow-lg">
                        {existingImages.length > 0 || uploadedImages.length > 0 ? (
                          <img
                            src={existingImages.length > 0 
                              ? existingImages[0] 
                              : URL.createObjectURL(uploadedImages[0])
                            }
                            alt={editedProduct?.name || 'Produto'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <Package className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Nenhuma imagem</p>
                          </div>
                        )}
                      </div>
                      
                      <ImageUpload
                        images={uploadedImages}
                        onImagesChange={handleImagesChange}
                        maxImages={5}
                        existingImages={existingImages}
                        onRemoveExisting={handleRemoveExistingImage}
                      />
                    </>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <Card className="border border-gray-200 shadow-md rounded-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 pb-4">
                      <CardTitle className="text-base font-bold flex items-center text-gray-900">
                        <div className="w-8 h-8 bg-[#3e2626] rounded-lg flex items-center justify-center mr-3">
                          <Tag className="h-4 w-4 text-white" />
                        </div>
                        Informações Básicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 p-6 bg-white">
                      <div>
                        <Label htmlFor="modal-name" className="text-sm font-semibold text-gray-700 mb-2 block">
                          Nome do Produto *
                        </Label>
                        <Input
                          id="modal-name"
                          value={editedProduct?.name || ''}
                          onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, name: e.target.value } : null)}
                          placeholder="Nome do produto"
                          className="mt-1.5 border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513]"
                          disabled={productModalMode === 'view'}
                        />
                      </div>

                      <div>
                        <Label htmlFor="modal-description" className="text-sm font-semibold text-gray-700 mb-2 block">
                          Descrição
                        </Label>
                        <textarea
                          id="modal-description"
                          value={editedProduct?.description || ''}
                          onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, description: e.target.value } : null)}
                          placeholder="Descrição do produto"
                          className="mt-1.5 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] resize-none transition-all"
                          rows={4}
                          disabled={productModalMode === 'view'}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="modal-category" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Categoria *
                          </Label>
                          <select
                            id="modal-category"
                            value={editedProduct?.category || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, category: e.target.value } : null)}
                            className="w-full mt-1.5 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white transition-all"
                            disabled={productModalMode === 'view'}
                          >
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

                        <div>
                          <Label htmlFor="modal-brand" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Marca
                          </Label>
                          <Input
                            id="modal-brand"
                            value={editedProduct?.brand || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, brand: e.target.value } : null)}
                            placeholder="Marca"
                            className="mt-1.5 border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513]"
                            disabled={productModalMode === 'view'}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="modal-sku" className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                          <Hash className="h-4 w-4 mr-1.5" />
                          SKU
                        </Label>
                        <Input
                          id="modal-sku"
                          value={editedProduct?.sku || ''}
                          onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, sku: e.target.value } : null)}
                          placeholder="Código SKU"
                          className="mt-1.5 border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513]"
                          disabled={productModalMode === 'view'}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preço e Estoque */}
                  <Card className="border border-gray-200 shadow-md rounded-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 pb-4">
                      <CardTitle className="text-base font-bold flex items-center text-gray-900">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        Preço e Estoque
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 p-6 bg-white">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="modal-price" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Preço *
                          </Label>
                          <div className="relative mt-1.5">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">R$</span>
                            <Input
                              id="modal-price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={editedProduct?.price || 0}
                              onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                              placeholder="0.00"
                              className="pl-12 border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513] text-lg font-semibold"
                              disabled={productModalMode === 'view'}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="modal-stock" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Estoque *
                          </Label>
                          <Input
                            id="modal-stock"
                            type="number"
                            min="0"
                            value={editedProduct?.stock || 0}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null)}
                            placeholder="0"
                            className="mt-1.5 border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513] text-lg font-semibold"
                            disabled={productModalMode === 'view'}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ofertas e Promoções */}
                  <Card className="border-2 border-blue-100 shadow-md rounded-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 pb-4">
                      <CardTitle className="text-base font-bold flex items-center text-gray-900">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                          <Percent className="h-4 w-4 text-white" />
                        </div>
                        Ofertas e Promoções
                      </CardTitle>
                      <CardDescription className="text-blue-700 mt-2">
                        Configure ofertas normais para este produto aparecer na loja
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 p-6 bg-white">
                      {/* Oferta Normal */}
                      <div className="border-2 border-green-200 rounded-xl p-5 space-y-4 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Tag className="h-5 w-5 text-green-600" />
                            <Label className="text-base font-bold text-gray-900">
                              Oferta Normal
                            </Label>
                          </div>
                          {productModalMode !== 'view' ? (
                            <label className="flex items-center cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={editedProduct?.isOnSale || false}
                                onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, isOnSale: e.target.checked } : null)}
                                className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                              />
                              <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                                {editedProduct?.isOnSale ? 'Ativa' : 'Ativar Oferta'}
                              </span>
                            </label>
                          ) : (
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                              selectedProduct?.isOnSale ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {selectedProduct?.isOnSale ? '✓ Ativa' : 'Inativa'}
                            </span>
                          )}
                        </div>

                        {((productModalMode !== 'view' && editedProduct?.isOnSale) || (productModalMode === 'view' && selectedProduct?.isOnSale)) && (
                          <div className="space-y-5">
                            <div>
                              <Label htmlFor="modal-saleDiscountPercent" className="text-sm font-semibold text-gray-700 mb-2 block">
                                Desconto (%)
                              </Label>
                              {productModalMode !== 'view' ? (
                                <div className="relative mt-1.5">
                                  <Input
                                    id="modal-saleDiscountPercent"
                                    type="number"
                                    step="1"
                                    min="1"
                                    max="99"
                                    value={editedProduct?.saleDiscountPercent ?? ''}
                                    onChange={(e) => {
                                      const percent = parseInt(e.target.value) || undefined;
                                      setEditedProduct((prev: any) => {
                                        if (!prev) return null;
                                        const newProduct = { ...prev, saleDiscountPercent: percent };
                                        // Calcular preço de oferta baseado no percentual
                                        if (percent && prev.price) {
                                          const discount = (prev.price * percent) / 100;
                                          newProduct.salePrice = prev.price - discount;
                                        }
                                        return newProduct;
                                      });
                                    }}
                                    placeholder="Ex: 30"
                                    className="pr-12 h-12 text-base font-semibold px-4 bg-gray-50 rounded-md border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513] w-full"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-gray-600 font-semibold pointer-events-none">%</span>
                                </div>
                              ) : (
                                <p className="mt-1.5 text-lg font-semibold text-green-600">
                                  {selectedProduct?.saleDiscountPercent ? `${selectedProduct.saleDiscountPercent}% OFF` : selectedProduct?.salePrice ? `R$ ${selectedProduct.salePrice.toFixed(2)}` : '-'}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="modal-saleStartDate" className="text-sm font-semibold text-gray-700 mb-2 block">
                                Data Início
                              </Label>
                              {productModalMode !== 'view' ? (
                                <Input
                                  id="modal-saleStartDate"
                                  type="date"
                                  value={editedProduct?.saleStartDate 
                                    ? (typeof editedProduct.saleStartDate === 'string' 
                                        ? editedProduct.saleStartDate.slice(0, 10)
                                        : new Date(editedProduct.saleStartDate).toISOString().slice(0, 10))
                                    : ''}
                                  onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, saleStartDate: e.target.value ? `${e.target.value}T00:00:00` : '' } : null)}
                                  className="mt-1.5 h-12 text-base bg-gray-50 rounded-md border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513] w-full"
                                />
                              ) : (
                                <div className="mt-1.5">
                                  {selectedProduct?.saleStartDate ? (
                                    <p className="text-gray-900 font-medium">
                                      {new Date(selectedProduct.saleStartDate).toLocaleDateString('pt-BR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric' 
                                      })}
                                    </p>
                                  ) : (
                                    <p className="text-gray-400 italic">Não definida</p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="modal-saleEndDate" className="text-sm font-semibold text-gray-700 mb-2 block">
                                Data Fim
                              </Label>
                              {productModalMode !== 'view' ? (
                                <Input
                                  id="modal-saleEndDate"
                                  type="date"
                                  value={editedProduct?.saleEndDate 
                                    ? (typeof editedProduct.saleEndDate === 'string' 
                                        ? editedProduct.saleEndDate.slice(0, 10)
                                        : new Date(editedProduct.saleEndDate).toISOString().slice(0, 10))
                                    : ''}
                                  onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, saleEndDate: e.target.value ? `${e.target.value}T23:59:59` : '' } : null)}
                                  className="mt-1.5 h-12 text-base bg-gray-50 rounded-md border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513] w-full"
                                />
                              ) : (
                                <div className="mt-1.5">
                                  {selectedProduct?.saleEndDate ? (
                                    <p className="text-gray-900 font-medium">
                                      {new Date(selectedProduct.saleEndDate).toLocaleDateString('pt-BR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric' 
                                      })}
                                    </p>
                                  ) : (
                                    <p className="text-gray-400 italic">Não definida</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Especificações Adicionais */}
                  <Card className="border border-gray-200 shadow-md rounded-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 pb-4">
                      <CardTitle className="text-base font-bold flex items-center text-gray-900">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                          <Hash className="h-4 w-4 text-white" />
                        </div>
                        Especificações Adicionais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 p-6 bg-white">
                      <div>
                        <Label htmlFor="modal-colorName" className="text-sm font-semibold text-gray-700 mb-2 block">
                          Nome da Cor
                        </Label>
                        <Input
                          id="modal-colorName"
                          value={editedProduct?.colorName || ''}
                          onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, colorName: e.target.value } : null)}
                          placeholder="Nome da cor"
                          className="mt-1.5 border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513]"
                          disabled={productModalMode === 'view'}
                        />
                      </div>

                      <div>
                        <Label htmlFor="modal-supplierId" className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">
                          <Building className="h-4 w-4 mr-1.5" />
                          Fornecedor
                        </Label>
                        <Input
                          id="modal-supplierId"
                          value={editedProduct?.supplierId || ''}
                          onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, supplierId: e.target.value } : null)}
                          placeholder="ID do fornecedor"
                          className="mt-1.5 border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513]"
                          disabled={productModalMode === 'view'}
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Dimensões (cm)</Label>
                        <div className="grid grid-cols-3 gap-3 mt-1.5">
                          <Input
                            id="modal-width"
                            value={editedProduct?.width || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, width: e.target.value } : null)}
                            placeholder="Largura"
                            className="border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513]"
                            disabled={productModalMode === 'view'}
                          />
                          <Input
                            id="modal-height"
                            value={editedProduct?.height || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, height: e.target.value } : null)}
                            placeholder="Altura"
                            className="border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513]"
                            disabled={productModalMode === 'view'}
                          />
                          <Input
                            id="modal-depth"
                            value={editedProduct?.depth || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, depth: e.target.value } : null)}
                            placeholder="Profundidade"
                            className="border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513]"
                            disabled={productModalMode === 'view'}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="modal-weight" className="text-sm font-semibold text-gray-700 mb-2 block">
                          Peso
                        </Label>
                        <div className="relative mt-1.5">
                          <Input
                            id="modal-weight"
                            type="number"
                            step="0.01"
                            min="0"
                            value={editedProduct?.weight || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, weight: parseFloat(e.target.value) || 0 } : null)}
                            placeholder="Ex: 25.5"
                            className="pr-12 border-gray-300 focus:border-[#8B4513] focus:ring-[#8B4513]"
                            disabled={productModalMode === 'view'}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium text-sm">kg</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

