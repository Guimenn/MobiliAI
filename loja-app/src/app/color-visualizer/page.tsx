'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { 
  Upload, 
  Camera, 
  Palette, 
  Download, 
  RotateCcw, 
  Eye,
  Sparkles,
  Image,
  Wand2,
  ShoppingCart,
  Heart,
  Share2
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'cashier' | 'customer';
  storeId?: string;
}

interface ColorPalette {
  id: string;
  name: string;
  hex: string;
  rgb: string;
  price: number;
  brand: string;
  finish: string;
  coverage: string;
}

export default function ColorVisualizerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [detectedColors, setDetectedColors] = useState<ColorPalette[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock color palette data
  const colorPalette: ColorPalette[] = [
    {
      id: 'color1',
      name: 'Branco Gelo',
      hex: '#F8F9FA',
      rgb: '248, 249, 250',
      price: 89.90,
      brand: 'ColorMax',
      finish: 'Fosco',
      coverage: '16m²/L'
    },
    {
      id: 'color2',
      name: 'Azul Royal',
      hex: '#1E40AF',
      rgb: '30, 64, 175',
      price: 125.50,
      brand: 'Premium Paint',
      finish: 'Brilhante',
      coverage: '12m²/L'
    },
    {
      id: 'color3',
      name: 'Verde Menta',
      hex: '#10B981',
      rgb: '16, 185, 129',
      price: 95.80,
      brand: 'Nature Colors',
      finish: 'Fosco',
      coverage: '15m²/L'
    },
    {
      id: 'color4',
      name: 'Rosa Pink',
      hex: '#EC4899',
      rgb: '236, 72, 153',
      price: 78.90,
      brand: 'Kids Color',
      finish: 'Fosco',
      coverage: '18m²/L'
    },
    {
      id: 'color5',
      name: 'Cinza Moderno',
      hex: '#6B7280',
      rgb: '107, 114, 128',
      price: 92.40,
      brand: 'Urban Paint',
      finish: 'Fosco',
      coverage: '14m²/L'
    },
    {
      id: 'color6',
      name: 'Amarelo Sol',
      hex: '#F59E0B',
      rgb: '245, 158, 11',
      price: 85.60,
      brand: 'Sunny Colors',
      finish: 'Brilhante',
      coverage: '16m²/L'
    }
  ];

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('loja-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('loja-user');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setProcessedImage(null);
        setDetectedColors([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // Simular captura da câmera
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setIsLoading(true);

    try {
      // Simular processamento com IA
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simular detecção de cores
      const mockDetectedColors = colorPalette.slice(0, 4);
      setDetectedColors(mockDetectedColors);
      
      // Simular imagem processada
      setProcessedImage(selectedImage);
      
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      alert('Erro ao processar imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  };

  const applyColorToImage = (color: ColorPalette) => {
    setSelectedColor(color.hex);
    // Aqui seria implementada a lógica de aplicar a cor na imagem
    // Por enquanto, apenas simular
    console.log('Aplicando cor:', color);
  };

  const resetVisualizer = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setSelectedColor(null);
    setDetectedColors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadResult = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.download = 'resultado-pintura.jpg';
      link.href = processedImage;
      link.click();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa fazer login para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mr-4">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Visualizador de Cores IA</h1>
              <p className="text-gray-600">Veja como ficará sua parede antes de pintar</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Enviar Imagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Envie uma foto da sua parede
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Tire uma foto ou faça upload de uma imagem para visualizar as cores
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Escolher Arquivo
                          </Button>
                          <Button 
                            onClick={handleCameraCapture}
                            variant="outline"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Usar Câmera
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={selectedImage} 
                        alt="Imagem selecionada" 
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <Button
                        onClick={resetVisualizer}
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={processImage}
                        disabled={isProcessing}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processando...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Analisar com IA
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Color Palette */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Paleta de Cores Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {colorPalette.map(color => (
                    <div
                      key={color.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                      onClick={() => applyColorToImage(color)}
                    >
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-gray-200"
                        style={{ backgroundColor: color.hex }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {color.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {color.brand} • R$ {color.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Processed Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="mr-2 h-5 w-5" />
                    Resultado
                  </div>
                  {processedImage && (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={downloadResult}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-4 w-4 mr-1" />
                        Compartilhar
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processedImage ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={processedImage} 
                        alt="Resultado processado" 
                        className="w-full h-64 object-cover rounded-lg"
                        style={{
                          filter: selectedColor ? `hue-rotate(${Math.random() * 360}deg)` : 'none'
                        }}
                      />
                      {selectedColor && (
                        <div className="absolute top-2 left-2 flex items-center space-x-2 bg-white rounded-lg p-2 shadow-md">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: selectedColor }}
                          ></div>
                          <span className="text-sm font-medium">Cor aplicada</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Comprar Tinta
                      </Button>
                      <Button variant="outline">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aguardando processamento
                    </h3>
                    <p className="text-gray-600">
                      Envie uma imagem e clique em "Analisar com IA" para ver o resultado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detected Colors */}
            {detectedColors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Cores Detectadas pela IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {detectedColors.map(color => (
                      <div
                        key={color.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-full border-2 border-gray-200"
                            style={{ backgroundColor: color.hex }}
                          ></div>
                          <div>
                            <p className="font-medium text-gray-900">{color.name}</p>
                            <p className="text-sm text-gray-600">
                              {color.brand} • {color.finish} • {color.coverage}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">
                            R$ {color.price.toFixed(2)}
                          </p>
                          <Button size="sm" className="mt-1">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Comprar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Dicas para Melhor Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Boa Iluminação</h4>
                  <p className="text-sm text-gray-600">
                    Tire a foto com boa iluminação natural para melhor precisão das cores
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Ângulo Correto</h4>
                  <p className="text-sm text-gray-600">
                    Mantenha a câmera perpendicular à parede para evitar distorções
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Superfície Limpa</h4>
                  <p className="text-sm text-gray-600">
                    Certifique-se de que a parede esteja limpa e sem objetos na frente
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
