'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Box, Sphere, Cylinder, useGLTF } from '@react-three/drei';
import { Mesh, Material, Object3D } from 'three';
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
  X
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
  model3D?: {
    modelUrl: string;
    previewUrl?: string;
    metadata?: any;
  };
}

interface ProductViewer3DProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

// Componente para carregar modelos GLTF reais com cores dinâmicas
function GLTFModel({ 
  modelUrl, 
  color 
}: { 
  modelUrl: string; 
  color: string; 
}) {
  const { scene } = useGLTF(modelUrl);
  const modelRef = useRef<any>(null);
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

  // Atualizar cores dinamicamente
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
        
        // Adicionar efeito de brilho baseado na cor
        child.material.emissive.setHex(colorHex);
        child.material.emissiveIntensity = 0.1;
        
        // Forçar atualização do material
        child.material.needsUpdate = true;
      }
    });
  }, [color, scene]);

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.2;
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
    <group ref={modelRef}>
      <primitive object={scene} />
    </group>
  );
}

// Componente para o modelo 3D do produto
function ProductModel({ product, color }: { product: Product; color: string }) {
  const meshRef = useRef<Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2; // Rotação automática suave
    }
  });

  // Função para obter a forma baseada na categoria
  const getProductShape = () => {
    switch (product.category?.toLowerCase()) {
      case 'tinta':
        return <Cylinder ref={meshRef} args={[1, 1, 2, 32]} />;
      case 'pincel':
        return <Cylinder ref={meshRef} args={[0.1, 0.1, 2, 8]} />;
      case 'rolo':
        return <Cylinder ref={meshRef} args={[0.8, 0.8, 0.3, 16]} />;
      case 'cadeira':
        return (
          <group ref={meshRef}>
            {/* Cadeira simplificada */}
            <Box args={[1.5, 0.1, 1.5]} position={[0, 0.5, 0]} />
            <Box args={[1.5, 1, 0.1]} position={[0, 1, -0.7]} />
            <Cylinder args={[0.05, 0.05, 1, 8]} position={[0.6, 0, 0.6]} />
            <Cylinder args={[0.05, 0.05, 1, 8]} position={[-0.6, 0, 0.6]} />
            <Cylinder args={[0.05, 0.05, 1.4, 8]} position={[0.6, 0.2, -0.6]} />
            <Cylinder args={[0.05, 0.05, 1.4, 8]} position={[-0.6, 0.2, -0.6]} />
          </group>
        );
      case 'acessório':
        return <Box ref={meshRef} args={[1, 0.5, 1]} />;
      default:
        return <Box ref={meshRef} args={[1, 1, 1]} />;
    }
  };

  // Verificar se há um modelo 3D real para carregar
  if (product.model3D?.modelUrl) {
    return (
      <Suspense fallback={
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#cccccc" />
        </mesh>
      }>
        <GLTFModel 
          modelUrl={product.model3D.modelUrl}
          color={color}
        />
      </Suspense>
    );
  }

  return (
    <group>
      {getProductShape()}
      <mesh ref={meshRef} castShadow receiveShadow>
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Componente de controles
function Controls({ 
  onReset, 
  onZoomIn, 
  onZoomOut, 
  onColorChange, 
  currentColor,
  availableColors 
}: {
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onColorChange: (color: string) => void;
  currentColor: string;
  availableColors: string[];
}) {
  return (
    <div className="absolute top-4 left-4 z-10 space-y-2">
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              title="Resetar visualização"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomIn}
              title="Aproximar"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomOut}
              title="Afastar"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600">Cores Dinâmicas:</div>
            <div className="max-h-24 overflow-y-auto">
              <div className="grid grid-cols-4 gap-1">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProductViewer3D({ product, isOpen, onClose }: ProductViewer3DProps) {
  const [currentColor, setCurrentColor] = useState(product.colorCode || '#3e2626');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsRef = useRef<any>(null);

  // Cores disponíveis baseadas no produto ou padrões
  const availableColors = product.colorCode 
    ? [product.colorCode, '#3e2626', '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460']
    : ['#3e2626', '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#F5DEB3'];

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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center ${
        isFullscreen ? 'p-0' : 'p-4'
      }`}
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-lg shadow-2xl ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-4xl h-[80vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#3e2626] rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
                <Badge 
                  variant={product.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {product.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-full">
          {/* 3D Viewer */}
          <div className="flex-1 relative">
            <Canvas
              shadows
              camera={{ position: [5, 5, 5], fov: 50 }}
              className="bg-gradient-to-br from-gray-100 to-gray-200"
            >
              {/* Iluminação */}
              <ambientLight intensity={0.4} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
              <pointLight position={[-10, -10, -10]} intensity={0.3} />

              {/* Ambiente */}
              <Environment preset="studio" />

              {/* Produto */}
              <ProductModel product={product} color={currentColor} />

              {/* Controles de câmera */}
              <OrbitControls
                ref={controlsRef}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                maxPolarAngle={Math.PI / 2}
                minDistance={2}
                maxDistance={10}
              />
            </Canvas>

            {/* Controles */}
            <Controls
              onReset={handleReset}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onColorChange={handleColorChange}
              currentColor={currentColor}
              availableColors={availableColors}
            />
          </div>

          {/* Informações do Produto */}
          <div className="w-80 border-l bg-gray-50 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Informações do Produto</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome</label>
                    <p className="text-gray-900">{product.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Categoria</label>
                    <p className="text-gray-900">{product.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Preço</label>
                    <p className="text-lg font-semibold text-[#3e2626]">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(product.price)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Estoque</label>
                    <p className="text-gray-900">{product.stock} unidades</p>
                  </div>
                  {product.brand && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Marca</label>
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
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Cores</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: currentColor }}
                    />
                    <span className="text-sm text-gray-700">{currentColor}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Clique nas cores acima para alterar a visualização
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Status do Estoque</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quantidade</span>
                    <span className="font-semibold">{product.stock}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        product.stock === 0 
                          ? 'bg-red-500' 
                          : product.stock < 10 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((product.stock / 50) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {product.stock === 0 
                      ? 'Sem estoque' 
                      : product.stock < 10 
                        ? 'Estoque baixo' 
                        : 'Em estoque'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
