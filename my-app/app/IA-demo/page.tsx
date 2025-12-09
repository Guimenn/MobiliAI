'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import { env } from '@/lib/env';
import { useAppStore } from '@/lib/store';
import Link from 'next/link';
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
  Users,
  Table,
  BookOpen,
  Lamp,
  Frame,
  Package,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';

import { Loader } from '@/components/ui/ai/loader';
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
  processedImageUrl: string | null;
  uploadedImage: string | null;
}

// Mock data do catálogo
const CATEGORIES = ['Todos', 'Sofás', 'Cadeiras', 'Mesas', 'Estantes', 'Poltronas', 'Quadros', 'Luminárias', 'Mesa de centro'];

// Mapear categorias da API para categorias do catálogo
const mapCategory = (category: string): string => {
  if (!category) return 'Outros';
  
  const categoryMap: Record<string, string> = {
    // Categorias principais (maiúsculas do banco - SOFA, MESA, etc.)
    'sofa': 'Sofás',
    'cadeira': 'Cadeiras',
    'mesa': 'Mesas',
    'estante': 'Estantes',
    'poltrona': 'Poltronas',
    'quadro': 'Quadros',
    'luminaria': 'Luminárias',
    'luminária': 'Luminárias',
    'mesa_centro': 'Mesa de centro',
    'mesacentro': 'Mesa de centro',
    // Variações comuns
    'sofa_retratil': 'Sofás',
    'cadeira_escritorio': 'Cadeiras',
    'mesa_jantar': 'Mesas',
    'mesa_escritorio': 'Mesas',
  };
  
  // Normalizar: remover espaços, converter para minúsculas, tratar underscores
  let normalized = category.trim().toLowerCase();
  
  // Remover acentos para melhor matching
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // Tentar encontrar no mapa diretamente
  if (categoryMap[normalized]) {
    return categoryMap[normalized];
  }
  
  // Tentar com underscores substituídos por espaços
  const withUnderscores = normalized.replace(/\s+/g, '_');
  if (categoryMap[withUnderscores]) {
    return categoryMap[withUnderscores];
  }
  
  // Tentar sem underscores
  const withoutUnderscore = normalized.replace(/_/g, '');
  if (categoryMap[withoutUnderscore]) {
    return categoryMap[withoutUnderscore];
  }
  
  // Tentar match parcial (ex: "SOFA" -> "sofa")
  const partialMatch = Object.keys(categoryMap).find(key => 
    normalized.includes(key) || key.includes(normalized)
  );
  if (partialMatch) {
    return categoryMap[partialMatch];
  }
  
  // Fallback: retornar categoria formatada
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Sofás: <Sofa className="h-5 w-5" />,
  Cadeiras: <Users className="h-5 w-5" />,
  Mesas: <Table className="h-5 w-5" />,
  Estantes: <BookOpen className="h-5 w-5" />,
  Poltronas: <Sofa className="h-5 w-5" />,
  Quadros: <Frame className="h-5 w-5" />,
  Luminárias: <Lamp className="h-5 w-5" />,
  'Mesa de centro': <Package className="h-5 w-5" />,
};

const MAX_FREE_REQUESTS = 3;
const STORAGE_KEY = 'ia_demo_request_count';

