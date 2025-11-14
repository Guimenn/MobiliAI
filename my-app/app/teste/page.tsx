'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import { aiAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useProducts } from '@/lib/hooks/useProducts';
import {
  Upload,
  Camera,
  RotateCw,
  ZoomIn,
  Undo2,
  Redo2,
  Sparkles,
  Download,
  Search,
  Sofa,
  User,
  Table,
  BookOpen,
  Lamp,
  X,
  GripVertical,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Tipos e interfaces
interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  imageUrl?: string;
  imageUrls?: string[];
}

interface PlacedFurniture {
  id: string;
  furnitureId: string;
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

interface HistoryState {
  furniture: PlacedFurniture[];
}

// Mock data do catálogo
const CATEGORIES = ['Todos', 'Sofás', 'Cadeiras', 'Mesas', 'Estantes', 'Iluminação'];

// Mapear categorias da API para categorias do catálogo
const mapCategory = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'sofa': 'Sofás',
    'cadeira': 'Cadeiras',
    'mesa': 'Mesas',
    'estante': 'Estantes',
    'iluminacao': 'Iluminação',
    'mesa_centro': 'Mesas',
    'sofa_retratil': 'Sofás',
    'cadeira_escritorio': 'Cadeiras',
  };
  
  const normalized = category?.toLowerCase() || '';
  return categoryMap[normalized] || 'Outros';
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Sofás: <Sofa className="h-5 w-5" />,
  Cadeiras: <User className="h-5 w-5" />,
  Mesas: <Table className="h-5 w-5" />,
  Estantes: <BookOpen className="h-5 w-5" />,
  Iluminação: <Lamp className="h-5 w-5" />,
};

