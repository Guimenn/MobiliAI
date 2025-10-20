'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Eye, Edit, Save, DollarSign, Package, Tag, Hash, Palette, Building, Ruler, Weight, Brush, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminProductModalProps {
  product: any | null;
  isOpen: boolean;
  mode: 'view' | 'edit';
  onClose: () => void;
  onProductUpdated: (product: any) => void;
  onProductDeleted: (productId: string) => void;
}

export default function AdminProductModal({ product, isOpen, mode, onClose, onProductUpdated, onProductDeleted }: AdminProductModalProps) {
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [editedProduct, setEditedProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setEditedProduct({ ...product });
    }
  }, [product]);

  useEffect(() => {
    setIsEditing(mode === 'edit');
  }, [mode]);

  const categories = [
    { value: 'Tintas', label: 'Tintas' },
    { value: 'Pincéis', label: 'Pincéis' },
    { value: 'Rolos', label: 'Rolos' },
    { value: 'Acessórios', label: 'Acessórios' },
    { value: 'Ferramentas', label: 'Ferramentas' },
    { value: 'Outros', label: 'Outros' },
  ];

  const handleSave = async () => {
    if (!editedProduct) return;

    try {
      setIsLoading(true);
      
      const updatedProduct = await adminAPI.updateProduct(editedProduct.id, {
        name: editedProduct.name,
        description: editedProduct.description,
        category: editedProduct.category,
        price: editedProduct.price,
        stock: editedProduct.stock,
        sku: editedProduct.sku,
        isActive: editedProduct.isActive,
        colorName: editedProduct.colorName,
        colorHex: editedProduct.colorHex,
        brand: editedProduct.brand,
        supplier: editedProduct.supplier,
        dimensions: editedProduct.dimensions,
        weight: editedProduct.weight,
        style: editedProduct.style,
        imageUrls: editedProduct.imageUrls || [],
      });

      onProductUpdated(updatedProduct);
      setIsEditing(false);
      toast.success('Produto atualizado com sucesso!', {
        description: `${editedProduct.name} foi atualizado.`,
        duration: 4000,
      });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto', {
        description: 'Tente novamente mais tarde.',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    if (!confirm(`Tem certeza que deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setIsLoading(true);
      await adminAPI.deleteProduct(product.id);
      onProductDeleted(product.id);
      onClose();
      toast.success('Produto excluído com sucesso!', {
        description: `${product.name} foi removido do catálogo.`,
        duration: 4000,
      });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto', {
        description: 'Tente novamente mais tarde.',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (product) {
      setEditedProduct({ ...product });
    }
    setIsEditing(false);
  };

  if (!isOpen || !product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <Edit className="h-6 w-6 text-blue-600" />
            ) : (
              <Eye className="h-6 w-6 text-green-600" />
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Produto' : 'Visualizar Produto'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing && (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isLoading} className="bg-[#3e2626] hover:bg-[#8B4513]">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            )}
            {!isEditing && (
              <>
                <Button onClick={() => setIsEditing(true)} className="bg-[#3e2626] hover:bg-[#8B4513]">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDelete} 
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isLoading ? 'Excluindo...' : 'Excluir'}
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                {editedProduct?.imageUrls && editedProduct.imageUrls.length > 0 ? (
                  <img
                    src={editedProduct.imageUrls[0]}
                    alt={editedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div>
                  <Label htmlFor="imageUrl" className="text-sm font-medium text-gray-700">
                    URL da Imagem Principal
                  </Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={editedProduct?.imageUrls?.[0] || ''}
                    onChange={(e) => setEditedProduct(prev => prev ? { 
                      ...prev, 
                      imageUrls: [e.target.value, ...(prev.imageUrls?.slice(1) || [])]
                    } : null)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Tag className="h-5 w-5 mr-2" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nome do Produto *
                    </Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editedProduct?.name || ''}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder="Nome do produto"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-lg font-semibold text-gray-900">{product.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Descrição
                    </Label>
                    {isEditing ? (
                      <textarea
                        id="description"
                        value={editedProduct?.description || ''}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="Descrição do produto"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent resize-none"
                        rows={3}
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product.description || 'Sem descrição'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                      Categoria *
                    </Label>
                    {isEditing ? (
                      <select
                        id="category"
                        value={editedProduct?.category || ''}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, category: e.target.value } : null)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent"
                      >
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-gray-900">{product.category}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="sku" className="text-sm font-medium text-gray-700">
                      SKU
                    </Label>
                    {isEditing ? (
                      <Input
                        id="sku"
                        value={editedProduct?.sku || ''}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, sku: e.target.value } : null)}
                        placeholder="Código SKU"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product.sku || 'Sem SKU'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="brand" className="text-sm font-medium text-gray-700">
                      Marca
                    </Label>
                    {isEditing ? (
                      <Input
                        id="brand"
                        value={editedProduct?.brand || ''}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, brand: e.target.value } : null)}
                        placeholder="Marca do produto"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product.brand || 'Sem marca'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing and Stock */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Preço e Estoque
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                      Preço *
                    </Label>
                    {isEditing ? (
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={editedProduct?.price || 0}
                          onChange={(e) => setEditedProduct(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                          placeholder="0.00"
                          className="pl-10"
                        />
                      </div>
                    ) : (
                      <p className="mt-1 text-2xl font-bold text-[#3e2626]">
                        {formatPrice(product.price)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="stock" className="text-sm font-medium text-gray-700">
                      Estoque
                    </Label>
                    {isEditing ? (
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={editedProduct?.stock || 0}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null)}
                        placeholder="0"
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          product.stock > 10 
                            ? 'bg-green-100 text-green-800' 
                            : product.stock > 0 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock} unidades
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Status
                    </Label>
                    {isEditing ? (
                      <div className="mt-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editedProduct?.isActive || false}
                            onChange={(e) => setEditedProduct(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Produto Ativo</span>
                        </label>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Hash className="h-5 w-5 mr-2" />
                    Especificações Adicionais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="colorName" className="text-sm font-medium text-gray-700">
                      Nome da Cor
                    </Label>
                    {isEditing ? (
                      <Input
                        id="colorName"
                        value={editedProduct?.colorName || ''}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, colorName: e.target.value } : null)}
                        placeholder="Nome da cor"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product.colorName || 'Não especificado'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="supplier" className="text-sm font-medium text-gray-700">
                      Fornecedor
                    </Label>
                    {isEditing ? (
                      <Input
                        id="supplier"
                        value={editedProduct?.supplier || ''}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, supplier: e.target.value } : null)}
                        placeholder="Nome do fornecedor"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product.supplier || 'Não especificado'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="dimensions" className="text-sm font-medium text-gray-700">
                      Dimensões
                    </Label>
                    {isEditing ? (
                      <Input
                        id="dimensions"
                        value={editedProduct?.dimensions || ''}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, dimensions: e.target.value } : null)}
                        placeholder="Ex: 200cm x 100cm x 80cm"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product.dimensions || 'Não especificado'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                      Peso
                    </Label>
                    {isEditing ? (
                      <Input
                        id="weight"
                        value={editedProduct?.weight || ''}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, weight: e.target.value } : null)}
                        placeholder="Ex: 25kg"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product.weight || 'Não especificado'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
