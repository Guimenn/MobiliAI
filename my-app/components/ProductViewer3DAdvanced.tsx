'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  Text, 
  Box, 
  Sphere, 
  Cylinder,
  Torus,
  Octahedron,
  Icosahedron,
  PresentationControls,
  ContactShadows,
  Html,
  useProgress,
  useGLTF
} from '@react-three/drei';
import { Mesh, Vector3, Material, Object3D } from 'three';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Palette, 
  Eye, 
  EyeOff,
  Maximize2,
  Minimize2,
  X,
  Lightbulb,
  Sun,
  Moon,
  Camera,
  Play,
  Pause,
  RotateCw,
  Box as BoxIcon
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  color?: string;
  colorCode?: string;
  description?: string;
  brand?: string;
  stock: number;
  isActive: boolean;
  model3DUrl?: string;
  model3D?: {
    modelUrl: string;
    previewUrl?: string;
    metadata?: any;
  };
}

interface ProductViewer3DAdvancedProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

// Componente de loading para fora do Canvas
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center z-10">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-[#3e2626] rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">Carregando Visualização 3D</p>
          <p className="text-sm text-gray-500">Preparando ambiente 3D...</p>
        </div>
      </div>
    </div>
  );
}

// Componente de loading para dentro do Canvas
function CanvasLoader() {
  const { active, progress } = useProgress();
  if (!active) return null;
  
  return (
    <Html center>
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#3e2626] rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">Carregando modelo 3D</p>
          <p className="text-xs text-gray-500">{Math.round(progress)}% concluído</p>
        </div>
      </div>
    </Html>
  );
}

// Componente para modelos 3D mais complexos
// Componente para carregar modelos GLTF reais com cores dinâmicas
function GLTFModel({ 
  modelUrl, 
  color, 
  autoRotate 
}: { 
  modelUrl: string; 
  color: string; 
  autoRotate: boolean;
}) {
  const { scene } = useGLTF(modelUrl);
  const modelRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);

  // Preparar materiais para mudança dinâmica de cores
  useEffect(() => {
    const clonedScene = scene.clone();
    const materialList: Material[] = [];
    
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        materialList.push(child.material);
      }
    });
    
    setMaterials(materialList);
  }, [scene]);

  // Atualizar cores dinamicamente com efeitos especiais
  useEffect(() => {
    const colorHex = parseInt(color.replace('#', ''), 16);
    
    // Atualizar materiais da cena diretamente
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        // Clonar material para evitar conflitos
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material.clone();
        }
        
        // Aplicar nova cor
        child.material.color.setHex(colorHex);
        
        // Efeitos especiais baseados na cor
        if (color === '#FF6B6B' || color === '#E74C3C') {
          // Vermelho - efeito de calor
          child.material.emissive.setHex(0xFF4444);
          child.material.emissiveIntensity = 0.2;
        } else if (color === '#4ECDC4' || color === '#45B7D1') {
          // Azul - efeito de gelo
          child.material.emissive.setHex(0x4444FF);
          child.material.emissiveIntensity = 0.15;
        } else if (color === '#F1C40F' || color === '#FFEAA7') {
          // Amarelo - efeito dourado
          child.material.emissive.setHex(0xFFDD44);
          child.material.emissiveIntensity = 0.3;
        } else if (color === '#9B59B6' || color === '#BB8FCE') {
          // Roxo - efeito mágico
          child.material.emissive.setHex(0x8844FF);
          child.material.emissiveIntensity = 0.25;
        } else {
          // Cor padrão
          child.material.emissive.setHex(colorHex);
          child.material.emissiveIntensity = 0.1;
        }
        
        // Adicionar reflexo baseado na cor
        child.material.metalness = color === '#34495E' ? 0.8 : 0.2;
        child.material.roughness = color === '#34495E' ? 0.1 : 0.4;
        
        // Forçar atualização do material
        child.material.needsUpdate = true;
      }
    });
  }, [color, scene]);

  useFrame((state, delta) => {
    if (modelRef.current && autoRotate) {
      modelRef.current.rotation.y += delta * 0.3;
      modelRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
    }
    
    if (hovered && modelRef.current) {
      modelRef.current.scale.lerp(new Vector3(1.1, 1.1, 1.1), 0.1);
    } else if (modelRef.current) {
      modelRef.current.scale.lerp(new Vector3(1, 1, 1), 0.1);
    }
    
    // Forçar atualização das cores a cada frame para garantir que funcionem
    const colorHex = parseInt(color.replace('#', ''), 16);
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        // Aplicar cor apenas se for diferente da atual
        if (child.material.color.getHex() !== colorHex) {
          child.material.color.setHex(colorHex);
          child.material.needsUpdate = true;
        }
      }
    });
  });

  return (
    <group 
      ref={modelRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive 
        object={scene} 
        onClick={() => {
          // Debug: log para verificar se o clique está funcionando
          console.log('Modelo clicado, cor atual:', color);
        }}
      />
    </group>
  );
}

