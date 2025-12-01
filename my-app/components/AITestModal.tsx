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
  const [productPositions, setProductPositions] = useState<Map<string, Position>>(new Map());
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
    noClick: false,
    noKeyboard: true,
  });

  // Alternar seleção de produto
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
        // Remover posição quando deselecionar
        setProductPositions(prevPos => {
          const newPos = new Map(prevPos);
          newPos.delete(productId);
          return newPos;
        });
      } else {
        newSet.add(productId);
        // Definir posição padrão como 'center' quando selecionar
        setProductPositions(prevPos => {
          const newPos = new Map(prevPos);
          newPos.set(productId, 'center');
          return newPos;
        });
      }
      return newSet;
    });
  };

  // Definir posição de um produto
  const setProductPosition = (productId: string, position: Position) => {
    setProductPositions(prev => {
      const newPos = new Map(prev);
      newPos.set(productId, position);
      return newPos;
    });
  };

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

      // Preparar arquivos: imagem do ambiente + imagem do produto (OBRIGATÓRIA)
      const productFiles: File[] = [];
      
      // OBRIGATÓRIO: Buscar imagem do produto selecionado
      let productImageUrl = product.imageUrl || '';
      
      if (!productImageUrl) {
        throw new Error(`Produto ${product.name} não possui imagem. Por favor, selecione um produto com imagem.`);
      }

      console.log('🖼️ Carregando imagem do produto:', productImageUrl);
      
      try {
        // Tentar carregar a imagem do produto
        const response = await fetch(productImageUrl, {
          mode: 'cors',
          credentials: 'omit',
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao carregar imagem: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        // Verificar se é uma imagem válida
        if (!blob.type.startsWith('image/')) {
          throw new Error('Arquivo não é uma imagem válida');
        }
        
        const productFile = new File([blob], `product-${product.id}-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`, { 
          type: blob.type || 'image/jpeg' 
        });
        
        productFiles.push(productFile);
        console.log('✅ Imagem do produto carregada com sucesso:', productFile.name, productFile.size, 'bytes');
      } catch (err) {
        console.error('❌ Erro ao carregar imagem do produto:', err);
        throw new Error(`Não foi possível carregar a imagem do produto ${product.name}. Verifique se a URL da imagem está acessível.`);
      }

      // Calcular posição relativa na imagem (em porcentagem) para o prompt
      let positionDescription = '';
      if (position && imageRef.current && canvasRef.current) {
        const imgRect = imageRef.current.getBoundingClientRect();
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const imgOffsetX = imgRect.left - canvasRect.left;
        const imgOffsetY = imgRect.top - canvasRect.top;
        
        // Calcular posição relativa (0-100%)
        const relativeX = ((position.x + 75 - imgOffsetX) / imgRect.width) * 100;
        const relativeY = ((position.y + 75 - imgOffsetY) / imgRect.height) * 100;
        
        // Determinar região aproximada
        let region = '';
        if (relativeX < 33) region += 'lado esquerdo';
        else if (relativeX > 67) region += 'lado direito';
        else region += 'centro horizontal';
        
        if (relativeY < 33) region += ' da parte superior';
        else if (relativeY > 67) region += ' da parte inferior';
        else region += ' do meio';
        
        positionDescription = `\n\nPOSIÇÃO ESPECÍFICA: Coloque o produto na região ${region} da imagem (aproximadamente ${Math.round(relativeX)}% da esquerda, ${Math.round(relativeY)}% do topo).`;
      }

      // Criar prompt detalhado que ESPECIFICA usar a imagem do produto enviada
      const prompt = `IMPORTANTE: Use EXATAMENTE a imagem do produto que foi enviada como arquivo adicional. 

Adicione o ${product.name}${product.category ? ` (${product.category.toLowerCase()})` : ''} desta imagem de produto na sala de forma realista e natural.${positionDescription}

REQUISITOS OBRIGATÓRIOS:
- Use a imagem EXATA do produto que foi enviada, não invente ou substitua por outro produto
- O produto deve estar perfeitamente integrado ao ambiente com iluminação e sombras corretas
- Perspectiva adequada que respeita o ponto de vista da foto original
- Proporções realistas em relação aos outros elementos da sala
- Texturas e materiais que combinam com o ambiente
- Sem distorções ou artefatos visuais
- O produto deve parecer que realmente está na sala, como se tivesse sido fotografado no local

NÃO invente um produto diferente. Use APENAS a imagem do produto que foi enviada.`;

      // Usar o arquivo original (pode ser qualquer tipo)
      // Se temos uma imagem processada, usar ela; senão usar arquivo original
      let environmentFile: File = uploadedFile!;
      
      // Se temos uma imagem processada anteriormente, usar ela como base
      if (processedImage && processedImage.startsWith('http')) {
        try {
          const response = await fetch(processedImage);
          if (response.ok) {
            const blob = await response.blob();
            environmentFile = new File([blob], 'environment-processed.jpg', { type: 'image/jpeg' });
          }
        } catch (err) {
          console.warn('Não foi possível usar imagem processada, usando arquivo original:', err);
          // Continuar com arquivo original
        }
      } else if (uploadedImage && uploadedImage.startsWith('data:image')) {
        // Se temos data URL de imagem, converter para File
        try {
          const response = await fetch(uploadedImage);
          const blob = await response.blob();
          environmentFile = new File([blob], 'environment.jpg', { type: blob.type || 'image/jpeg' });
        } catch (err) {
          console.warn('Não foi possível converter data URL, usando arquivo original:', err);
          // Continuar com arquivo original
        }
      }

      // Validar que temos a imagem do produto antes de enviar
      if (productFiles.length === 0) {
        throw new Error('Erro: Imagem do produto não foi carregada. Por favor, tente novamente.');
      }

      console.log('📤 Enviando para IA:');
      console.log('  - Ambiente:', environmentFile.name, environmentFile.size, 'bytes');
      console.log('  - Produto:', productFiles[0].name, productFiles[0].size, 'bytes');
      console.log('  - Prompt:', prompt.substring(0, 100) + '...');

      // Chamar nossa IA - usar endpoint público para demo
      const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
      const formData = new FormData();
      formData.append('images', environmentFile);
      productFiles.forEach((productFile) => {
        formData.append('images', productFile);
      });
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

      // Prompt simples para adicionar produtos
      const productNames = selectedProductsList.map(p => p?.name).filter(Boolean).join(', ');
      const prompt = `Adicione os produtos mostrados nas imagens na foto do ambiente de forma realista e natural. NÃO altere, remova ou modifique NADA na imagem original do ambiente. Apenas adicione os produtos das imagens fornecidas (${productNames}), posicionando-os de forma que pareçam ter sempre estado lá, integrados perfeitamente ao ambiente. Mantenha a iluminação, cores e estilo da foto original.`;

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
      setSelectedProducts(new Set());
      setProductPositions(new Map());
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl w-full max-h-[95vh] flex flex-col border-[#3e2626]/20 bg-white shadow-2xl p-0 z-[1000]">
        <DialogHeader className="border-b border-[#3e2626]/10 px-6 py-4 bg-gradient-to-r from-[#3e2626] to-[#5a3a3a] text-white shrink-0">
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#C07A45]" />
            Visualizar como vai ficar
          </DialogTitle>
          <DialogDescription className="text-sm text-white/80 mt-2">
            Faça upload de uma foto do ambiente e clique para posicionar os produtos • {products.length} {products.length === 1 ? 'produto' : 'produtos'} disponíveis
          </DialogDescription>
        </DialogHeader>

        {/* Mensagem de seleção de posição */}
        {isSelectingPosition && pendingProduct && (
          <div className="bg-[#C07A45]/10 border-b border-[#C07A45]/30 px-6 py-3 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C07A45] animate-pulse" />
                <p className="text-sm font-medium text-[#3e2626]">
                  <span className="font-semibold">Clique na imagem</span> para escolher onde colocar: <span className="text-[#C07A45]">{pendingProduct.name}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelPositionSelection}
                className="text-[#3e2626] hover:bg-[#C07A45]/20 h-7 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          <div className="space-y-6">
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
                  <div
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseMove={(e) => {
                      if (isSelectingPosition && imageRef.current && canvasRef.current) {
                        const canvasRect = canvasRef.current.getBoundingClientRect();
                        const imgRect = imageRef.current.getBoundingClientRect();
                        const imgOffsetX = imgRect.left - canvasRect.left;
                        const imgOffsetY = imgRect.top - canvasRect.top;
                        
                        const mouseX = e.clientX - canvasRect.left;
                        const mouseY = e.clientY - canvasRect.top;
                        
                        if (mouseX >= imgOffsetX && mouseX <= imgOffsetX + imgRect.width &&
                            mouseY >= imgOffsetY && mouseY <= imgOffsetY + imgRect.height) {
                          setHoverPosition({
                            x: mouseX - 75,
                            y: mouseY - 75,
                          });
                        } else {
                          setHoverPosition(null);
                        }
                      }
                    }}
                    onMouseLeave={() => {
                      if (isSelectingPosition) {
                        setHoverPosition(null);
                      }
                    }}
                    className={`relative w-full rounded-lg overflow-hidden border-2 bg-gray-100 ${
                      isSelectingPosition
                        ? 'border-[#C07A45] cursor-crosshair'
                        : 'border-gray-200'
                    }`}
                    style={{ minHeight: '400px', maxHeight: '600px' }}
                  >
                    <div className="relative w-full h-full">
                      <img
                        ref={imageRef}
                        src={uploadedImage || ''}
                        alt="Imagem enviada"
                        className="w-full h-full object-contain"
                      />
                      
                      {/* Overlay de seleção de posição */}
                      {isSelectingPosition && !isProcessing && (
                        <div className="absolute inset-0 rounded-lg border-2 border-dashed border-[#C07A45]/50 bg-[#C07A45]/5 pointer-events-none z-10" />
                      )}

                      {/* Indicador de hover (posição do mouse) */}
                      {hoverPosition && isSelectingPosition && !isProcessing && !selectedPosition && imageRef.current && canvasRef.current && (
                        <div
                          className="absolute z-20 pointer-events-none"
                          style={{
                            left: `${hoverPosition.x}px`,
                            top: `${hoverPosition.y}px`,
                            width: '150px',
                            height: '150px',
                          }}
                        >
                          <div className="relative w-full h-full border-2 border-[#C07A45] border-dashed rounded-lg bg-[#C07A45]/5">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#C07A45]/80 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                              {pendingProduct?.name}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Indicador de posição selecionada */}
                      {selectedPosition && isSelectingPosition && !isProcessing && imageRef.current && canvasRef.current && (
                        <div
                          className="absolute z-20 pointer-events-none"
                          style={{
                            left: `${selectedPosition.x}px`,
                            top: `${selectedPosition.y}px`,
                            width: '150px',
                            height: '150px',
                          }}
                        >
                          <div className="relative w-full h-full border-4 border-[#C07A45] border-dashed rounded-lg bg-[#C07A45]/10 animate-pulse">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#C07A45] text-white px-3 py-1 rounded-full text-xs font-semibold">
                              {pendingProduct?.name}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Overlay de IA processando */}
                      {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#3e2626]/80 backdrop-blur-sm z-30">
                          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-2xl border border-[#3e2626]/20">
                            <Loader2 className="h-12 w-12 animate-spin text-[#C07A45]" />
                            <p className="text-lg font-semibold text-[#3e2626]">Processando com nossa IA...</p>
                            <p className="text-sm text-[#4f3a2f]/70">Aguarde alguns segundos</p>
                          </div>
                        </div>
                      )}

                      {/* Mostrar produtos posicionados */}
                      {placedProducts.map((item) => (
                        <div
                          key={item.id}
                          className="absolute z-10"
                          style={{
                            left: `${item.x}px`,
                            top: `${item.y}px`,
                            width: `${item.width}px`,
                            height: `${item.height}px`,
                            transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
                            transformOrigin: 'center',
                            border: item.isSelected ? '2px solid #C07A45' : 'none',
                            cursor: 'move',
                          }}
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remover Imagem
                    </Button>
                    {isSelectingPosition && (
                      <p className="text-sm text-[#C07A45] font-medium">
                        Clique na imagem para posicionar o produto
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seleção de Produtos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>2. Clique nos produtos para adicionar à imagem</span>
              </CardTitle>
              <CardDescription>
                Clique em um produto e depois clique na imagem para posicioná-lo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {products.map((product) => {
                  const isSelected = selectedProducts.has(product.id);
                  const isPending = pendingProduct?.id === product.id;
                  
                  return (
                    <div
                      key={product.id}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        isPending
                          ? 'border-[#C07A45] bg-[#F7C194]/20'
                          : isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleStartAddProduct(product)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {product.name}
                          </p>
                          {product.category && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {product.category}
                            </Badge>
                          )}
                          {isSelected && (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              ✓ Adicionado
                            </p>
                          )}
                          {isPending && (
                            <p className="text-xs text-[#C07A45] mt-1 font-medium">
                              Clique na imagem para posicionar
                            </p>
                          )}
                        </div>
                        {product.imageUrl && (
                          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {products.length === 0 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Nenhum produto disponível
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
          <div className="flex justify-between pt-4 border-t shrink-0">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}


