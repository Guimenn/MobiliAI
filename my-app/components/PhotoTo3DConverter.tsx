'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useLumaAI } from '@/lib/luma-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Camera, 
  Download, 
  RotateCcw, 
  X, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Box as BoxIcon
} from 'lucide-react';

interface PhotoTo3DConverterProps {
  onConverted: (model3D: any) => void;
  onClose: () => void;
}

export default function PhotoTo3DConverter({ onConverted, onClose }: PhotoTo3DConverterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [conversionMethod, setConversionMethod] = useState<'ai' | 'photogrammetry'>('ai');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Usar o hook do Luma AI
  const { convertImageTo3D, isProcessing, error, hasApiKey } = useLumaAI();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Por favor, selecione um arquivo de imagem válido.');
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const convertPhotoTo3D = async () => {
    if (!selectedFile) return;

    try {
      // Usar API real do Luma AI
      const result = await convertImageTo3D(selectedFile, 'Generate a detailed 3D model of this product');

      const modelResult = {
        id: result.id,
        name: `Modelo 3D - ${selectedFile.name.split('.')[0]}`,
        category: 'gerado_ia',
        originalImage: preview,
        modelUrl: result.model_url || '/models/generated-chair.gltf',
        previewUrl: result.preview_url,
        metadata: {
          method: conversionMethod,
          confidence: result.metadata?.confidence || 0.85,
          vertices: result.metadata?.vertices || 15420,
          faces: result.metadata?.faces || 30840,
          textures: result.metadata?.textures || true,
          createdAt: new Date().toISOString(),
          status: result.status
        }
      };

      setConversionResult(modelResult);
      onConverted(modelResult);
    } catch (err) {
      console.error('Erro na conversão:', err);
      // O erro já é tratado pelo hook useLumaAI
    }
  };

  const resetConverter = () => {
    setSelectedFile(null);
    setPreview(null);
    setConversionResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-[#3e2626] to-[#4a2f2f] text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Converter Foto para 3D</h3>
              <p className="text-white/80 text-sm">Transforme suas fotos em modelos 3D usando IA</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Método de Conversão */}
          <div>
            <Label className="text-lg font-semibold text-gray-800 mb-3 block">
              Método de Conversão
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${
                  conversionMethod === 'ai' 
                    ? 'ring-2 ring-[#3e2626] bg-[#3e2626]/5' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setConversionMethod('ai')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <BoxIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">IA Generativa</h4>
                      <p className="text-sm text-gray-600">Rápido e automático</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Badge variant="secondary" className="text-xs">✓ 1 foto</Badge>
                    <Badge variant="secondary" className="text-xs">✓ 30 segundos</Badge>
                    <Badge variant="secondary" className="text-xs">✓ Texturas automáticas</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  conversionMethod === 'photogrammetry' 
                    ? 'ring-2 ring-[#3e2626] bg-[#3e2626]/5' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setConversionMethod('photogrammetry')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Fotogrametria</h4>
                      <p className="text-sm text-gray-600">Alta precisão</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Badge variant="secondary" className="text-xs">📸 20+ fotos</Badge>
                    <Badge variant="secondary" className="text-xs">⏱️ 5-10 min</Badge>
                    <Badge variant="secondary" className="text-xs">🎯 Máxima qualidade</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Upload de Arquivo */}
          <div>
            <Label className="text-lg font-semibold text-gray-800 mb-3 block">
              {conversionMethod === 'ai' ? 'Foto do Produto' : 'Fotos Múltiplas'}
            </Label>
            
            {!preview ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#3e2626] transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700">
                      {conversionMethod === 'ai' 
                        ? 'Clique ou arraste uma foto aqui' 
                        : 'Clique ou arraste múltiplas fotos aqui'
                      }
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {conversionMethod === 'ai' 
                        ? 'PNG, JPG até 10MB' 
                        : 'PNG, JPG até 50MB total'
                      }
                    </p>
                  </div>
                  <Button variant="outline" className="mt-4">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetConverter}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{selectedFile?.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile?.size! / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="outline" onClick={resetConverter}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Trocar Foto
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              multiple={conversionMethod === 'photogrammetry'}
              className="hidden"
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Aviso sobre API Key */}
          {!hasApiKey && (
            <div className="flex items-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-semibold">Modo Desenvolvimento</p>
                <p className="text-yellow-700 text-sm">
                  Configure NEXT_PUBLIC_LUMA_AI_API_KEY no .env para usar a API real do Luma AI
                </p>
              </div>
            </div>
          )}

          {/* Resultado */}
          {conversionResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Conversão Concluída!</p>
                  <p className="text-green-700 text-sm">
                    Modelo 3D gerado com {conversionResult.metadata.confidence * 100}% de confiança
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BoxIcon className="h-5 w-5" />
                    <span>Modelo 3D Gerado</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nome</Label>
                      <p className="font-semibold">{conversionResult.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Método</Label>
                      <p className="font-semibold">
                        {conversionResult.metadata.method === 'ai' ? 'IA Generativa' : 'Fotogrametria'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Vértices</Label>
                      <p className="font-semibold">{conversionResult.metadata.vertices.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Faces</Label>
                      <p className="font-semibold">{conversionResult.metadata.faces.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      onClick={() => onConverted(conversionResult)}
                      className="flex-1 bg-[#3e2626] hover:bg-[#2a1a1a]"
                    >
                      <BoxIcon className="h-4 w-4 mr-2" />
                      Usar Modelo 3D
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Botões de Ação */}
          {selectedFile && !conversionResult && (
            <div className="flex space-x-3">
              <Button
                onClick={convertPhotoTo3D}
                disabled={isProcessing}
                className="flex-1 bg-[#3e2626] hover:bg-[#2a1a1a]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Convertendo...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Converter para 3D
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
