  'use client';

import { useState } from 'react';
import { adminAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Save, Upload, Image, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: any) => void;
}

export default function CreateProductModal({ isOpen, onClose, onProductCreated }: CreateProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    category: 'SOFA',
    price: 0,
    costPrice: 0,
    stock: 0,
    minStock: 0,
    colorName: '',
    colorHex: '',
    brand: '',
    style: 'MODERNO',
    material: 'MADEIRA',
    width: 0,
    height: 0,
    depth: 0,
    weight: 0,
    model: '',
    sku: '',
    barcode: '',
    storeId: '',
    isFeatured: false,
    isNew: false,
    isBestSeller: false,
    isAvailable: true,
    is3D: false
  });

  const categories = [
    { value: 'SOFA', label: 'Sofá' },
    { value: 'MESA', label: 'Mesa' },
    { value: 'CADEIRA', label: 'Cadeira' },
    { value: 'ARMARIO', label: 'Armário' },
    { value: 'ESTANTE', label: 'Estante' },
    { value: 'POLTRONA', label: 'Poltrona' },
    { value: 'QUADRO', label: 'Quadro' },
    { value: 'LUMINARIA', label: 'Luminária' },
    { value: 'MESA_CENTRO', label: 'Mesa de centro' }
  ];

  const styles = [
    { value: 'MODERNO', label: 'Moderno' },
    { value: 'MINIMALISTA', label: 'Minimalista' },
    { value: 'RUSTICO', label: 'Rústico' }
  ];

  const materials = [
    { value: 'MADEIRA', label: 'Madeira' },
    { value: 'METAL', label: 'Metal' },
    { value: 'COURO', label: 'Couro' },
    { value: 'TECIDO', label: 'Tecido' }
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validar tipos de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Tipo de arquivo inválido', {
        description: 'Apenas arquivos JPEG, PNG e WebP são aceitos.',
      });
      return;
    }

    // Validar tamanho (5MB max)
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast.error('Arquivo muito grande', {
        description: 'Cada imagem deve ter no máximo 5MB.',
      });
      return;
    }

    // Limitar a 10 imagens
    const totalImages = selectedImages.length + files.length;
    if (totalImages > 10) {
      toast.error('Muitas imagens', {
        description: 'Máximo de 10 imagens por produto.',
      });
      return;
    }

    // Adicionar arquivos selecionados
    setSelectedImages(prev => [...prev, ...files]);

    // Criar previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productData.name || !productData.storeId) {
      toast.error('Campos obrigatórios', {
        description: 'Nome e Loja são obrigatórios.',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Criar FormData para enviar produto com imagens
      const formData = new FormData();
      
      // Adicionar dados do produto
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Adicionar imagens
      selectedImages.forEach((file, index) => {
        formData.append('images', file);
      });

      // Enviar para o backend
      const response = await fetch('http://localhost:3001/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erro ao criar produto');
      }

      const newProduct = await response.json();
      
      onProductCreated(newProduct);
      onClose();
      
      // Reset form
      setProductData({
        name: '',
        description: '',
        category: 'SOFA',
        price: 0,
        costPrice: 0,
        stock: 0,
        minStock: 0,
        colorName: '',
        colorHex: '',
        brand: '',
        style: 'MODERNO',
        material: 'MADEIRA',
        width: 0,
        height: 0,
        depth: 0,
        weight: 0,
        model: '',
        sku: '',
        barcode: '',
        storeId: '',
        isFeatured: false,
        isNew: false,
        isBestSeller: false,
        isAvailable: true,
        is3D: false
      });
      setSelectedImages([]);
      setImagePreviews([]);

      toast.success('Produto criado com sucesso!', {
        description: `${newProduct.name} foi adicionado ao catálogo.`,
        duration: 4000,
      });
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao criar produto', {
        description: 'Tente novamente mais tarde.',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Plus className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Criar Novo Produto</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-[#3e2626] hover:bg-[#8B4513]">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Criando...' : 'Criar Produto'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload de Imagens */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Image className="h-5 w-5 mr-2" />
                    Imagens do Produto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Clique para selecionar imagens
                      </p>
                      <p className="text-sm text-gray-500">
                        Ou arraste e solte aqui
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        JPEG, PNG, WebP até 5MB cada (máx. 10 imagens)
                      </p>
                    </label>
                  </div>

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              Principal
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Dados do Produto */}
            <div className="space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                      value={productData.name}
                      onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do produto"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <textarea
                      id="description"
                      value={productData.description}
                      onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do produto"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Categoria *</Label>
                      <select
                        id="category"
                        value={productData.category}
                        onChange={(e) => setProductData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent"
                        required
                      >
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="storeId">Loja *</Label>
                      <Input
                        id="storeId"
                        value={productData.storeId}
                        onChange={(e) => setProductData(prev => ({ ...prev, storeId: e.target.value }))}
                        placeholder="ID da loja"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand">Marca</Label>
                      <Input
                        id="brand"
                        value={productData.brand}
                        onChange={(e) => setProductData(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="Marca do produto"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={productData.sku}
                        onChange={(e) => setProductData(prev => ({ ...prev, sku: e.target.value }))}
                        placeholder="Código SKU"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preço e Estoque */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preço e Estoque</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Preço de Venda *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={productData.price}
                          onChange={(e) => setProductData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="costPrice">Preço de Custo</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                        <Input
                          id="costPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={productData.costPrice}
                          onChange={(e) => setProductData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock">Estoque Inicial</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={productData.stock}
                        onChange={(e) => setProductData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="minStock">Estoque Mínimo</Label>
                      <Input
                        id="minStock"
                        type="number"
                        min="0"
                        value={productData.minStock}
                        onChange={(e) => setProductData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Especificações */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Especificações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="style">Estilo</Label>
                      <select
                        id="style"
                        value={productData.style}
                        onChange={(e) => setProductData(prev => ({ ...prev, style: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent"
                      >
                        {styles.map(style => (
                          <option key={style.value} value={style.value}>
                            {style.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="material">Material</Label>
                      <select
                        id="material"
                        value={productData.material}
                        onChange={(e) => setProductData(prev => ({ ...prev, material: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626] focus:border-transparent"
                      >
                        {materials.map(material => (
                          <option key={material.value} value={material.value}>
                            {material.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="width">Largura (cm)</Label>
                      <Input
                        id="width"
                        type="number"
                        min="0"
                        step="0.01"
                        value={productData.width}
                        onChange={(e) => setProductData(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="height">Altura (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        min="0"
                        step="0.01"
                        value={productData.height}
                        onChange={(e) => setProductData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="depth">Profundidade (cm)</Label>
                      <Input
                        id="depth"
                        type="number"
                        min="0"
                        step="0.01"
                        value={productData.depth}
                        onChange={(e) => setProductData(prev => ({ ...prev, depth: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="0"
                        step="0.01"
                        value={productData.weight}
                        onChange={(e) => setProductData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="colorName">Cor</Label>
                      <Input
                        id="colorName"
                        value={productData.colorName}
                        onChange={(e) => setProductData(prev => ({ ...prev, colorName: e.target.value }))}
                        placeholder="Nome da cor"
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productData.isFeatured}
                          onChange={(e) => setProductData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Produto em Destaque</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productData.isNew}
                          onChange={(e) => setProductData(prev => ({ ...prev, isNew: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Produto Novo</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productData.isBestSeller}
                          onChange={(e) => setProductData(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Mais Vendido</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={productData.is3D}
                          onChange={(e) => setProductData(prev => ({ ...prev, is3D: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Gerar Modelo 3D</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}