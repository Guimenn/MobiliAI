'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { aiAPI } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sparkles,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  Package,
  Wand2,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  color?: string;
  category?: string;
}

type Position = 'left' | 'right' | 'center' | 'background' | 'foreground' | '';

interface ProductWithPosition {
  product: Product;
  position: Position;
}

interface AITestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  products: Product[];
}

export default function AITestModal({
  isOpen,
  onClose,
  onContinue,
  products,
}: AITestModalProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [productPositions, setProductPositions] = useState<Map<string, Position>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setUploadedFile(file);
        setProcessedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
        // Remover posição quando desmarcar
        setProductPositions((prevPos) => {
          const newPos = new Map(prevPos);
          newPos.delete(productId);
          return newPos;
        });
      } else {
        newSet.add(productId);
        // Definir posição padrão como centro
        setProductPositions((prevPos) => {
          const newPos = new Map(prevPos);
          newPos.set(productId, 'center');
          return newPos;
        });
      }
      return newSet;
    });
  };

  const setProductPosition = (productId: string, position: Position) => {
    setProductPositions((prev) => {
      const newPos = new Map(prev);
      newPos.set(productId, position);
      return newPos;
    });
  };

  const handleProcessImage = async () => {
    if (!uploadedFile) {
      setError('Por favor, faça upload de uma imagem primeiro');
      return;
    }

    if (selectedProducts.size === 0) {
      setError('Por favor, selecione pelo menos um item para adicionar à foto');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Obter produtos selecionados
      const selectedProductsList = Array.from(selectedProducts).map(
        (id) => products.find((p) => p.id === id)
      ).filter(Boolean);

      // Buscar imagens dos produtos selecionados
      const productFiles: File[] = [];
      for (const product of selectedProductsList) {
        if (product?.imageUrl) {
          try {
            // Fazer download da imagem do produto
            const response = await fetch(product.imageUrl);
            if (!response.ok) {
              console.warn(`Imagem do produto ${product.name} não disponível: ${response.status}`);
              continue;
            }
            const blob = await response.blob();
            const fileName = product.imageUrl.split('/').pop() || `product-${product.id}.jpg`;
            const file = new File([blob], fileName, { type: blob.type });
            productFiles.push(file);
          } catch (err) {
            console.warn(`Não foi possível carregar imagem do produto ${product.name}:`, err);
          }
        } else {
          console.warn(`Produto ${product?.name} não possui imagem`);
        }
      }

      // Validar se pelo menos um produto tem imagem
      if (productFiles.length === 0) {
        setError('Nenhum dos produtos selecionados possui imagem disponível. Por favor, selecione produtos com imagens.');
        setIsProcessing(false);
        return;
      }

      // Criar prompt com posições específicas para cada produto
      const productPositionDescriptions: string[] = [];
      selectedProductsList.forEach((product, index) => {
        if (product && productFiles[index]) {
          const position = productPositions.get(product.id) || 'center';
          let positionDescription = '';
          
          switch (position) {
            case 'left':
              positionDescription = 'no lado esquerdo da imagem';
              break;
            case 'right':
              positionDescription = 'no lado direito da imagem';
              break;
            case 'center':
              positionDescription = 'no centro da imagem';
              break;
            case 'background':
              positionDescription = 'no fundo/plano de fundo da imagem';
              break;
            case 'foreground':
              positionDescription = 'na frente/primeiro plano da imagem';
              break;
            default:
              positionDescription = 'na imagem';
          }
          
          productPositionDescriptions.push(
            `O produto da imagem ${index + 2} (${product.name}) deve ser posicionado ${positionDescription}`
          );
        }
      });

      const positionInstructions = productPositionDescriptions.length > 0
        ? `\n\nINSTRUÇÕES DE POSICIONAMENTO:\n${productPositionDescriptions.join('.\n')}.`
        : '';

      // Prompt com posições específicas
      const prompt = `Adicione os produtos mostrados nas imagens na foto do ambiente de forma realista e natural. NÃO altere, remova ou modifique NADA na imagem original do ambiente. Apenas adicione os produtos das imagens fornecidas, posicionando-os de forma que pareçam ter sempre estado lá, integrados perfeitamente ao ambiente. Mantenha a iluminação, cores e estilo da foto original.${positionInstructions}`;

      // Processar imagem usando a API do Replicate
      const result = await aiAPI.processImageWithUpload({
        file: uploadedFile,
        productFiles: productFiles.length > 0 ? productFiles : undefined,
        prompt,
        outputFormat: 'jpg',
      });

      if (result.success && result.imageUrl) {
        setProcessedImage(result.imageUrl);
      } else {
        setError(result.error || 'Erro ao processar imagem');
      }
    } catch (err: any) {
      console.error('Erro ao processar imagem:', err);
      setError(err.response?.data?.message || err.message || 'Erro ao processar imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setProcessedImage(null);
    setError(null);
    setProductPositions(new Map());
  };

  const handleSkip = () => {
    onContinue();
  };

  const handleContinueToCheckout = () => {
    onContinue();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <span>Teste Nossa IA de Visualização</span>
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Envie uma foto do seu ambiente e veja como os produtos ficarão antes de comprar!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Upload de Imagem */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>1. Envie uma foto do seu ambiente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!uploadedImage ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">
                    {isDragActive
                      ? 'Solte a imagem aqui'
                      : 'Arraste uma imagem ou clique para selecionar'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Formatos aceitos: JPG, PNG, WebP (máx. 10MB)
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                    <img
                      src={uploadedImage}
                      alt="Imagem enviada"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="mt-2"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover Imagem
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seleção de Produtos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>2. Selecione os itens e suas posições</span>
              </CardTitle>
              <CardDescription>
                Escolha os produtos e defina onde cada um deve aparecer na foto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {products.map((product) => {
                  const isSelected = selectedProducts.has(product.id);
                  const position = productPositions.get(product.id) || 'center';
                  
                  return (
                    <div
                      key={product.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="flex items-center space-x-3 cursor-pointer"
                        onClick={() => toggleProductSelection(product.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleProductSelection(product.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {product.name}
                          </p>
                          {product.category && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                        {product.imageUrl && (
                          <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Seleção de Posição */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Label className="text-xs font-semibold text-gray-700 mb-2 block">
                            Posição na foto:
                          </Label>
                          <div className="grid grid-cols-5 gap-2">
                            {[
                              { value: 'left', label: '⬅️ Esquerda', icon: '⬅️' },
                              { value: 'center', label: '⬆️ Centro', icon: '⬆️' },
                              { value: 'right', label: '➡️ Direita', icon: '➡️' },
                              { value: 'background', label: '🔙 Fundo', icon: '🔙' },
                              { value: 'foreground', label: '🔝 Frente', icon: '🔝' },
                            ].map((pos) => (
                              <button
                                key={pos.value}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProductPosition(product.id, pos.value as Position);
                                }}
                                className={`px-2 py-2 rounded text-xs font-medium transition-all ${
                                  position === pos.value
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-purple-100'
                                }`}
                              >
                                <div className="text-base mb-1">{pos.icon}</div>
                                <div className="text-[10px]">{pos.label.split(' ')[1]}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedProducts.size === 0 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Selecione pelo menos um produto para continuar
                </p>
              )}
            </CardContent>
          </Card>

          {/* Botão de Processar */}
          {uploadedImage && selectedProducts.size > 0 && !processedImage && (
            <div className="flex justify-center">
              <Button
                onClick={handleProcessImage}
                disabled={isProcessing}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-6 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processando com IA...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    Processar Imagem com IA
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Resultado Processado */}
          {processedImage && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span>Imagem Processada com Sucesso!</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-96 rounded-lg overflow-hidden border-2 border-green-300 mb-4 bg-gray-100">
                  <img
                    src={processedImage}
                    alt="Imagem processada"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleContinueToCheckout}
                    className="flex-1 bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] hover:from-[#2a1f1f] hover:to-[#3e2626] text-white"
                  >
                    Continuar para Checkout
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setProcessedImage(null);
                      setUploadedImage(null);
                      setUploadedFile(null);
                      setSelectedProducts(new Set());
                    }}
                  >
                    Testar Novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleSkip}>
              Pular e Ir para Checkout
            </Button>
            {processedImage && (
              <Button
                onClick={handleContinueToCheckout}
                className="bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] hover:from-[#2a1f1f] hover:to-[#3e2626] text-white"
              >
                Continuar para Checkout
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