function AdvancedProductModel({ product, color, autoRotate }: { 
  product: Product; 
  color: string; 
  autoRotate: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
    }
    
    if (hovered && meshRef.current) {
      meshRef.current.scale.lerp(new Vector3(1.1, 1.1, 1.1), 0.1);
    } else if (meshRef.current) {
      meshRef.current.scale.lerp(new Vector3(1, 1, 1), 0.1);
    }
  });

  // Função para obter formas mais complexas baseadas na categoria
  const getAdvancedProductShape = () => {
    switch (product.category?.toLowerCase()) {
      case 'tinta':
        return (
          <group>
            <Cylinder args={[1.2, 1, 2.5, 32]} />
            <Box args={[0.3, 2.6, 0.3]} position={[0, 0, 1.2]} />
          </group>
        );
      case 'pincel':
        return (
          <group>
            <Cylinder args={[0.15, 0.1, 2.5, 8]} />
            <Cylinder args={[0.3, 0.3, 0.8, 8]} position={[0, 1.65, 0]} />
          </group>
        );
      case 'rolo':
        return (
          <group>
            <Cylinder args={[1, 1, 0.4, 16]} />
            <Cylinder args={[0.15, 0.15, 1.5, 8]} position={[0, 0, 0]} />
          </group>
        );
      case 'cadeira':
        return (
          <group>
            {/* Assento */}
            <Box args={[1.8, 0.1, 1.8]} position={[0, 0.5, 0]} />
            
            {/* Encosto */}
            <Box args={[1.8, 1.2, 0.1]} position={[0, 1.1, -0.85]} />
            
            {/* Pernas da frente */}
            <Cylinder args={[0.05, 0.05, 1, 8]} position={[0.75, 0, 0.75]} />
            <Cylinder args={[0.05, 0.05, 1, 8]} position={[-0.75, 0, 0.75]} />
            
            {/* Pernas de trás */}
            <Cylinder args={[0.05, 0.05, 1.8, 8]} position={[0.75, 0.4, -0.75]} />
            <Cylinder args={[0.05, 0.05, 1.8, 8]} position={[-0.75, 0.4, -0.75]} />
            
            {/* Apoios laterais do encosto */}
            <Box args={[0.1, 0.8, 0.1]} position={[0.85, 1.1, -0.4]} />
            <Box args={[0.1, 0.8, 0.1]} position={[-0.85, 1.1, -0.4]} />
            
            {/* Apoios dos braços (opcional) */}
            <Box args={[0.1, 0.6, 0.8]} position={[0.95, 0.8, 0]} />
            <Box args={[0.1, 0.6, 0.8]} position={[-0.95, 0.8, 0]} />
            
            {/* Conectores dos braços */}
            <Box args={[0.1, 0.1, 0.1]} position={[0.95, 0.5, 0.75]} />
            <Box args={[0.1, 0.1, 0.1]} position={[-0.95, 0.5, 0.75]} />
          </group>
        );
      case 'acessório':
        return (
          <group>
            <Box args={[1.2, 0.6, 1.2]} />
            <Box args={[0.8, 0.2, 0.8]} position={[0, 0.4, 0]} />
          </group>
        );
      case 'kit':
        return (
          <group>
            <Box args={[2, 1, 1.5]} />
            <Sphere args={[0.3, 16, 16]} position={[-0.5, 0.7, 0]} />
            <Cylinder args={[0.2, 0.2, 0.8, 8]} position={[0.5, 0.5, 0]} />
          </group>
        );
      default:
        return <Octahedron args={[1, 0]} />;
    }
  };

  // Verificar se há um modelo 3D real para carregar
  const modelUrl = product.model3DUrl || product.model3D?.modelUrl;
  if (modelUrl) {
    return (
      <Suspense fallback={
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#cccccc" />
        </mesh>
      }>
        <GLTFModel 
          modelUrl={modelUrl}
          color={color}
          autoRotate={autoRotate}
        />
      </Suspense>
    );
  }

  return (
    <group>
      <mesh 
        ref={meshRef}
        castShadow 
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {getAdvancedProductShape()}
        <meshStandardMaterial 
          color={color} 
          metalness={0.2} 
          roughness={0.4}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.1 : 0}
        />
      </mesh>
    </group>
  );
}

