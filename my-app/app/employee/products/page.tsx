'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { productsAPI } from '@/lib/api';
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
  Search,
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
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    loadProducts();
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

      {/* Header with Search and Actions */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Produtos</CardTitle>
              <CardDescription>Gerencie o catálogo de produtos</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-10"
                />
              </div>
              <Button 
                onClick={handleCreateProduct}
                className="bg-gradient-to-r from-[#3e2626] to-[#8B4513] hover:from-[#2a1f1f] hover:to-[#6B3410] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {(product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : product.imageUrl) && (
                <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
                  <img
                    src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  {product.imageUrls && product.imageUrls.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      +{product.imageUrls.length - 1} mais
                    </div>
                  )}
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg font-bold line-clamp-1">{product.name}</CardTitle>
                  <Badge className={
                    product.stock > 10 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : product.stock > 0 
                      ? 'bg-orange-100 text-orange-800 border-orange-200' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  }>
                    {product.stock > 10 ? 'OK' : product.stock > 0 ? 'BAIXO' : 'ZERO'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-1">{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Preço:</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(product.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Estoque:</span>
                  <span className="font-semibold text-gray-900">{product.stock} un.</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewProduct(product)}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditProduct(product)}
                    className="flex-1 border-gray-300 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteProduct(product)}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Produto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#3e2626] to-[#8B4513] rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {productModalMode === 'create' ? 'Novo Produto' : productModalMode === 'view' ? 'Visualizar Produto' : 'Editar Produto'}
                  </h2>
                  <p className="text-sm text-gray-600">
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
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
                {productModalMode !== 'view' && (
                  <>
                    <Button variant="outline" onClick={handleCloseModal} disabled={isLoading} size="sm">
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveProduct} disabled={isLoading} className="bg-gradient-to-r from-[#3e2626] to-[#8B4513] hover:from-[#2a1f1f] hover:to-[#6B3410] text-white">
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Section */}
                <div className="space-y-4">
                  {(existingImages.length > 0 || uploadedImages.length > 0) && productModalMode === 'view' ? (
                    // Carrossel para visualização
                    <div className="aspect-square bg-gray-100 rounded-xl relative overflow-hidden group">
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
                        <Package className="h-16 w-16 text-gray-300" />
                      )}
                      
                      {/* Botões de navegação */}
                      {(existingImages.length > 1 || uploadedImages.length > 1) && (
                        <>
                          <button
                            onClick={() => setCurrentImageIndex((prev) => prev === 0 ? (existingImages.length || uploadedImages.length) - 1 : prev - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setCurrentImageIndex((prev) => (prev + 1) % (existingImages.length || uploadedImages.length))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      
                      {/* Indicadores */}
                      {(existingImages.length > 1 || uploadedImages.length > 1) && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
                          {(existingImages.length > 0 ? existingImages : uploadedImages).map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Contador */}
                      {(existingImages.length > 1 || uploadedImages.length > 1) && (
                        <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          {currentImageIndex + 1} / {existingImages.length || uploadedImages.length}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Upload/Edição de imagens
                    <>
                      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
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
                          <Package className="h-16 w-16 text-gray-300" />
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
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        Informações Básicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="modal-name" className="text-sm font-medium">
                          Nome do Produto *
                        </Label>
                        <Input
                          id="modal-name"
                          value={editedProduct?.name || ''}
                          onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, name: e.target.value } : null)}
                          placeholder="Nome do produto"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="modal-description" className="text-sm font-medium">
                          Descrição
                        </Label>
                        <textarea
                          id="modal-description"
                          value={editedProduct?.description || ''}
                          onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, description: e.target.value } : null)}
                          placeholder="Descrição do produto"
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="modal-category" className="text-sm font-medium">
                            Categoria *
                          </Label>
                          <select
                            id="modal-category"
                            value={editedProduct?.category || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, category: e.target.value } : null)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent"
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
                          <Label htmlFor="modal-brand" className="text-sm font-medium">
                            Marca
                          </Label>
                          <Input
                            id="modal-brand"
                            value={editedProduct?.brand || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, brand: e.target.value } : null)}
                            placeholder="Marca"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="modal-sku" className="text-sm font-medium flex items-center">
                          <Hash className="h-3 w-3 mr-1" />
                          SKU
                        </Label>
                        <Input
                          id="modal-sku"
                          value={editedProduct?.sku || ''}
                          onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, sku: e.target.value } : null)}
                          placeholder="Código SKU"
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preço e Estoque */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Preço e Estoque
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="modal-price" className="text-sm font-medium">
                            Preço *
                          </Label>
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                            <Input
                              id="modal-price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={editedProduct?.price || 0}
                              onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                              placeholder="0.00"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="modal-stock" className="text-sm font-medium">
                            Estoque *
                          </Label>
                          <Input
                            id="modal-stock"
                            type="number"
                            min="0"
                            value={editedProduct?.stock || 0}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null)}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Especificações Adicionais */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Hash className="h-4 w-4 mr-2" />
                        Especificações Adicionais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="modal-colorName" className="text-sm font-medium">
                          Nome da Cor
                        </Label>
                        <Input
                          id="modal-colorName"
                          value={editedProduct?.colorName || ''}
                          onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, colorName: e.target.value } : null)}
                          placeholder="Nome da cor"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="modal-supplierId" className="text-sm font-medium flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          Fornecedor
                        </Label>
                        <Input
                          id="modal-supplierId"
                          value={editedProduct?.supplierId || ''}
                          onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, supplierId: e.target.value } : null)}
                          placeholder="ID do fornecedor"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Dimensões</Label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <Input
                            id="modal-width"
                            value={editedProduct?.width || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, width: e.target.value } : null)}
                            placeholder="Largura (cm)"
                            className="text-sm"
                          />
                          <Input
                            id="modal-height"
                            value={editedProduct?.height || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, height: e.target.value } : null)}
                            placeholder="Altura (cm)"
                            className="text-sm"
                          />
                          <Input
                            id="modal-depth"
                            value={editedProduct?.depth || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, depth: e.target.value } : null)}
                            placeholder="Profundidade (cm)"
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="modal-weight" className="text-sm font-medium">
                          Peso
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            id="modal-weight"
                            type="number"
                            step="0.01"
                            min="0"
                            value={editedProduct?.weight || ''}
                            onChange={(e) => setEditedProduct((prev: any) => prev ? { ...prev, weight: parseFloat(e.target.value) || 0 } : null)}
                            placeholder="Ex: 25.5"
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">kg</span>
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
