'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { aiAPI } from '@/lib/api';
import { env } from '@/lib/env';
import { showAlert } from '@/lib/alerts';
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
  Camera,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  CheckCircle2,
  Package,
  Wand2,
} from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  color?: string;
  category?: string;
}

type Position = 'left' | 'right' | 'center' | 'background' | 'foreground' | '';

interface PlacedProduct {
  id: string;
  productId: string;
  name: string;
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  isSelected: boolean;
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
  const [placedProducts, setPlacedProducts] = useState<PlacedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [isSelectingPosition, setIsSelectingPosition] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

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

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    noClick: true,
    noKeyboard: true,
  });

  // Abrir câmera
  const handleCameraClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onDrop([file]);
      }
    };
    input.click();
  };

  // Iniciar seleção de posição
  const handleStartAddProduct = (product: Product) => {
    if (!uploadedFile && !uploadedImage) {
      showAlert('warning', 'Por favor, faça upload de uma imagem do ambiente primeiro');
      return;
    }
    
    setPendingProduct(product);
    setIsSelectingPosition(true);
    setSelectedPosition(null);
  };

  // Cancelar seleção de posição
  const handleCancelPositionSelection = () => {
    setPendingProduct(null);
    setIsSelectingPosition(false);
    setSelectedPosition(null);
  };

  // Click na imagem para selecionar posição
  const handleImageClickForPosition = (e: React.MouseEvent) => {
    if (!isSelectingPosition || !pendingProduct || !imageRef.current || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();
    
    const imgOffsetX = imgRect.left - canvasRect.left;
    const imgOffsetY = imgRect.top - canvasRect.top;
    
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    if (mouseX >= imgOffsetX && mouseX <= imgOffsetX + imgRect.width &&
        mouseY >= imgOffsetY && mouseY <= imgOffsetY + imgRect.height) {
      const position = {
        x: mouseX - 75,
        y: mouseY - 75,
      };
      setSelectedPosition(position);
      handleAddProductToImage(pendingProduct, position);
    }
  };

  // Click no canvas para deselecionar
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isSelectingPosition) {
      handleImageClickForPosition(e);
      return;
    }
    setPlacedProducts(prev => prev.map(item => ({ ...item, isSelected: false })));
  };

  // Adicionar produto à imagem
  const handleAddProductToImage = async (product: Product, position?: { x: number; y: number }) => {
    if (!uploadedFile && !uploadedImage) {
      showAlert('warning', 'Por favor, faça upload de uma imagem do ambiente primeiro');
      return;
    }

    try {
      setIsProcessing(true);
      setIsSelectingPosition(false);

      const calculatePosition = (): { x: number; y: number } => {
        if (position) return position;
        if (!imageRef.current || !canvasRef.current) {
          return { x: 200, y: 200 };
        }
        const imgRect = imageRef.current.getBoundingClientRect();
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const imgOffsetX = imgRect.left - canvasRect.left;
        const imgOffsetY = imgRect.top - canvasRect.top;
        const centerX = imgOffsetX + imgRect.width / 2 - 75;
        const centerY = imgOffsetY + imgRect.height / 2 - 75;
        return {
          x: Math.max(imgOffsetX, centerX),
          y: Math.max(imgOffsetY, centerY),
        };
      };

      const pos = calculatePosition();
      const productImageUrl = product.imageUrl;

      // Preparar arquivos
      const productFiles: File[] = [];
      if (productImageUrl) {
        try {
          const response = await fetch(productImageUrl);
          const blob = await response.blob();
          const productFile = new File([blob], `product-${product.id}.jpg`, { type: 'image/jpeg' });
          productFiles.push(productFile);
        } catch (err) {
          console.error('Erro ao carregar imagem do produto:', err);
        }
      }

      let environmentFile: File = uploadedFile!;
      if (processedImage && processedImage.startsWith('http')) {
        try {
          const response = await fetch(processedImage);
          if (response.ok) {
            const blob = await response.blob();
            environmentFile = new File([blob], 'environment-processed.jpg', { type: 'image/jpeg' });
          }
        } catch {
          // Usar arquivo original se falhar
        }
      } else if (uploadedImage && uploadedImage.startsWith('data:image')) {
        try {
          const response = await fetch(uploadedImage);
          const blob = await response.blob();
          environmentFile = new File([blob], 'environment.jpg', { type: blob.type || 'image/jpeg' });
        } catch {
          // Usar arquivo original se falhar
        }
      }

      const prompt = `Adicione o produto "${product.name}" nesta imagem do ambiente. O produto deve estar perfeitamente integrado ao ambiente, com iluminação, sombras e perspectiva realistas. O produto deve parecer fotografado no local.`;

      const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
      const formData = new FormData();
      formData.append('images', environmentFile);
      if (productFiles.length > 0) {
        productFiles.forEach(file => formData.append('productImages', file));
      }
      formData.append('prompt', prompt);
      formData.append('outputFormat', 'jpg');

      const response = await fetch(`${apiBaseUrl}/public/ai/process-upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao processar imagem' }));
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      const result = await response.json();
      const processedUrl = result.processedImageUrl || result.imageUrl;

      if (processedUrl) {
        setProcessedImage(processedUrl);
        const newItem: PlacedProduct = {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          image: productImageUrl || '',
          x: pos.x,
          y: pos.y,
          width: 150,
          height: 150,
          rotation: 0,
          scale: 1,
          isSelected: false,
        };
        setPlacedProducts(prev => [...prev, newItem]);
        setSelectedProducts(prev => new Set([...prev, product.id]));
        setPendingProduct(null);
        setSelectedPosition(null);
        showAlert('success', 'Produto adicionado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao adicionar produto:', error);
      setError(error.message || 'Erro ao processar imagem com IA');
      showAlert('error', error.message || 'Erro ao processar imagem com IA');
    } finally {
      setIsProcessing(false);
    }
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

  // Resetar estados ao fechar
  useEffect(() => {
    if (!isOpen) {
      setUploadedImage(null);
      setUploadedFile(null);
      setProcessedImage(null);
      setPlacedProducts([]);
      setPendingProduct(null);
      setIsSelectingPosition(false);
      setSelectedPosition(null);
      setError(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl w-full max-h-[95vh] overflow-hidden border-[#3e2626]/20 bg-white shadow-2xl p-0">
        <DialogHeader className="border-b border-[#3e2626]/10 px-6 py-4 bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white">
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#C07A45]" />
            Visualizar como vai ficar
          </DialogTitle>
          <DialogDescription className="text-sm text-white/80 mt-2">
            Faça upload de uma foto do ambiente e clique para posicionar os produtos • {products.length} {products.length === 1 ? 'produto' : 'produtos'} disponíveis
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

