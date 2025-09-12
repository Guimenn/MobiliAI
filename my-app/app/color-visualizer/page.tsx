'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '@/lib/store';
import { aiAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Camera, Palette, Download, RotateCcw, Eye, Check } from 'lucide-react';
import Image from 'next/image';

interface DetectedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
  position: { x: number; y: number };
  wallScore?: number;
  isWall?: boolean;
  variations?: Array<{
    key: string;
    rgb: { r: number; g: number; b: number };
    count: number;
    wallScore?: number;
  }>;
}

interface ColorAnalysis {
  id: string;
  imageUrl: string;
  detectedColors: DetectedColor[];
  suggestedPalettes: {
    name: string;
    colors: string[];
    harmony: string;
  }[];
  recommendedProducts: {
    productId: string;
    confidence: number;
    reason: string;
  }[];
  processedImageUrl?: string;
  createdAt: string;
}

export default function ColorVisualizer() {
  const { setCurrentAnalysis, addColorAnalysis, setLoading, setError, isAuthenticated } = useAppStore();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('#FF5733');
  const [targetColor, setTargetColor] = useState('#FF5733');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<ColorAnalysis | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedDetectedColor, setSelectedDetectedColor] = useState<DetectedColor | null>(null);
  const [tolerance, setTolerance] = useState(80); // Tolerância padrão
  const imageRef = useRef<HTMLImageElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        // Reset analysis when new image is uploaded
        setAnalysis(null);
        setProcessedImage(null);
        setSelectedDetectedColor(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  const handleAnalyzeColors = async () => {
    if (!uploadedImage || !isAuthenticated) {
      setError('Você precisa estar logado para usar esta funcionalidade.');
      return;
    }

    try {
      setIsProcessing(true);
      setLoading(true);
      setError(null);
      
      // Convert data URL to File
      const response = await fetch(uploadedImage);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

      const analysisResult = await aiAPI.analyzeColors(file);
      setAnalysis(analysisResult);
      setCurrentAnalysis(analysisResult);
      addColorAnalysis(analysisResult);
    } catch (error: any) {
      console.error('Erro ao analisar cores:', error);
      setError(error.response?.data?.message || 'Erro ao analisar a imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleReplaceColor = async () => {
    if (!uploadedImage || !targetColor || !selectedColor || !isAuthenticated) {
      setError('Você precisa estar logado e selecionar as cores para usar esta funcionalidade.');
      return;
    }

    try {
      setIsProcessing(true);
      setLoading(true);
      setError(null);
      
      console.log('🎨 Iniciando troca de cor...');
      console.log('🎯 Cor alvo:', targetColor);
      console.log('🆕 Nova cor:', selectedColor);
      
      // Convert data URL to File
      const response = await fetch(uploadedImage);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

      console.log('📤 Enviando requisição para troca de cor...');
      console.log('🎯 Tolerância selecionada:', tolerance);
      const result = await aiAPI.replaceColor(file, targetColor, selectedColor, tolerance);
      
      console.log('📥 Resultado recebido:', result);
      console.log('🖼️ URL da imagem processada:', result.processedImageUrl);
      
      setAnalysis(result.analysis);
      setProcessedImage(result.processedImageUrl);
      setCurrentAnalysis(result.analysis);
      addColorAnalysis(result.analysis);
      
      console.log('✅ Troca de cor concluída com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao trocar cor:', error);
      setError(error.response?.data?.message || 'Erro ao processar a imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleColorClick = (color: DetectedColor) => {
    setSelectedDetectedColor(color);
    setTargetColor(color.hex);
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current || !analysis) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find the closest detected color based on position
    const closestColor = analysis.detectedColors.reduce((closest, color) => {
      const distance = Math.sqrt(
        Math.pow(color.position.x - x, 2) + Math.pow(color.position.y - y, 2)
      );
      const closestDistance = Math.sqrt(
        Math.pow(closest.position.x - x, 2) + Math.pow(closest.position.y - y, 2)
      );
      return distance < closestDistance ? color : closest;
    });
    
    handleColorClick(closestColor);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Visualizador de Cores com IA
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Você precisa estar logado para usar esta funcionalidade
          </p>
          <Button asChild>
            <a href="/login">Fazer Login</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Visualizador de Cores com IA
          </h1>
          <p className="text-xl text-gray-600">
            Envie uma foto da sua parede e veja como ficará com diferentes cores
          </p>
        </div>

        {/* Error Message */}
        {useAppStore.getState().error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{useAppStore.getState().error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="mr-2 h-5 w-5" />
                Upload da Imagem
              </CardTitle>
              <CardDescription>
                Faça upload de uma foto da parede que deseja pintar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                {uploadedImage ? (
                  <div className="space-y-4">
                    <div className="relative w-full h-64 rounded-lg overflow-hidden">
                      <Image
                        ref={imageRef}
                        src={uploadedImage}
                        alt="Imagem enviada"
                        fill
                        className="object-cover cursor-crosshair"
                        onClick={handleImageClick}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setUploadedImage(null)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Trocar Imagem
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-lg font-medium">
                        {isDragActive
                          ? 'Solte a imagem aqui'
                          : 'Arraste uma imagem ou clique para selecionar'}
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG, WEBP até 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {uploadedImage && (
                <div className="mt-6 space-y-4">
                  <Button
                    onClick={handleAnalyzeColors}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    {isProcessing ? 'Analisando...' : 'Analisar Cores'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Color Replacement Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Trocar Cores
              </CardTitle>
              <CardDescription>
                {selectedDetectedColor 
                  ? `Substituir ${selectedDetectedColor.hex} por uma nova cor`
                  : analysis 
                    ? 'Clique em uma cor detectada abaixo para começar'
                    : 'Analise as cores da imagem primeiro'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cores Detectadas - Integradas */}
              {analysis && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium flex items-center">
                      <Eye className="mr-2 h-4 w-4" />
                      Cores Detectadas na Imagem
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Clique em uma cor para selecioná-la e trocar por uma nova cor
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {analysis.detectedColors.map((color, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                          selectedDetectedColor?.hex === color.hex
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : color.isWall
                            ? 'border-green-200 hover:border-green-300 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleColorClick(color)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div
                              className="w-10 h-10 rounded-lg border-2 border-white shadow-sm"
                              style={{ backgroundColor: color.hex }}
                            />
                            {selectedDetectedColor?.hex === color.hex && (
                              <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                                <Check className="h-2 w-2" />
                              </div>
                            )}
                            {color.isWall && (
                              <div className="absolute -bottom-1 -left-1 bg-green-500 text-white rounded-full p-1">
                                <span className="text-xs font-bold">P</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-sm truncate">{color.hex}</p>
                              {color.isWall && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                  Parede
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                            </p>
                            <p className="text-xs text-gray-500">
                              {color.percentage.toFixed(1)}% da imagem
                            </p>
                            {color.wallScore !== undefined && (
                              <p className="text-xs text-gray-400">
                                Score parede: {(color.wallScore * 100).toFixed(0)}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção de Troca de Cores */}
              {selectedDetectedColor ? (
                <>
                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <Label htmlFor="target-color" className="text-sm font-medium">
                        Cor Original (Selecionada)
                      </Label>
                      <div className="flex items-center space-x-3 mt-2 p-3 bg-gray-50 rounded-lg">
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                          style={{ backgroundColor: targetColor }}
                        />
                        <div className="flex-1">
                          <Input
                            id="target-color"
                            value={targetColor}
                            onChange={(e) => setTargetColor(e.target.value)}
                            className="font-mono text-sm"
                            readOnly
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedDetectedColor.percentage.toFixed(1)}% da imagem
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="new-color" className="text-sm font-medium">
                        Nova Cor
                      </Label>
                      <div className="flex items-center space-x-3 mt-2 p-3 bg-blue-50 rounded-lg">
                        <Input
                          id="new-color"
                          type="color"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-12 h-12 p-1 rounded-lg border-2 border-white shadow-sm"
                        />
                        <div className="flex-1">
                          <Input
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="font-mono text-sm"
                            placeholder="#000000"
                          />
                          <p className="text-xs text-blue-600 mt-1">
                            Escolha a cor que deseja aplicar
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aviso para cores não-parede */}
                  {selectedDetectedColor && !selectedDetectedColor.isWall && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-600">⚠️</span>
                        <div>
                          <h5 className="text-sm font-medium text-yellow-800">
                            Cor não identificada como parede
                          </h5>
                          <p className="text-xs text-yellow-700 mt-1">
                            Esta cor pode ser de reflexo, chão ou outro objeto. 
                            O sistema prioriza substituir apenas cores de parede para evitar alterações indesejadas.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Controle de Tolerância */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Label htmlFor="tolerance" className="text-sm font-medium">
                      🎯 Tolerância de Detecção
                    </Label>
                    <p className="text-xs text-gray-600 mb-3">
                      Ajuste a sensibilidade para capturar mais variações da cor (maior = mais agressivo)
                    </p>
                    <div className="space-y-2">
                      <input
                        id="tolerance"
                        type="range"
                        min="40"
                        max="150"
                        value={tolerance}
                        onChange={(e) => setTolerance(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Conservador (40)</span>
                        <span className="font-medium text-blue-600">{tolerance}</span>
                        <span>Agressivo (150)</span>
                      </div>
                    </div>
                  </div>

                  {/* Informações sobre variações de iluminação */}
                  {selectedDetectedColor.variations && selectedDetectedColor.variations.length > 1 && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="text-sm font-medium text-blue-800 mb-2">
                        🎨 Variações de Iluminação Detectadas
                      </h5>
                      <p className="text-xs text-blue-700 mb-3">
                        O sistema detectou {selectedDetectedColor.variations.length} variações desta cor devido à iluminação. 
                        {selectedDetectedColor.isWall 
                          ? ` Com tolerância ${tolerance}, apenas as variações de parede serão substituídas uniformemente.`
                          : ` ⚠️ Esta cor não é identificada como parede, então pode não ser substituída completamente.`
                        }
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedDetectedColor.variations.slice(0, 6).map((variation, index) => (
                          <div
                            key={index}
                            className={`w-5 h-5 rounded border border-white shadow-sm ${
                              variation.wallScore && variation.wallScore > 0.5 ? 'ring-2 ring-green-400' : ''
                            }`}
                            style={{ 
                              backgroundColor: `rgb(${variation.rgb.r}, ${variation.rgb.g}, ${variation.rgb.b})` 
                            }}
                            title={`Variação ${index + 1}: ${variation.rgb.r}, ${variation.rgb.g}, ${variation.rgb.b}${variation.wallScore ? ` (Parede: ${(variation.wallScore * 100).toFixed(0)}%)` : ''}`}
                          />
                        ))}
                        {selectedDetectedColor.variations.length > 6 && (
                          <div className="w-5 h-5 rounded border border-white shadow-sm bg-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{selectedDetectedColor.variations.length - 6}</span>
                          </div>
                        )}
                      </div>
                      {selectedDetectedColor.isWall && (
                        <p className="text-xs text-green-700 mt-2">
                          ✅ Cores com anel verde são identificadas como parede e serão substituídas
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleReplaceColor}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {isProcessing ? 'Processando com IA...' : 'Aplicar Nova Cor'}
                  </Button>
                </>
              ) : analysis ? (
                <div className="text-center py-6 border-t">
                  <Palette className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Selecione uma cor detectada acima para começar a troca
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Palette className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    Analise as cores da imagem primeiro para ver as opções de troca
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>


        {/* Results Section */}
        {analysis && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Resultado da Troca de Cores
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Original Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="mr-2 h-5 w-5" />
                    Imagem Original
                  </CardTitle>
                  <CardDescription>
                    Sua imagem antes da troca de cores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-80 rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                      src={uploadedImage!}
                      alt="Imagem original"
                      fill
                      className="object-cover"
                    />
                  </div>
                  {selectedDetectedColor && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Cor detectada:</span> {selectedDetectedColor.hex}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Área:</span> {selectedDetectedColor.percentage.toFixed(1)}% da imagem
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Processed Image */}
              {processedImage ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Palette className="mr-2 h-5 w-5" />
                      Imagem Processada
                    </CardTitle>
                    <CardDescription>
                      Resultado após aplicar a nova cor com IA
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full h-80 rounded-lg overflow-hidden border-2 border-blue-200">
                      <Image
                        src={processedImage}
                        alt="Imagem processada"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Nova cor aplicada:</span> {selectedColor}
                      </p>
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Processamento:</span> OpenAI + Sharp
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Palette className="mr-2 h-5 w-5" />
                      Imagem Processada
                    </CardTitle>
                    <CardDescription>
                      Resultado aparecerá aqui após processar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full h-80 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center">
                        <Palette className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">
                          A imagem processada aparecerá aqui
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Suggested Palettes */}
        {analysis && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Paletas Sugeridas</CardTitle>
              <CardDescription>
                Combinações harmoniosas baseadas nas cores detectadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {analysis.suggestedPalettes.map((palette, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">{palette.name}</h4>
                    <div className="flex space-x-2 mb-2">
                      {palette.colors.map((color, colorIndex) => (
                        <div
                          key={colorIndex}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 capitalize">{palette.harmony}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
