'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '@/lib/store';
import { aiAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Camera, Home, Download, RotateCcw, Eye, Check, Sofa } from 'lucide-react';
import Image from 'next/image';

interface DetectedSpace {
  type: string;
  area: number;
  position: { x: number; y: number; width: number; height: number };
  confidence: number;
  suggestedFurniture: string[];
}

interface FurnitureAnalysis {
  id: string;
  imageUrl: string;
  detectedSpaces: DetectedSpace[];
  suggestedFurniture: {
    name: string;
    category: string;
    confidence: number;
    reason: string;
  }[];
  recommendedProducts: {
    productId: string;
    confidence: number;
    reason: string;
  }[];
  processedImageUrl?: string;
  createdAt: string;
}

export default function FurnitureVisualizer() {
  const { setCurrentAnalysis, addFurnitureAnalysis, setLoading, setError, isAuthenticated } = useAppStore();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFurniture, setSelectedFurniture] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<FurnitureAnalysis | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedDetectedSpace, setSelectedDetectedSpace] = useState<DetectedSpace | null>(null);
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
        setSelectedDetectedSpace(null);
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

  const handleAnalyzeSpaces = async () => {
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

      const analysisResult = await aiAPI.analyzeFurniture(file);
      setAnalysis(analysisResult);
      setCurrentAnalysis(analysisResult);
      addFurnitureAnalysis(analysisResult);
    } catch (error: any) {
      console.error('Erro ao analisar espaços:', error);
      setError(error.response?.data?.message || 'Erro ao analisar a imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleAddFurniture = async () => {
    if (!uploadedImage || !selectedFurniture || !selectedDetectedSpace || !isAuthenticated) {
      setError('Você precisa estar logado e selecionar um espaço e móvel para usar esta funcionalidade.');
      return;
    }

    try {
      setIsProcessing(true);
      setLoading(true);
      setError(null);
      
      console.log('🪑 Iniciando adição de móvel...');
      console.log('🎯 Espaço selecionado:', selectedDetectedSpace.type);
      console.log('🆕 Móvel escolhido:', selectedFurniture);
      
      // Convert data URL to File
      const response = await fetch(uploadedImage);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

      console.log('📤 Enviando requisição para adicionar móvel...');
      const result = await aiAPI.addFurniture(file, selectedDetectedSpace, selectedFurniture);
      
      console.log('📥 Resultado recebido:', result);
      console.log('🖼️ URL da imagem processada:', result.processedImageUrl);
      
      setAnalysis(result.analysis);
      setProcessedImage(result.processedImageUrl);
      setCurrentAnalysis(result.analysis);
      addFurnitureAnalysis(result.analysis);
      
      console.log('✅ Adição de móvel concluída com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao adicionar móvel:', error);
      setError(error.response?.data?.message || 'Erro ao processar a imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleSpaceClick = (space: DetectedSpace) => {
    setSelectedDetectedSpace(space);
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current || !analysis) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find the closest detected space based on position
    const closestSpace = analysis.detectedSpaces.reduce((closest, space) => {
      const distance = Math.sqrt(
        Math.pow(space.position.x - x, 2) + Math.pow(space.position.y - y, 2)
      );
      const closestDistance = Math.sqrt(
        Math.pow(closest.position.x - x, 2) + Math.pow(closest.position.y - y, 2)
      );
      return distance < closestDistance ? space : closest;
    });
    
    handleSpaceClick(closestSpace);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Visualizador de Móveis com IA
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
            Visualizador de Móveis com IA
          </h1>
          <p className="text-xl text-gray-600">
            Envie uma foto do seu ambiente e veja como ficará com diferentes móveis
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
                Faça upload de uma foto do ambiente que deseja decorar
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
                    onClick={handleAnalyzeSpaces}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    {isProcessing ? 'Analisando...' : 'Analisar Espaços'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Furniture Addition Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sofa className="mr-2 h-5 w-5" />
                Adicionar Móveis
              </CardTitle>
              <CardDescription>
                {selectedDetectedSpace 
                  ? `Adicionar móvel no espaço: ${selectedDetectedSpace.type}`
                  : analysis 
                    ? 'Clique em um espaço detectado abaixo para começar'
                    : 'Analise os espaços da imagem primeiro'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Espaços Detectados */}
              {analysis && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium flex items-center">
                      <Eye className="mr-2 h-4 w-4" />
                      Espaços Detectados na Imagem
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Clique em um espaço para selecioná-lo e adicionar móveis
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {analysis.detectedSpaces.map((space, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                          selectedDetectedSpace?.type === space.type
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleSpaceClick(space)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-lg border-2 border-white shadow-sm bg-green-100 flex items-center justify-center">
                              <Home className="h-5 w-5 text-green-600" />
                            </div>
                            {selectedDetectedSpace?.type === space.type && (
                              <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                                <Check className="h-2 w-2" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-sm truncate">{space.type}</p>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                {space.confidence > 0.8 ? 'Alta' : space.confidence > 0.6 ? 'Média' : 'Baixa'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              Área: {space.area.toFixed(1)}m²
                            </p>
                            <p className="text-xs text-gray-500">
                              Confiança: {(space.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção de Adição de Móveis */}
              {selectedDetectedSpace ? (
                <>
                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <Label htmlFor="furniture-select" className="text-sm font-medium">
                        Escolher Móvel
                      </Label>
                      <div className="mt-2">
                        <select
                          id="furniture-select"
                          value={selectedFurniture}
                          onChange={(e) => setSelectedFurniture(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Selecione um móvel...</option>
                          {selectedDetectedSpace.suggestedFurniture.map((furniture, index) => (
                            <option key={index} value={furniture}>
                              {furniture}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="text-sm font-medium text-blue-800 mb-2">
                        🪑 Espaço Selecionado: {selectedDetectedSpace.type}
                      </h5>
                      <p className="text-xs text-blue-700 mb-2">
                        Área: {selectedDetectedSpace.area.toFixed(1)}m² | 
                        Confiança: {(selectedDetectedSpace.confidence * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-blue-600">
                        Móveis sugeridos para este espaço: {selectedDetectedSpace.suggestedFurniture.join(', ')}
                      </p>
                    </div>

                    <Button
                      onClick={handleAddFurniture}
                      disabled={isProcessing || !selectedFurniture}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      {isProcessing ? 'Processando com IA...' : 'Adicionar Móvel'}
                    </Button>
                  </div>
                </>
              ) : analysis ? (
                <div className="text-center py-6 border-t">
                  <Home className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Selecione um espaço detectado acima para começar
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sofa className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    Analise os espaços da imagem primeiro para ver as opções de móveis
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
              Resultado da Adição de Móveis
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
                    Seu ambiente antes da adição de móveis
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
                  {selectedDetectedSpace && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Espaço selecionado:</span> {selectedDetectedSpace.type}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Área:</span> {selectedDetectedSpace.area.toFixed(1)}m²
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
                      <Sofa className="mr-2 h-5 w-5" />
                      Ambiente com Móveis
                    </CardTitle>
                    <CardDescription>
                      Resultado após adicionar móveis com IA
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full h-80 rounded-lg overflow-hidden border-2 border-blue-200">
                      <Image
                        src={processedImage}
                        alt="Ambiente com móveis"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Móvel adicionado:</span> {selectedFurniture}
                      </p>
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Processamento:</span> OpenAI + IA
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sofa className="mr-2 h-5 w-5" />
                      Ambiente com Móveis
                    </CardTitle>
                    <CardDescription>
                      Resultado aparecerá aqui após processar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full h-80 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center">
                        <Sofa className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">
                          O ambiente com móveis aparecerá aqui
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Suggested Furniture */}
        {analysis && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Móveis Sugeridos</CardTitle>
              <CardDescription>
                Recomendações baseadas na análise do ambiente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {analysis.suggestedFurniture.map((furniture, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">{furniture.name}</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Categoria:</span> {furniture.category}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Confiança:</span> {(furniture.confidence * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">{furniture.reason}</p>
                    </div>
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
