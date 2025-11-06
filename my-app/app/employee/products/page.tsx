'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { productsAPI } from '@/lib/api';
import { useProductsHeader } from '@/components/products-header-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ImageUpload';
import { uploadMultipleProductImages } from '@/lib/supabase';
import { toast } from 'sonner';
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
  Eye
} from 'lucide-react';

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
}

export default function EmployeeProductsPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const { searchTerm, setSearchTerm, viewMode, setViewMode, setOnCreateProduct } = useProductsHeader();
  const [isLoading, setIsLoading] = useState(false);
  
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
      isActive: true
    });
    setExistingImages([]);
    setUploadedImages([]);
    setProductModalMode('create');
    setIsProductModalOpen(true);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Atualizar o handler quando handleCreateProduct mudar
  useEffect(() => {
    setOnCreateProduct(handleCreateProduct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    if (!user?.storeId) {
      console.warn('⚠️ Usuário não tem storeId associado:', user);
      return;
    }
    
    console.log('📦 Carregando produtos para a filial:', user.storeId, user.store?.name);
    
    try {
      setIsLoading(true);
      const productsData = await productsAPI.getAll(user.storeId);
      console.log('✅ Produtos carregados:', productsData.length);
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditedProduct({ ...product });
    // Usar imageUrls se disponível, senão usar imageUrl
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
    setEditedProduct({ ...product });
    // Usar imageUrls se disponível, senão usar imageUrl
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
      console.error('❌ Erro: usuário não tem storeId:', { user, editedProduct });
      toast.error('Erro ao criar produto', {
        description: 'Você não está associado a nenhuma filial',
      });
      return;
    }

    console.log('📝 Criando produto para a filial:', user.storeId, user.store?.name);

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

        console.log('📦 Dados do produto sendo criado:', productData);

        // Adicionar campos opcionais
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

        await productsAPI.create(productData);
        toast.success('Produto criado com sucesso!');
      } else if (productModalMode === 'edit') {
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

        // Adicionar campos opcionais
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

        await productsAPI.update(editedProduct.id, updateData);
        toast.success('Produto atualizado com sucesso!');
      }

      await loadProducts();
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
    if (!confirm(`Tem certeza que deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setIsLoading(true);
      await productsAPI.delete(product.id);
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

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;
  const inStockProducts = products.filter(p => p.stock > 10).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-gray-500">produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Em Estoque</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inStockProducts}</div>
            <p className="text-xs text-gray-500">estoque adequado</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Estoque Baixo</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts}</div>
            <p className="text-xs text-gray-500">precisa reposição</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sem Estoque</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockProducts}</div>
            <p className="text-xs text-gray-500">fora de estoque</p>
          </CardContent>
        </Card>
      </div>

      {/* Botão Novo Produto */}
      <div className="flex justify-start mb-6">
        <Button 
          onClick={handleCreateProduct}
          className="bg-[#3e2626] hover:bg-[#2a1f1f] text-white shadow-lg font-semibold px-6 py-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#3e2626] mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando produtos...</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-600 mb-6">Comece adicionando seu primeiro produto</p>
            <Button 
              onClick={handleCreateProduct}
              className="bg-gradient-to-r from-[#3e2626] to-[#8B4513] hover:from-[#2a1f1f] hover:to-[#6B3410] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-2xl group">
              {(product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : product.imageUrl) ? (
                <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  <img
                    src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
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
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Preço</span>
                  <span className="font-bold text-xl text-[#3e2626]">{formatCurrency(product.price)}</span>
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
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 rounded-xl group">
              <div className="flex flex-col sm:flex-row">
                {/* Imagem */}
                <div className="w-full sm:w-48 h-48 flex-shrink-0 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  {(product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : product.imageUrl) ? (
                    <>
                      <img
                        src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {product.imageUrls && product.imageUrls.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
                          +{product.imageUrls.length - 1} mais
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
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

                {/* Conteúdo */}
                <div className="flex-1 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      {product.name}
                    </CardTitle>
                    {product.description && (
                      <CardDescription className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </CardDescription>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Preço:</span>
                        <span className="font-bold text-lg text-[#3e2626]">{formatCurrency(product.price)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Estoque:</span>
                        <span className="font-semibold text-gray-900">{product.stock} unidades</span>
                      </div>
                      {product.brand && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">Marca:</span>
                          <span className="text-sm text-gray-900">{product.brand}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2 sm:flex-col">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewProduct(product)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditProduct(product)}
                      className="border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white transition-all font-medium"
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
                </div>
              </div>
            </Card>
          ))}
        </div>
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
                    // Carrossel para visualização
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
                      
                      {/* Botões de navegação */}
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
                      
                      {/* Indicadores */}
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
                      
                      {/* Contador */}
                      {(existingImages.length > 1 || uploadedImages.length > 1) && (
                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full font-medium shadow-lg">
                          {currentImageIndex + 1} / {existingImages.length || uploadedImages.length}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Upload/Edição de imagens
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
                            <option value="OUTROS">Outros</option>
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
