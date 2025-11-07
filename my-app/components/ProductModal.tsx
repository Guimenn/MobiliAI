'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/store';
import { productsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Eye, Edit, Save, DollarSign, Package, Tag, Hash, Palette, Building, Ruler, Weight, Brush } from 'lucide-react';
import { toast } from 'sonner';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  mode: 'view' | 'edit';
  onClose: () => void;
  onProductUpdated: (product: Product) => void;
}

type ProductCategory = 'SOFA' | 'MESA' | 'CADEIRA' | 'ARMARIO' | 'CAMA' | 'DECORACAO' | 'ILUMINACAO' | 'MESA_CENTRO';

export default function ProductModal({ product, isOpen, mode, onClose, onProductUpdated }: ProductModalProps) {
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setEditedProduct({ ...product });
    }
  }, [product]);

  useEffect(() => {
    setIsEditing(mode === 'edit');
  }, [mode]);

  const categories: { value: ProductCategory; label: string }[] = [
    { value: 'SOFA', label: 'Sofás' },
    { value: 'MESA', label: 'Mesas' },
    { value: 'CADEIRA', label: 'Cadeiras' },
    { value: 'ARMARIO', label: 'Armários' },
    { value: 'CAMA', label: 'Camas' },
    { value: 'DECORACAO', label: 'Decoração' },
    { value: 'ILUMINACAO', label: 'Iluminação' },
    { value: 'MESA_CENTRO', label: 'Mesa de centro' },
  ];

  const handleSave = async () => {
    if (!editedProduct) return;

    try {
      setIsLoading(true);
      
      const updatedProduct = await productsAPI.update(editedProduct.id, {
        name: editedProduct.name,
        description: editedProduct.description,
        category: editedProduct.category,
        price: editedProduct.price,
        stock: editedProduct.stock,
        color: editedProduct.color,
        material: editedProduct.material,
        brand: editedProduct.brand,
        dimensions: editedProduct.dimensions,
        weight: editedProduct.weight,
        style: editedProduct.style,
        imageUrl: editedProduct.imageUrl,
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

  const handleCancel = () => {
    if (product) {
      setEditedProduct({ ...product });
    }
    setIsEditing(false);
  };

  if (!isOpen || !product) return null;

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
                <Button onClick={handleSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            )}
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
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
                {editedProduct?.imageUrl ? (
                  <img
                    src={editedProduct.imageUrl}
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
                    URL da Imagem
                  </Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={editedProduct?.imageUrl || ''}
                    onChange={(e) => setEditedProduct(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
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
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, category: e.target.value as ProductCategory } : null)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-gray-900">{categories.find(c => c.value === product.category)?.label || product.category}</p>
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
                      <p className="mt-1 text-2xl font-bold text-green-600">
                        R$ {Number(product.price).toFixed(2)}
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
                </CardContent>
              </Card>

              {/* Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Hash className="h-5 w-5 mr-2" />
                    Especificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="color" className="text-sm font-medium text-gray-700">
                      Cor
                    </Label>
                    {isEditing ? (
                      <Input
                        id="color"
                        value={editedProduct?.color || ''}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, color: e.target.value } : null)}
                        placeholder="Cor do produto"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product.color || 'Não especificado'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="material" className="text-sm font-medium text-gray-700">
                      Material
                    </Label>
                    {isEditing ? (
                      <Input
                        id="material"
                        value={editedProduct?.material || ''}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, material: e.target.value } : null)}
                        placeholder="Material do produto"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product.material || 'Não especificado'}</p>
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

                  <div>
                    <Label htmlFor="style" className="text-sm font-medium text-gray-700">
                      Estilo
                    </Label>
                    {isEditing ? (
                      <Input
                        id="style"
                        value={editedProduct?.style || ''}
                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, style: e.target.value } : null)}
                        placeholder="Ex: Moderno, Clássico, Vintage"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-gray-600">{product.style || 'Não especificado'}</p>
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