// Componente de controles avançados
function AdvancedControls({ 
  onReset, 
  onZoomIn, 
  onZoomOut, 
  onColorChange, 
  currentColor,
  availableColors,
  lightingMode,
  onLightingChange,
  autoRotate,
  onAutoRotateToggle
}: {
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onColorChange: (color: string) => void;
  currentColor: string;
  availableColors: string[];
  lightingMode: string;
  onLightingChange: (mode: string) => void;
  autoRotate: boolean;
  onAutoRotateToggle: () => void;
}) {
  return (
    <div className="absolute top-4 left-4 z-10 space-y-2">
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-800">Controles 3D</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Controles de câmera */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600">Câmera</div>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                title="Resetar visualização"
                className="flex-1"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onZoomIn}
                title="Aproximar"
                className="flex-1"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onZoomOut}
                title="Afastar"
                className="flex-1"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Controles de animação */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600">Animação</div>
            <Button
              variant={autoRotate ? "default" : "outline"}
              size="sm"
              onClick={onAutoRotateToggle}
              className="w-full"
            >
              {autoRotate ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
              {autoRotate ? 'Pausar' : 'Rotação'}
            </Button>
          </div>

          {/* Controles de iluminação */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600">Iluminação</div>
            <div className="flex space-x-1">
              <Button
                variant={lightingMode === 'studio' ? "default" : "outline"}
                size="sm"
                onClick={() => onLightingChange('studio')}
                title="Estúdio"
                className="flex-1"
              >
                <Lightbulb className="h-3 w-3" />
              </Button>
              <Button
                variant={lightingMode === 'sunset' ? "default" : "outline"}
                size="sm"
                onClick={() => onLightingChange('sunset')}
                title="Pôr do sol"
                className="flex-1"
              >
                <Sun className="h-3 w-3" />
              </Button>
              <Button
                variant={lightingMode === 'night' ? "default" : "outline"}
                size="sm"
                onClick={() => onLightingChange('night')}
                title="Noite"
                className="flex-1"
              >
                <Moon className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Controles de cores */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600">Cores Dinâmicas</div>
            <div className="max-h-32 overflow-y-auto">
              <div className="grid grid-cols-5 gap-1">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onColorChange(color)}
                    className={`w-5 h-5 rounded-full border-2 ${
                      currentColor === color ? 'border-gray-800 scale-110 shadow-lg' : 'border-gray-300'
                    } transition-all duration-200 hover:scale-105 hover:shadow-md`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {availableColors.length} cores disponíveis
            </div>
            <div className="text-xs text-green-600 mt-1 font-medium">
              ✓ Troca de cores ativa para modelos 3D
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de informações do produto
function ProductInfo({ product, currentColor }: { product: Product; currentColor: string }) {
  return (
    <div className="w-80 border-l bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h4 className="text-xl font-bold text-gray-900 mb-3">Informações do Produto</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Nome</label>
              <p className="text-gray-900 text-lg">{product.name}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Categoria</label>
              <p className="text-gray-900">{product.category}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Preço</label>
              <p className="text-2xl font-bold text-[#3e2626]">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(product.price)}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Estoque</label>
              <p className="text-gray-900 text-lg">{product.stock} unidades</p>
            </div>
            {product.brand && (
              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Marca</label>
                <p className="text-gray-900">{product.brand}</p>
              </div>
            )}
          </div>
        </div>

        {product.description && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h4>
            <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
          </div>
        )}

        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Visualização Atual</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div 
                className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: currentColor }}
              />
              <div>
                <p className="font-semibold text-gray-900">Cor Selecionada</p>
                <p className="text-sm text-gray-600">{currentColor}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
              💡 Dica: Passe o mouse sobre o produto 3D para ver efeitos de iluminação
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Status do Estoque</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Quantidade</span>
              <span className="font-bold text-lg">{product.stock}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  product.stock === 0 
                    ? 'bg-red-500' 
                    : product.stock < 10 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((product.stock / 50) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">0</span>
              <span className={`font-semibold ${
                product.stock === 0 
                  ? 'text-red-600' 
                  : product.stock < 10 
                    ? 'text-yellow-600' 
                    : 'text-green-600'
              }`}>
                {product.stock === 0 
                  ? 'Sem estoque' 
                  : product.stock < 10 
                    ? 'Estoque baixo' 
                    : 'Em estoque'
                }
              </span>
              <span className="text-gray-500">50+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductViewer3DAdvanced({ product, isOpen, onClose }: ProductViewer3DAdvancedProps) {
  const [currentColor, setCurrentColor] = useState(product.colorCode || '#3e2626');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lightingMode, setLightingMode] = useState('studio');
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef<any>(null);

  // Cores disponíveis expandidas para troca dinâmica
  const availableColors = product.colorCode 
    ? [
        product.colorCode, '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F39C12', '#E74C3C', '#9B59B6', '#3498DB', '#2ECC71', '#F1C40F',
        '#E67E22', '#1ABC9C', '#34495E', '#E91E63', '#FF9800', '#795548',
        '#607D8B', '#8BC34A', '#3e2626', '#8B4513', '#A0522D', '#CD853F'
      ]
    : [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', 
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F39C12', '#E74C3C',
        '#9B59B6', '#3498DB', '#2ECC71', '#F1C40F', '#E67E22', '#1ABC9C',
        '#34495E', '#E91E63', '#FF9800', '#795548', '#607D8B', '#8BC34A',
        '#3e2626', '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460'
      ];

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(0.5);
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyOut(0.5);
    }
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
  };

  const handleLightingChange = (mode: string) => {
    setLightingMode(mode);
  };

  const handleAutoRotateToggle = () => {
    setAutoRotate(!autoRotate);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center ${
        isFullscreen ? 'p-0' : 'p-4'
      }`}
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl overflow-hidden ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[85vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BoxIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{product.name}</h3>
              <div className="flex items-center space-x-3 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {product.category}
                </Badge>
                <Badge 
                  variant={product.isActive ? "default" : "destructive"}
                  className="text-xs"
                >
                  {product.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
                <Badge variant="outline" className="text-xs border-white/30 text-white">
                  3D Viewer
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-full">
          {/* 3D Viewer */}
          <div className="flex-1 relative">
            <Suspense fallback={<LoadingOverlay />}>
              <Canvas
                shadows
                camera={{ position: [6, 6, 6], fov: 45 }}
                className="bg-gradient-to-br from-blue-50 via-white to-purple-50"
              >
                {/* Iluminação dinâmica baseada no modo selecionado */}
                {lightingMode === 'studio' && (
                  <>
                    <ambientLight intensity={0.4} />
                    <directionalLight
                      position={[10, 10, 5]}
                      intensity={1.2}
                      castShadow
                      shadow-mapSize={[2048, 2048]}
                    />
                    <pointLight position={[-10, -10, -10]} intensity={0.3} />
                  </>
                )}
                {lightingMode === 'sunset' && (
                  <>
                    <ambientLight intensity={0.3} />
                    <directionalLight
                      position={[-5, 5, 5]}
                      intensity={0.8}
                      color="#FF6B35"
                      castShadow
                    />
                    <pointLight position={[5, 5, -5]} intensity={0.5} color="#FFD700" />
                  </>
                )}
                {lightingMode === 'night' && (
                  <>
                    <ambientLight intensity={0.1} />
                    <directionalLight
                      position={[0, 10, 0]}
                      intensity={0.5}
                      color="#4A90E2"
                      castShadow
                    />
                    <pointLight position={[-5, 5, 5]} intensity={0.8} color="#87CEEB" />
                    <pointLight position={[5, -5, -5]} intensity={0.3} color="#9370DB" />
                  </>
                )}

                {/* Ambiente */}
                <Environment preset={lightingMode === 'studio' ? 'studio' : lightingMode === 'sunset' ? 'sunset' : 'night'} />

                {/* Produto */}
                <AdvancedProductModel product={product} color={currentColor} autoRotate={autoRotate} />
                
                {/* Loader interno */}
                <CanvasLoader />

                {/* Sombras de contato */}
                <ContactShadows 
                  position={[0, -2, 0]} 
                  opacity={0.4} 
                  scale={10} 
                  blur={2} 
                  far={4.5} 
                />

                {/* Controles de câmera */}
                <OrbitControls
                  ref={controlsRef}
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  maxPolarAngle={Math.PI / 2}
                  minDistance={3}
                  maxDistance={15}
                  dampingFactor={0.05}
                />
              </Canvas>
            </Suspense>

            {/* Controles */}
            <AdvancedControls
              onReset={handleReset}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onColorChange={handleColorChange}
              currentColor={currentColor}
              availableColors={availableColors}
              lightingMode={lightingMode}
              onLightingChange={handleLightingChange}
              autoRotate={autoRotate}
              onAutoRotateToggle={handleAutoRotateToggle}
            />
          </div>

          {/* Informações do Produto */}
          <ProductInfo product={product} currentColor={currentColor} />
        </div>
      </div>
    </div>
  );
}