export default function TestAIPage() {
  const { setLoading, isAuthenticated } = useAppStore();
  
  // Contador de requisições (apenas para usuários não autenticados)
  const [requestCount, setRequestCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Verificar se atingiu o limite
  const hasReachedLimit = !isAuthenticated && requestCount >= MAX_FREE_REQUESTS;

  // Função para incrementar contador
  const incrementRequestCount = () => {
    if (!isAuthenticated) {
      const newCount = requestCount + 1;
      setRequestCount(newCount);
      try {
        localStorage.setItem(STORAGE_KEY, newCount.toString());
      } catch {
        // Ignorar erros de localStorage
      }
    }
  };
  
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
  
  // Estado para seleção de posição
  const [pendingFurniture, setPendingFurniture] = useState<FurnitureItem | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<{ x: number; y: number } | null>(null);
  const [isSelectingPosition, setIsSelectingPosition] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Buscar produtos reais
  const { products: allProducts } = useProducts();

  // Histórico para Undo/Redo
  const [history, setHistory] = useState<HistoryState[]>([{ 
    furniture: [], 
    processedImageUrl: null, 
    uploadedImage: uploadedImage 
  }]);
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
      // Nossa IA pode processar diferentes tipos de arquivo
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


  // Iniciar seleção de posição
  const handleStartAddFurniture = (furniture: FurnitureItem) => {
    if (!uploadedImageFile) {
      setError('Você precisa ter um arquivo carregado.');
      return;
    }

    if (hasReachedLimit) {
      setError('Você atingiu o limite de 3 requisições gratuitas. Faça login para continuar usando.');
      return;
    }
    
    setPendingFurniture(furniture);
    setIsSelectingPosition(true);
    setSelectedPosition(null);
    setError(null);
    setSuccessMessage('Clique na imagem para escolher onde colocar o móvel');
  };

  // Cancelar seleção de posição
  const handleCancelPositionSelection = () => {
    setPendingFurniture(null);
    setIsSelectingPosition(false);
    setSelectedPosition(null);
    setSuccessMessage(null);
  };

  // Adicionar móvel ao ambiente - COM Nossa IA
  const handleAddFurniture = async (furniture: FurnitureItem, position?: { x: number; y: number }) => {
    if (!uploadedImageFile) {
      setError('Você precisa ter um arquivo carregado.');
      return;
    }

    if (hasReachedLimit) {
      setError('Você atingiu o limite de 3 requisições gratuitas. Faça login para continuar usando.');
      return;
    }

    try {
      setIsProcessingAI(true);
      setError(null);
      setLoading(true);
      setIsSelectingPosition(false);

      // Calcular posição: usar a selecionada ou calcular centralizada
      const calculatePosition = (): { x: number; y: number } => {
        if (position) {
          // Usar posição selecionada pelo usuário
          return position;
        }

        // Fallback: posição centralizada
        if (!imageRef.current || !canvasRef.current) {
          return { x: 200, y: 200 };
        }

        const imgRect = imageRef.current.getBoundingClientRect();
        const canvasRect = canvasRef.current.getBoundingClientRect();
        
        if (!canvasRect) return { x: 200, y: 200 };

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
      let productImageUrl = furniture.imageUrl || furniture.image || '';
      
      // Se não tem imageUrl, tentar imageUrls
      if (!productImageUrl && furniture.imageUrls && furniture.imageUrls.length > 0) {
        productImageUrl = furniture.imageUrls[0];
      }
      
      if (!productImageUrl) {
        throw new Error(`Produto ${furniture.name} não possui imagem. Por favor, selecione um produto com imagem.`);
      }

      
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
        
        const productFile = new File([blob], `product-${furniture.id}-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`, { 
          type: blob.type || 'image/jpeg' 
        });
        
            productFiles.push(productFile);
     
        } catch (err) {
        console.error('❌ Erro ao carregar imagem do produto:', err);
        throw new Error(`Não foi possível carregar a imagem do produto ${furniture.name}. Verifique se a URL da imagem está acessível.`);
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
        
        positionDescription = `\n\nPOSIÇÃO ESPECÍFICA: Coloque o móvel na região ${region} da imagem (aproximadamente ${Math.round(relativeX)}% da esquerda, ${Math.round(relativeY)}% do topo).`;
      }

      // Criar prompt detalhado que ESPECIFICA usar a imagem do produto enviada
      const prompt = `IMPORTANTE: Use EXATAMENTE a imagem do produto que foi enviada como arquivo adicional. 

Adicione o ${furniture.name} (${furniture.category.toLowerCase()}) desta imagem de produto na sala de forma realista e natural.${positionDescription}

REQUISITOS OBRIGATÓRIOS:
- Use a imagem EXATA do produto que foi enviada, não invente ou substitua por outro produto
- O móvel deve estar perfeitamente integrado ao ambiente com iluminação e sombras corretas
- Perspectiva adequada que respeita o ponto de vista da foto original
- Proporções realistas em relação aos outros elementos da sala
- Texturas e materiais que combinam com o ambiente
- Sem distorções ou artefatos visuais
- O móvel deve parecer que realmente está na sala, como se tivesse sido fotografado no local

NÃO invente um produto diferente. Use APENAS a imagem do produto que foi enviada.`;

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

      // Validar que temos a imagem do produto antes de enviar
      if (productFiles.length === 0) {
        throw new Error('Erro: Imagem do produto não foi carregada. Por favor, tente novamente.');
      }

 

      // Chamar nossa IA - usar endpoint público para demo
      const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
      const formData = new FormData();
      formData.append('images', environmentFile);
      productFiles.forEach((productFile) => {
        formData.append('images', productFile);
      });
      formData.append('prompt', prompt);
      formData.append('outputFormat', 'jpg');

      // Usar endpoint público que não exige autenticação
      const response = await fetch(`${apiBaseUrl}/public/ai/process-upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao processar imagem' }));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.imageUrl) {
        // Incrementar contador de requisições (apenas para não autenticados)
        incrementRequestCount();
        
        // Atualizar imagem processada
        setProcessedImageUrl(result.imageUrl);
        setUploadedImage(result.imageUrl);
        
        // Adicionar móvel à lista
        setPlacedFurniture((prev) => {
          const currentState = { 
            furniture: [...prev],
            processedImageUrl: processedImageUrl,
            uploadedImage: uploadedImage
          };
          
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
          const newImageUrl = result.imageUrl;
          
          // Atualizar histórico
          setHistory((prevHistory) => {
            const newHistory = prevHistory.slice(0, historyIndex + 1);
            newHistory.push(currentState);
            newHistory.push({ 
              furniture: updated,
              processedImageUrl: newImageUrl,
              uploadedImage: newImageUrl
            });
            setHistoryIndex(newHistory.length - 1);
            return newHistory;
          });
          
          return updated;
        });
        
        setSelectedFurniture(null);
        setPendingFurniture(null);
        setSelectedPosition(null);
        setSuccessMessage(`${furniture.name} adicionado com IA!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(result.error || 'Erro ao processar imagem com IA');
      }
    } catch (error: unknown) {
      console.error('Erro ao adicionar móvel com IA:', error);
      
      // Verificar se é erro de autenticação (mas não redirecionar)
      const errorResponse = error as { response?: { status?: number; data?: { message?: string } } };
      const isAuthError = errorResponse?.response?.status === 401;
      
      let errorMessage = 'Erro ao processar imagem com IA. Tente novamente.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (errorResponse?.response?.data?.message) {
        errorMessage = errorResponse.response.data.message;
      }
      
      // Se for erro de autenticação, mostrar mensagem específica mas não bloquear
      if (isAuthError) {
        errorMessage = 'Erro ao processar. A requisição pode ter falhado. Tente novamente.';
      }
      
      setError(errorMessage);
      setPendingFurniture(null);
      setIsSelectingPosition(false);
    } finally {
      setIsProcessingAI(false);
      setLoading(false);
    }
  };

  // Handler para clicar na imagem e selecionar posição
  const handleImageClickForPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelectingPosition || !pendingFurniture || !imageRef.current || !canvasRef.current) {
      return;
    }

    e.stopPropagation();
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();
    
    if (!canvasRect || !imgRect) return;

    // Calcular posição relativa à imagem
    const imgOffsetX = imgRect.left - canvasRect.left;
    const imgOffsetY = imgRect.top - canvasRect.top;
    
    const clickX = e.clientX - canvasRect.left;
    const clickY = e.clientY - canvasRect.top;
    
    // Verificar se o clique foi dentro da imagem
    if (clickX >= imgOffsetX && clickX <= imgOffsetX + imgRect.width &&
        clickY >= imgOffsetY && clickY <= imgOffsetY + imgRect.height) {
      
      // Posição relativa à imagem (ajustar para o centro do móvel)
      const position = {
        x: clickX - 75, // Ajustar para o centro do móvel (150px / 2)
        y: clickY - 75,
      };
      
      setSelectedPosition(position);
      setSuccessMessage('Posição selecionada! Processando com IA...');
      
      // Processar automaticamente após selecionar posição
      setTimeout(() => {
        handleAddFurniture(pendingFurniture, position);
      }, 500);
    }
  };

  // Gerenciamento de histórico
  const addToHistory = useCallback(() => {
    const currentState = { 
      furniture: [...placedFurniture],
      processedImageUrl: processedImageUrl,
      uploadedImage: uploadedImage
    };
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex, placedFurniture, processedImageUrl, uploadedImage]);

  const handleUndo = () => {
    if (historyIndex > 0 && history.length > 0) {
      const prevState = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setPlacedFurniture(prevState.furniture);
      if (prevState.processedImageUrl !== null) {
        setProcessedImageUrl(prevState.processedImageUrl);
      }
      if (prevState.uploadedImage !== null) {
        setUploadedImage(prevState.uploadedImage);
      }
      setSelectedFurniture(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && history.length > 0) {
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setPlacedFurniture(nextState.furniture);
      if (nextState.processedImageUrl !== null) {
        setProcessedImageUrl(nextState.processedImageUrl);
      }
      if (nextState.uploadedImage !== null) {
        setUploadedImage(nextState.uploadedImage);
      }
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

  // Auto posicionar IA - usando nossa IA para otimizar posições
  const handleAutoPosition = async () => {
    if (!uploadedImageFile || placedFurniture.length === 0) {
      setError('Você precisa ter um arquivo carregado e móveis adicionados.');
      return;
    }

    if (hasReachedLimit) {
      setError('Você atingiu o limite de 3 requisições gratuitas. Faça login para continuar usando.');
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

      // Chamar nossa IA para auto-posicionar - usar endpoint público
      const apiBaseUrl = env.API_URL.endsWith('/api') ? env.API_URL : `${env.API_URL}/api`;
      const formData = new FormData();
      formData.append('images', environmentFile);
      formData.append('prompt', prompt);
      formData.append('outputFormat', 'jpg');

      // Usar endpoint público que não exige autenticação
      const response = await fetch(`${apiBaseUrl}/public/ai/process-upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao processar imagem' }));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.imageUrl) {
        // Incrementar contador de requisições (apenas para não autenticados)
        incrementRequestCount();
        
        // Atualizar imagem processada pela IA
        setProcessedImageUrl(result.imageUrl);
        if (result.imageUrl.startsWith('http')) {
          setUploadedImage(result.imageUrl);
        }
        
        addToHistory();
        // A imagem já foi reprocessada pela IA com móveis reposicionados
        setSuccessMessage('Móveis reposicionados pela nossa IA!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(result.error || 'Erro ao processar imagem com IA');
      }
    } catch (error: unknown) {
      console.error('Erro ao reposicionar móveis com IA:', error);
      
      // Verificar se é erro de autenticação (mas não redirecionar)
      const errorResponse = error as { response?: { status?: number; data?: { message?: string } } };
      const isAuthError = errorResponse?.response?.status === 401;
      
      let errorMessage = 'Erro ao processar imagem com IA. Tente novamente.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (errorResponse?.response?.data?.message) {
        errorMessage = errorResponse.response.data.message;
      }
      
      // Se for erro de autenticação, mostrar mensagem específica mas não bloquear
      if (isAuthError) {
        errorMessage = 'Erro ao processar. A requisição pode ter falhado. Tente novamente.';
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessingAI(false);
      setLoading(false);
    }
  };

  // Salvar imagem - faz download direto da imagem
  const handleSaveImage = async () => {
    // Usar a imagem processada pela IA se disponível, senão a original
    const imageToSave = processedImageUrl || uploadedImage;
    if (!imageToSave) return;

    try {
      let blob: Blob;
      
      // Se for data URL, converter diretamente para blob
      if (imageToSave.startsWith('data:')) {
        const response = await fetch(imageToSave);
        blob = await response.blob();
      } else {
        // Se for URL externa, buscar e converter para blob
        const response = await fetch(imageToSave);
        if (!response.ok) {
          throw new Error('Erro ao buscar imagem');
        }
        blob = await response.blob();
      }
      
      // Criar URL temporária do blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Criar link de download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `ambiente-decorado-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      
      // Limpar
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      
      setSuccessMessage('Imagem salva com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      setError('Erro ao salvar imagem. Tente novamente.');
    }
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

  // Click no canvas para deselecionar ou selecionar posição
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSelectingPosition) {
      handleImageClickForPosition(e);
      return;
    }
    
    setSelectedFurniture(null);
    setPlacedFurniture(placedFurniture.map((f) => ({ ...f, isSelected: false })));
  };

  return (
    <>
      {/* Navbar */}
      <Header />
      
      <div className="flex flex-col bg-white pt-[120px] sm:pt-[140px] md:pt-[160px] lg:pt-[180px]" style={{ minHeight: '100vh' }}>
        {/* Banner de limite atingido */}
        {hasReachedLimit && (
          <div className="sticky top-[120px] sm:top-[140px] md:top-[160px] lg:top-[180px] z-40 bg-yellow-50 border-b-2 border-yellow-400 shadow-md">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 shrink-0 mt-0.5 sm:mt-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-yellow-900">
                      Limite de requisições gratuitas atingido
                    </p>
                    <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                      Você usou {MAX_FREE_REQUESTS} requisições gratuitas. Faça login para continuar usando o Visualizador de Móveis com IA.
                    </p>
                  </div>
                </div>
                <Button 
                  className="bg-[#3e2626] hover:bg-[#4f3223] text-white shrink-0 w-full sm:w-auto text-sm sm:text-base"
                  asChild
                >
                  <Link href="/login">Fazer Login</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Header com ferramentas */}
        <div 
          className=" z-30 bg-white shadow-sm border-b border-[#3e2626]/10 top-[120px] sm:top-[140px] md:top-[160px] lg:top-[180px]" 
          style={hasReachedLimit ? { 
            top: 'calc(120px + 60px)' 
          } : {}}
        >
          {/* Mensagem de seleção de posição */}
          {isSelectingPosition && pendingFurniture && (
            <div className="bg-[#C07A45]/10 border-b border-[#C07A45]/30 px-3 sm:px-4 py-2">
              <div className="container mx-auto flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Sparkles className="h-4 w-4 text-[#C07A45] animate-pulse shrink-0" />
                  <p className="text-xs sm:text-sm font-medium text-[#3e2626] truncate">
                    <span className="font-semibold">Clique na imagem</span> para escolher onde colocar: <span className="text-[#C07A45]">{pendingFurniture.name}</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelPositionSelection}
                  className="text-[#3e2626] hover:bg-[#C07A45]/20 h-7 px-2 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-[#C07A45] shrink-0" />
                <h1 className="text-base sm:text-lg lg:text-xl font-black text-[#3e2626]">Visualizador de Móveis com IA</h1>
                {!isAuthenticated && (
                  <div className="ml-2 sm:ml-4 px-2 sm:px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[10px] sm:text-xs font-medium text-blue-700 shrink-0">
                    {MAX_FREE_REQUESTS - requestCount} restantes
                  </div>
                )}
              </div>
              {uploadedImage && (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyIndex === 0} className="border-[#3e2626]/20 text-[#3e2626] hover:bg-[#3e2626]/10 h-8 w-8 sm:h-9 sm:w-9 p-0">
                    <Undo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRedo}
                    disabled={historyIndex === history.length - 1}
                    className="border-[#3e2626]/20 text-[#3e2626] hover:bg-[#3e2626]/10 h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <Redo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <div className="mx-1 sm:mx-2 h-5 sm:h-6 w-px bg-[#3e2626]/20" />
                  {selectedFurniture && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleRotate('left')} className="border-[#3e2626]/20 text-[#3e2626] hover:bg-[#3e2626]/10 h-8 w-8 sm:h-9 sm:w-9 p-0">
                        <RotateCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-[-90]" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRotate('right')} className="border-[#3e2626]/20 text-[#3e2626] hover:bg-[#3e2626]/10 h-8 w-8 sm:h-9 sm:w-9 p-0">
                        <RotateCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleScale('out')} className="border-[#3e2626]/20 text-[#3e2626] hover:bg-[#3e2626]/10 h-8 w-8 sm:h-9 sm:w-9 p-0">
                        <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-180" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleScale('in')} className="border-[#3e2626]/20 text-[#3e2626] hover:bg-[#3e2626]/10 h-8 w-8 sm:h-9 sm:w-9 p-0">
                        <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {uploadedImage && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button onClick={handleSaveImage} className="bg-[#3e2626] hover:bg-[#4f3223] text-white text-sm sm:text-base w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Salvar imagem</span>
                  <span className="sm:hidden">Salvar</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mensagens de erro/sucesso */}
        {error && (
          <div className="container mx-auto px-3 sm:px-4">
            <div className="mt-2 flex items-start sm:items-center gap-2 border-l-4 border-red-500 bg-red-50 px-3 sm:px-4 py-2 sm:py-3 rounded-r-lg">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-xs sm:text-sm text-red-700 flex-1 break-words">{error}</p>
              <Button variant="ghost" size="icon" onClick={() => setError(null)} className="ml-auto h-6 w-6 sm:h-7 sm:w-7 hover:bg-red-100 shrink-0">
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="container mx-auto px-3 sm:px-4">
            <div className="mt-2 flex items-start sm:items-center gap-2 border-l-4 border-[#C07A45] bg-[#F7C194]/20 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[#3e2626] rounded-r-lg animate-in slide-in-from-top">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#C07A45] shrink-0 mt-0.5 sm:mt-0" />
              <p className="flex-1 break-words">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Conteúdo principal - 2 colunas */}
        <div className="flex-1 pb-4 sm:pb-6">
          <div
            className="container mx-auto flex flex-col lg:flex-row lg:h-full lg:overflow-hidden px-2 sm:px-4"
          >
            {/* Coluna esquerda - Canvas */}
            <div className="flex flex-1 flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-[#3e2626]/10 bg-white min-h-[250px] sm:min-h-[300px] md:min-h-[400px] lg:min-h-0 lg:h-full">
              {!uploadedImage ? (
                <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 min-h-[250px] sm:min-h-[300px]">
                  <Card className="w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-500 border-[#3e2626]/20 bg-white shadow-xl">
                    <CardContent className="p-4 sm:p-6 lg:p-8">
                      <div
                        {...getRootProps()}
                        className={`cursor-pointer rounded-2xl sm:rounded-3xl border-2 border-dashed p-6 sm:p-8 lg:p-12 text-center transition-all ${
                          isDragActive ? 'border-[#C07A45] bg-[#F7C194]/20 scale-105' : 'border-[#3e2626]/30 hover:border-[#C07A45] hover:bg-white'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <Upload className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-16 sm:w-16 text-[#C07A45]" />
                        <p className="mb-2 text-base sm:text-lg font-semibold text-[#3e2626]">
                          {isDragActive ? 'Solte a imagem aqui' : 'Arraste sua foto aqui ou clique para enviar'}
                        </p>
                        <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-[#4f3a2f]/70">
                          Aceita qualquer tipo de arquivo - imagens serão processadas com nossa IA
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              open();
                            }}
                            className="border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626]/10 w-full sm:w-auto"
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
                            className="border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626]/10 w-full sm:w-auto"
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
                <div className="relative flex flex-1 overflow-auto bg-white animate-in fade-in duration-500">
                  <div
                    ref={canvasRef}
                    className={`relative flex min-h-full items-center justify-center p-2 sm:p-4 lg:p-8 ${
                      isSelectingPosition ? 'cursor-crosshair' : 'cursor-default'
                    }`}
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
                  >
                    <div className="relative max-h-full max-w-full animate-in zoom-in-95 duration-500">
                      {(processedImageUrl || uploadedImage) ? (
                        <Image
                          ref={imageRef}
                          src={processedImageUrl || uploadedImage || ''}
                          alt="Ambiente"
                          width={1024}
                          height={768}
                          className="h-auto max-w-full rounded-lg shadow-2xl"
                          style={{ maxHeight: 'calc(100vh - clamp(250px, 30vh, 350px))' }}
                          unoptimized
                        />
                      ) : uploadedImageFile ? (
                        <div className="rounded-lg bg-gray-100 p-12 text-center">
                          <p className="mb-4 text-gray-600">Arquivo carregado: {uploadedImageFile.name}</p>
                          <p className="text-sm text-gray-500">Adicione um móvel para processar com IA</p>
                        </div>
                      ) : null}

                      {/* Overlay de seleção de posição */}
                      {/* Overlay sutil para indicar modo de seleção - não bloqueia a interação */}
                      {isSelectingPosition && !isProcessingAI && (
                        <div className="absolute inset-0 rounded-lg border-2 border-dashed border-[#C07A45]/50 bg-[#C07A45]/5 pointer-events-none z-10" />
                      )}

                      {/* Indicador de hover (posição do mouse) */}
                      {hoverPosition && isSelectingPosition && !isProcessingAI && !selectedPosition && (
                        <div
                          className="absolute z-20 pointer-events-none"
                          style={{
                            left: `${hoverPosition.x}px`,
                            top: `${hoverPosition.y}px`,
                            width: '120px',
                            height: '120px',
                          }}
                        >
                          <div className="relative w-full h-full border-2 border-[#C07A45] border-dashed rounded-lg bg-[#C07A45]/5">
                            <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#C07A45]/80 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-sm max-w-[200px] truncate">
                              {pendingFurniture?.name}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Indicador de posição selecionada */}
                      {selectedPosition && isSelectingPosition && !isProcessingAI && imageRef.current && canvasRef.current && (
                        <div
                          className="absolute z-20 pointer-events-none"
                          style={{
                            left: `${selectedPosition.x}px`,
                            top: `${selectedPosition.y}px`,
                            width: '120px',
                            height: '120px',
                          }}
                        >
                          <div className="relative w-full h-full border-2 sm:border-4 border-[#C07A45] border-dashed rounded-lg bg-[#C07A45]/10 animate-pulse">
                            <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#C07A45] text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold max-w-[200px] truncate">
                              {pendingFurniture?.name}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Overlay de IA processando */}
                      {isProcessingAI && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#3e2626]/80 backdrop-blur-sm z-50">
                          <div className="flex flex-col items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 lg:p-8 shadow-2xl border border-[#3e2626]/20 mx-4">
                            <Loader size={40} className="sm:w-12 sm:h-12 text-[#C07A45]" />
                            <p className="text-base sm:text-lg font-semibold text-[#3e2626] text-center">Processando com nossa IA...</p>
                            <p className="text-xs sm:text-sm text-[#4f3a2f]/70 text-center">Aguarde alguns segundos</p>
                           
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna direita - Catálogo */}
            <div className="flex w-full lg:w-96 flex-col border-t lg:border-t-0 lg:border-l border-[#3e2626]/10 bg-white animate-in slide-in-from-right duration-500 flex-shrink-0 lg:flex-shrink">
              <div className="border-b border-[#3e2626]/10 p-3 sm:p-4 bg-white sticky top-0 z-20 shrink-0">
                <div className="relative mb-3 sm:mb-4 animate-in fade-in slide-in-from-top duration-500 delay-100">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-[#4f3a2f]/50" />
                  <Input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-[#3e2626]/20 focus:border-[#C07A45] focus:ring-[#C07A45]/20 bg-white text-sm sm:text-base"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 animate-in fade-in slide-in-from-top duration-500 delay-200 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                  {CATEGORIES.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={`text-[10px] sm:text-xs shrink-0 ${
                        selectedCategory === category
                          ? 'bg-[#3e2626] hover:bg-[#4f3223] text-white'
                          : 'border-[#3e2626]/30 text-[#3e2626] hover:bg-[#3e2626]/10'
                      }`}
                    >
                      {category !== 'Todos' && <span className="mr-1">{CATEGORY_ICONS[category]}</span>}
                      <span>{category}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-3 sm:space-y-4 overflow-y-auto p-3 sm:p-4 min-h-[350px] sm:min-h-[450px] md:min-h-[550px] lg:min-h-0">
                {filteredProducts.length === 0 ? (
                  <div className="py-6 sm:py-8 text-center text-[#4f3a2f]/60 animate-in fade-in duration-500">
                    <p className="text-sm sm:text-base">Nenhum produto encontrado</p>
                  </div>
                ) : (
                  filteredProducts.map((product, index) => (
                    <Card
                      key={product.id}
                      className="transition-all animate-in fade-in slide-in-from-right duration-300 hover:shadow-lg border-[#3e2626]/10 hover:border-[#C07A45]/30"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white border border-[#3e2626]/10">
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
                                {CATEGORY_ICONS[product.category] || <Package className="h-6 w-6 sm:h-8 sm:w-8 text-[#4f3a2f]/40" />}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 truncate text-xs sm:text-sm font-semibold text-[#3e2626]">{product.name}</h3>
                            <p className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs text-[#4f3a2f]/70">{product.category}</p>
                            <p className="mb-2 sm:mb-3 text-base sm:text-lg font-bold text-[#C07A45]">
                              R${' '}
                              {product.price.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                            <Button
                              size="sm"
                              className="w-full bg-[#3e2626] hover:bg-[#4f3223] text-white text-xs sm:text-sm"
                              onClick={() => handleStartAddFurniture(product)}
                              disabled={!uploadedImage || isProcessingAI || isSelectingPosition || hasReachedLimit}
                              title={hasReachedLimit ? 'Faça login para continuar usando' : ''}
                            >
                              {isProcessingAI ? (
                                <>
                                  <Loader size={14} className="sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                  <span className="hidden sm:inline">Processando IA...</span>
                                  <span className="sm:hidden">Processando...</span>
                                </>
                              ) : isSelectingPosition && pendingFurniture?.id === product.id ? (
                                <>
                                  <Loader size={14} className="sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                  <span className="hidden sm:inline">Selecionando posição...</span>
                                  <span className="sm:hidden">Selecionando...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  <span className="hidden sm:inline">Adicionar ao ambiente</span>
                                  <span className="sm:hidden">Adicionar</span>
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