export default function TestAIPage() {
  const { isAuthenticated, setLoading } = useAppStore();
  
  // Estados principais
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [placedFurniture, setPlacedFurniture] = useState<PlacedFurniture[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<PlacedFurniture | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  
  // Buscar produtos reais
  const { products: allProducts } = useProducts();

  // Histórico para Undo/Redo
  const [history, setHistory] = useState<HistoryState[]>([{ furniture: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Configuração do dropzone - aceitar qualquer arquivo
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Aceitar qualquer tipo de arquivo
    // Se for imagem, mostrar preview; se não, apenas processar
    const isImage = file.type.startsWith('image/');
    
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);
        setUploadedImageFile(file);
        setError(null);
        setSuccessMessage('Imagem carregada com sucesso!');
        setProcessedImageUrl(null);
        setTimeout(() => setSuccessMessage(null), 3000);
      };
      reader.readAsDataURL(file);
    } else {
      // Para arquivos que não são imagens, converter para imagem ou processar diretamente
      setUploadedImageFile(file);
      setError(null);
      setSuccessMessage('Arquivo carregado! Processando com IA...');
      
      // Se não for imagem, tentar processar diretamente com a IA
      // A IA do nano-banana pode processar diferentes tipos de arquivo
      setUploadedImage(`data:${file.type};base64,${btoa(String.fromCharCode(...new Uint8Array(0)))}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    // Aceitar qualquer tipo de arquivo
    multiple: false,
    noClick: true, // Desabilitar click no container
    noKeyboard: true,
  });

  // Abrir câmera - aceitar qualquer arquivo
  const handleCameraClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    // Removido accept para aceitar qualquer tipo de arquivo
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onDrop([file]);
      }
    };
    input.click();
  };


  // Adicionar móvel ao ambiente - COM IA do nano-banana
  const handleAddFurniture = async (furniture: FurnitureItem) => {
    if (!uploadedImageFile || !isAuthenticated) {
      setError('Você precisa estar logado e ter um arquivo carregado.');
      return;
    }

    try {
      setIsProcessingAI(true);
      setError(null);
      setLoading(true);

      // Calcular posição centralizada na imagem
      const calculatePosition = (): { x: number; y: number } => {
        if (!imageRef.current || !canvasRef.current) {
          return { x: 200, y: 200 }; // Fallback
        }

        const imgRect = imageRef.current.getBoundingClientRect();
        const canvasRect = canvasRef.current.getBoundingClientRect();
        
        if (!canvasRect) return { x: 200, y: 200 };

        // Calcular offset da imagem no canvas
        const imgOffsetX = imgRect.left - canvasRect.left;
        const imgOffsetY = imgRect.top - canvasRect.top;

        // Posição centralizada na imagem
        const centerX = imgOffsetX + imgRect.width / 2 - 75;
        const centerY = imgOffsetY + imgRect.height / 2 - 75;

        return {
          x: Math.max(imgOffsetX, centerX),
          y: Math.max(imgOffsetY, centerY),
        };
      };

      const pos = calculatePosition();

      // Criar prompt detalhado para a IA do nano-banana
      const prompt = `Adicione um ${furniture.name} (${furniture.category.toLowerCase()}) nesta sala de forma realista e natural. O móvel deve estar perfeitamente integrado ao ambiente com: 
- Iluminação e sombras corretas que seguem a luz do ambiente
- Perspectiva adequada que respeita o ponto de vista da foto
- Proporções realistas em relação aos outros elementos
- Texturas e materiais que combinam com o ambiente
- Sem distorções ou artefatos visuais
O móvel deve parecer que realmente está na sala, como se tivesse sido fotografado no local.`;
      
      // Preparar arquivos: imagem do ambiente + imagem do produto (se disponível)
      const productFiles: File[] = [];
      
      // Se o produto tem imagem, tentar adicionar
      if (furniture.imageUrl || (furniture.imageUrls && furniture.imageUrls.length > 0)) {
        try {
          const productImageUrl = furniture.imageUrl || (furniture.imageUrls && furniture.imageUrls[0]);
          if (productImageUrl) {
            const response = await fetch(productImageUrl);
            const blob = await response.blob();
            const productFile = new File([blob], `product-${furniture.id}.jpg`, { type: 'image/jpeg' });
            productFiles.push(productFile);
          }
        } catch (err) {
          console.warn('Não foi possível carregar imagem do produto:', err);
        }
      }

      // Usar o arquivo original (pode ser qualquer tipo)
      // Se temos uma imagem processada, usar ela; senão usar arquivo original
      let environmentFile: File = uploadedImageFile;
      
      // Se temos uma imagem processada anteriormente, usar ela como base
      if (processedImageUrl && processedImageUrl.startsWith('http')) {
        try {
          const response = await fetch(processedImageUrl);
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

      // Chamar IA do nano-banana - processa qualquer arquivo
      const result = await aiAPI.processImageWithUpload({
        file: environmentFile,
        productFiles: productFiles.length > 0 ? productFiles : undefined,
        prompt,
        outputFormat: 'jpg',
      });

      if (result.success && result.imageUrl) {
        // Atualizar imagem processada
        setProcessedImageUrl(result.imageUrl);
        setUploadedImage(result.imageUrl);
        
        // Adicionar móvel à lista
        setPlacedFurniture((prev) => {
          const currentState = { furniture: [...prev] };
          
          const newFurniture: PlacedFurniture = {
            id: `furniture-${Date.now()}-${Math.random()}`,
            furnitureId: furniture.id,
            name: furniture.name,
            image: furniture.imageUrl || furniture.image,
            x: pos.x,
            y: pos.y,
            width: 150,
            height: 150,
            rotation: 0,
            scale: 1,
            isSelected: false,
          };

          const updated = [...prev, newFurniture];
          
          // Atualizar histórico
          setHistory((prevHistory) => {
            const newHistory = prevHistory.slice(0, historyIndex + 1);
            newHistory.push(currentState);
            newHistory.push({ furniture: updated });
            setHistoryIndex(newHistory.length - 1);
            return newHistory;
          });
          
          return updated;
        });
        
        setSelectedFurniture(null);
        setSuccessMessage(`${furniture.name} adicionado com IA!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(result.error || 'Erro ao processar imagem com IA');
      }
    } catch (error: unknown) {
      console.error('Erro ao adicionar móvel com IA:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || 'Erro ao processar imagem com IA. Tente novamente.';
      setError(errorMessage);
    } finally {
      setIsProcessingAI(false);
      setLoading(false);
    }
  };

  // Gerenciamento de histórico
  const addToHistory = useCallback(() => {
    const currentState = { furniture: [...placedFurniture] };
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex, placedFurniture]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPlacedFurniture(history[historyIndex - 1].furniture);
      setSelectedFurniture(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPlacedFurniture(history[historyIndex + 1].furniture);
      setSelectedFurniture(null);
    }
  };

  // Selecionar móvel
  const handleFurnitureClick = (furniture: PlacedFurniture, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFurniture(furniture);
    setPlacedFurniture(
      placedFurniture.map((f) => ({
        ...f,
        isSelected: f.id === furniture.id,
      }))
    );
  };

  // Drag handlers
  const handleMouseDown = (furniture: PlacedFurniture, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFurniture(furniture);
    isDraggingRef.current = true;
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const imgRect = imageRef.current?.getBoundingClientRect();
    
    if (canvasRect && imgRect) {
      // Calcular offset considerando a posição relativa da imagem no canvas
      const imgOffsetX = imgRect.left - canvasRect.left;
      const imgOffsetY = imgRect.top - canvasRect.top;
      
      dragOffsetRef.current = {
        x: e.clientX - imgRect.left - (furniture.x - imgOffsetX),
        y: e.clientY - imgRect.top - (furniture.y - imgOffsetY),
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !selectedFurniture || !canvasRef.current || !imageRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const imgRect = imageRef.current.getBoundingClientRect();
      
      if (!imgRect) return;

      // Calcular nova posição relativa à imagem
      const imgOffsetX = imgRect.left - canvasRect.left;
      const imgOffsetY = imgRect.top - canvasRect.top;
      
      const newX = e.clientX - imgRect.left - dragOffsetRef.current.x + imgOffsetX;
      const newY = e.clientY - imgRect.top - dragOffsetRef.current.y + imgOffsetY;

      // Limitar dentro dos bounds da imagem
      const maxX = imgOffsetX + imgRect.width - selectedFurniture.width;
      const maxY = imgOffsetY + imgRect.height - selectedFurniture.height;

      setPlacedFurniture(
        placedFurniture.map((f) =>
          f.id === selectedFurniture.id
            ? {
                ...f,
                x: Math.max(imgOffsetX, Math.min(newX, maxX)),
                y: Math.max(imgOffsetY, Math.min(newY, maxY)),
              }
            : f
        )
      );
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        addToHistory();
      }
    };

    if (isDraggingRef.current) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedFurniture, placedFurniture, addToHistory]);

  // Rotacionar móvel
  const handleRotate = (direction: 'left' | 'right') => {
    if (!selectedFurniture) return;
    addToHistory();
    const rotation = direction === 'right' ? 90 : -90;
    setPlacedFurniture(
      placedFurniture.map((f) =>
        f.id === selectedFurniture.id ? { ...f, rotation: f.rotation + rotation } : f
      )
    );
  };

  // Escalar móvel
  const handleScale = (direction: 'in' | 'out') => {
    if (!selectedFurniture) return;
    addToHistory();
    const scaleFactor = direction === 'in' ? 1.1 : 0.9;
    setPlacedFurniture(
      placedFurniture.map((f) =>
        f.id === selectedFurniture.id
          ? {
              ...f,
              scale: Math.max(0.5, Math.min(2, f.scale * scaleFactor)),
              width: f.width * scaleFactor,
              height: f.height * scaleFactor,
            }
          : f
      )
    );
  };

  // Auto posicionar IA - usando nano-banana para otimizar posições
  const handleAutoPosition = async () => {
    if (!uploadedImageFile || placedFurniture.length === 0 || !isAuthenticated) {
      setError('Você precisa estar logado, ter um arquivo carregado e móveis adicionados.');
      return;
    }

    try {
      setIsProcessingAI(true);
      setError(null);
      setLoading(true);

      // Criar prompt detalhado para reposicionar móveis
      const furnitureList = placedFurniture.map(f => f.name).join(', ');
      const prompt = `Reposicione e otimize os seguintes móveis nesta sala: ${furnitureList}. 

Requisitos:
- Distribua os móveis de forma harmoniosa e funcional
- Respeite o espaço e a circulação da sala
- Ajuste iluminação e sombras para integração natural
- Mantenha perspectiva e proporções realistas
- Garanta que os móveis pareçam fotografados no local
- Crie uma composição visualmente agradável e equilibrada

Os móveis devem estar perfeitamente integrados ao ambiente, como se fossem parte original da decoração.`;

      // Usar arquivo processado se disponível, senão usar original
      let environmentFile: File = uploadedImageFile;
      
      if (processedImageUrl && processedImageUrl.startsWith('http')) {
        try {
          const response = await fetch(processedImageUrl);
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

      // Chamar IA do nano-banana para auto-posicionar
      const result = await aiAPI.processImageWithUpload({
        file: environmentFile,
        prompt,
        outputFormat: 'jpg',
      });

      if (result.success && result.imageUrl) {
        // Atualizar imagem processada pela IA
        setProcessedImageUrl(result.imageUrl);
        if (result.imageUrl.startsWith('http')) {
          setUploadedImage(result.imageUrl);
        }
        
        addToHistory();
        // A imagem já foi reprocessada pela IA com móveis reposicionados
        setSuccessMessage('Móveis reposicionados pela IA do nano-banana!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(result.error || 'Erro ao processar imagem com IA');
      }
    } catch (error: unknown) {
      console.error('Erro ao reposicionar móveis com IA:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || 'Erro ao processar imagem com IA. Tente novamente.';
      setError(errorMessage);
    } finally {
      setIsProcessingAI(false);
      setLoading(false);
    }
  };

  // Salvar imagem - usa a imagem já processada pela IA
  const handleSaveImage = () => {
    // Usar a imagem processada pela IA se disponível, senão a original
    const imageToSave = processedImageUrl || uploadedImage;
    if (!imageToSave) return;

    // Se já temos uma imagem processada pela IA, apenas fazer download
    if (processedImageUrl) {
      const a = document.createElement('a');
      a.href = processedImageUrl;
      a.download = `ambiente-decorado-${Date.now()}.jpg`;
      a.click();
      setSuccessMessage('Imagem salva com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    // Se não temos imagem processada, criar canvas com aviso
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Adicionar aviso discreto
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, canvas.height - 40, 380, 30);
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Adicione móveis com IA para renderização completa', 15, canvas.height - 15);

      // Gerar download
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ambiente-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            setSuccessMessage('Imagem salva com sucesso!');
            setTimeout(() => setSuccessMessage(null), 3000);
          }
        },
        'image/png',
        0.95
      );
    };
    img.onerror = () => {
      setError('Erro ao processar a imagem. Tente novamente.');
    };
    img.src = imageToSave;
  };

  // Remover móvel
  const handleRemoveFurniture = (id: string) => {
    addToHistory();
    setPlacedFurniture(placedFurniture.filter((f) => f.id !== id));
    if (selectedFurniture?.id === id) {
      setSelectedFurniture(null);
    }
  };

  // Converter produtos da API para o formato do catálogo
  const catalogProducts: FurnitureItem[] = allProducts.map((product) => ({
    id: product.id,
    name: product.name,
    category: mapCategory(product.category),
    price: product.price,
    image: product.imageUrl || '/placeholder.jpg',
    imageUrl: product.imageUrl,
    imageUrls: (product as { imageUrls?: string[] }).imageUrls || [],
  }));

  // Filtrar produtos
  const filteredProducts = catalogProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Click no canvas para deselecionar
  const handleCanvasClick = () => {
    setSelectedFurniture(null);
    setPlacedFurniture(placedFurniture.map((f) => ({ ...f, isSelected: false })));
  };

  // Verificar autenticação
  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ paddingTop: '140px' }}>
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Acesso Necessário</CardTitle>
              <CardDescription className="text-center">
                Você precisa estar logado para usar o Visualizador de Móveis com IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" asChild>
                <Link href="/login">Fazer Login</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/teste-ia-landing">Ver Demonstração</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Navbar */}
      <Header />
      
      <div className="flex flex-col bg-gray-50" style={{ minHeight: '100vh', paddingTop: '140px' }}>
        {/* Header com ferramentas */}
        <div className="sticky top-[140px] z-30 bg-white shadow-sm">
          <div className="container mx-auto flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Visualizador de Móveis com IA</h1>
              </div>
              {uploadedImage && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyIndex === 0}>
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRedo}
                    disabled={historyIndex === history.length - 1}
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                  <div className="mx-2 h-6 w-px bg-gray-300" />
                  {selectedFurniture && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleRotate('left')}>
                        <RotateCw className="h-4 w-4 rotate-[-90]" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRotate('right')}>
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleScale('out')}>
                        <ZoomIn className="h-4 w-4 rotate-180" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleScale('in')}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {uploadedImage && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleAutoPosition}
                  disabled={isProcessingAI || placedFurniture.length === 0}
                >
                  {isProcessingAI ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando imagem com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Auto posicionar móveis
                    </>
                  )}
                </Button>
                <Button onClick={handleSaveImage}>
                  <Download className="mr-2 h-4 w-4" />
                  Salvar imagem
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mensagens de erro/sucesso */}
        {error && (
          <div className="container mx-auto px-4">
            <div className="mt-2 flex items-center gap-2 border-l-4 border-red-500 bg-red-50 px-4 py-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
              <Button variant="ghost" size="icon" onClick={() => setError(null)} className="ml-auto h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="container mx-auto px-4">
            <div className="mt-2 flex items-center gap-2 border-l-4 border-green-500 bg-green-50 px-4 py-3 text-sm text-green-700 animate-in slide-in-from-top">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {/* Conteúdo principal - 2 colunas */}
        <div className="flex-1 pb-6">
          <div
            className="container mx-auto flex h-full overflow-hidden px-4"
            style={{ height: 'calc(100vh - 220px)' }}
          >
            {/* Coluna esquerda - Canvas */}
            <div className="flex flex-1 flex-col overflow-hidden border-r border-gray-200 bg-white">
              {!uploadedImage ? (
                <div className="flex flex-1 items-center justify-center p-8 animate-in fade-in duration-500">
                  <Card className="w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-500">
                    <CardContent className="p-8">
                      <div
                        {...getRootProps()}
                        className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-all ${
                          isDragActive ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <Upload className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                        <p className="mb-2 text-lg font-medium text-gray-700">
                          {isDragActive ? 'Solte a imagem aqui' : 'Arraste sua foto aqui ou clique para enviar'}
                        </p>
                        <p className="mb-6 text-sm text-gray-500">
                          Aceita qualquer tipo de arquivo - imagens serão processadas com IA do nano-banana
                        </p>
                        <div className="flex justify-center gap-4">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              open();
                            }}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Enviar foto
                          </Button>
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCameraClick();
                            }}
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Abrir câmera
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="relative flex flex-1 overflow-auto bg-gray-100 animate-in fade-in duration-500">
                  <div
                    ref={canvasRef}
                    className="relative flex min-h-full items-center justify-center cursor-default p-8"
                    onClick={handleCanvasClick}
                  >
                    <div className="relative max-h-full max-w-full animate-in zoom-in-95 duration-500">
                      {uploadedImage && uploadedImage.startsWith('data:image') ? (
                        <Image
                          ref={imageRef}
                          src={processedImageUrl || uploadedImage}
                          alt="Ambiente"
                          width={1024}
                          height={768}
                          className="h-auto max-w-full rounded-lg shadow-2xl"
                          style={{ maxHeight: 'calc(100vh - 200px)' }}
                          unoptimized
                        />
                      ) : processedImageUrl ? (
                        <Image
                          ref={imageRef}
                          src={processedImageUrl}
                          alt="Ambiente processado pela IA"
                          width={1024}
                          height={768}
                          className="h-auto max-w-full rounded-lg shadow-2xl"
                          style={{ maxHeight: 'calc(100vh - 200px)' }}
                          unoptimized
                        />
                      ) : uploadedImageFile ? (
                        <div className="rounded-lg bg-gray-100 p-12 text-center">
                          <p className="mb-4 text-gray-600">Arquivo carregado: {uploadedImageFile.name}</p>
                          <p className="text-sm text-gray-500">Adicione um móvel para processar com IA</p>
                        </div>
                      ) : null}

                      {/* Overlay de móveis colocados */}
                      {placedFurniture.map((furniture) => (
                        <div
                          key={furniture.id}
                          className={`absolute cursor-move animate-in fade-in zoom-in-95 duration-300 ${
                            furniture.isSelected ? 'z-10 ring-2 ring-blue-500 ring-offset-2' : 'z-0'
                          }`}
                          style={{
                            left: `${furniture.x}px`,
                            top: `${furniture.y}px`,
                            width: `${furniture.width}px`,
                            height: `${furniture.height}px`,
                            transform: `rotate(${furniture.rotation}deg) scale(${furniture.scale})`,
                            transformOrigin: 'center center',
                          }}
                          onClick={(e) => handleFurnitureClick(furniture, e)}
                          onMouseDown={(e) => handleMouseDown(furniture, e)}
                        >
                          <div className="relative flex h-full w-full items-center justify-center rounded-lg border-2 border-gray-300 bg-white shadow-lg">
                            <div className="p-2 text-center text-xs text-gray-400">{furniture.name}</div>
                            {furniture.isSelected && (
                              <>
                                <div className="absolute -left-2 -top-2 cursor-grab rounded-full bg-blue-500 p-1 text-white active:cursor-grabbing">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <button
                                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFurniture(furniture.id);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Overlay de IA processando */}
                      {isProcessingAI && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-50">
                          <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-6">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                            <p className="text-lg font-medium">Processando com nano-banana AI...</p>
                            <p className="text-sm text-gray-500">Aguarde alguns segundos</p>
                            <p className="text-xs text-gray-400">Powered by Replicate</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna direita - Catálogo */}
            <div className="flex w-96 flex-col border-l border-gray-200 bg-white animate-in slide-in-from-right duration-500">
              <div className="border-b border-gray-200 p-4">
                <div className="relative mb-4 animate-in fade-in slide-in-from-top duration-500 delay-100">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top duration-500 delay-200">
                  {CATEGORIES.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="text-xs"
                    >
                      {category !== 'Todos' && CATEGORY_ICONS[category]}
                      <span className={category !== 'Todos' ? 'ml-1' : ''}>{category}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {filteredProducts.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 animate-in fade-in duration-500">
                    <p>Nenhum produto encontrado</p>
                  </div>
                ) : (
                  filteredProducts.map((product, index) => (
                    <Card
                      key={product.id}
                      className="transition-shadow animate-in fade-in slide-in-from-right duration-300 hover:shadow-md"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-200">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex items-center justify-center">
                                {CATEGORY_ICONS[product.category] || <Sofa className="h-8 w-8 text-gray-400" />}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 truncate text-sm font-semibold">{product.name}</h3>
                            <p className="mb-2 text-xs text-gray-500">{product.category}</p>
                            <p className="mb-3 text-lg font-bold text-blue-600">
                              R${' '}
                              {product.price.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleAddFurniture(product)}
                              disabled={!uploadedImage || isProcessingAI || !isAuthenticated}
                            >
                              {isProcessingAI ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processando IA...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Adicionar ao ambiente
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

