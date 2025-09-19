'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '@/lib/store';
import { aiAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Camera, Palette, Download, RotateCcw, Eye, Check, Wand2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function AIProcessor() {
  const { setLoading, setError, isAuthenticated } = useAppStore();
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [outputFormat, setOutputFormat] = useState('jpg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    imageUrl?: string;
    localFile?: string;
    message?: string;
    error?: string;
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setResult(null);
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

  const handleProcessUrl = async () => {
    if (!imageUrl || !prompt || !isAuthenticated) {
      setError('URL da imagem, prompt e login são obrigatórios.');
      return;
    }

    try {
      setIsProcessing(true);
      setLoading(true);
      setError(null);
      
      const result = await aiAPI.processImageWithUrl({
        prompt,
        imageUrl,
        outputFormat
      });
      
      setResult(result);
    } catch (error: any) {
      console.error('Erro ao processar imagem:', error);
      setError(error.response?.data?.message || 'Erro ao processar a imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleProcessUpload = async () => {
    if (!uploadedImage || !prompt || !isAuthenticated) {
      setError('Imagem, prompt e login são obrigatórios.');
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

      const result = await aiAPI.processImageWithUpload({
        file,
        prompt,
        outputFormat
      });
      
      setResult(result);
    } catch (error: any) {
      console.error('Erro ao processar imagem:', error);
      setError(error.response?.data?.message || 'Erro ao processar a imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const setExampleUrl = (url: string) => {
    setImageUrl(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🍌 Processador de Imagens com IA
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🍌 Processador de Imagens com IA
          </h1>
          <p className="text-xl text-gray-600">
            Processe suas imagens com IA usando a API do Replicate
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

        <Card>
          <CardHeader>
            <div className="flex space-x-1 border-b">
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'url'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('url')}
              >
                📷 URL da Imagem
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('upload')}
              >
                📁 Upload de Arquivo
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tab URL */}
            {activeTab === 'url' && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="imageUrl">URL da Imagem:</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="urlPrompt">Prompt (o que você quer fazer com a imagem):</Label>
                  <textarea
                    id="urlPrompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: troque a cor para vermelho, adicione um gato, transforme em desenho..."
                    className="mt-2 w-full p-3 border border-gray-300 rounded-lg resize-vertical min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="urlFormat">Formato de saída:</Label>
                  <select
                    id="urlFormat"
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="mt-2 w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>

                <Button
                  onClick={handleProcessUrl}
                  disabled={isProcessing || !imageUrl || !prompt}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Wand2 className="mr-2 h-5 w-5" />
                  {isProcessing ? 'Processando...' : '🚀 Processar Imagem'}
                </Button>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">💡 URLs de exemplo para testar:</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setExampleUrl('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop')}
                      className="block w-full text-left text-blue-600 hover:text-blue-800 text-sm"
                    >
                      🏔️ Paisagem de montanha (Unsplash)
                    </button>
                    <button
                      onClick={() => setExampleUrl('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop')}
                      className="block w-full text-left text-blue-600 hover:text-blue-800 text-sm"
                    >
                      🌲 Floresta (Unsplash)
                    </button>
                    <button
                      onClick={() => setExampleUrl('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop')}
                      className="block w-full text-left text-blue-600 hover:text-blue-800 text-sm"
                    >
                      🏞️ Natureza (Unsplash)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Upload */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div>
                  <Label>Selecionar Imagem:</Label>
                  <div
                    {...getRootProps()}
                    className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
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
                            src={uploadedImage}
                            alt="Imagem enviada"
                            fill
                            className="object-cover"
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
                              : 'Clique aqui ou arraste uma imagem'}
                          </p>
                          <p className="text-sm text-gray-500">
                            PNG, JPG, WEBP até 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="uploadPrompt">Prompt (o que você quer fazer com a imagem):</Label>
                  <textarea
                    id="uploadPrompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: troque a cor para vermelho, adicione um gato, transforme em desenho..."
                    className="mt-2 w-full p-3 border border-gray-300 rounded-lg resize-vertical min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="uploadFormat">Formato de saída:</Label>
                  <select
                    id="uploadFormat"
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="mt-2 w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>

                <Button
                  onClick={handleProcessUpload}
                  disabled={isProcessing || !uploadedImage || !prompt}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Wand2 className="mr-2 h-5 w-5" />
                  {isProcessing ? 'Processando...' : '🚀 Processar Imagem'}
                </Button>
              </div>
            )}

            {/* Loading State */}
            {isProcessing && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Processando imagem... Isso pode levar alguns segundos.</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`mt-6 p-4 rounded-lg ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {result.success ? (
                  <div>
                    <h3 className="text-lg font-medium text-green-800 mb-2">
                      ✅ Imagem processada com sucesso!
                    </h3>
                    <p className="text-sm text-green-700 mb-2">
                      <strong>Prompt usado:</strong> {prompt}
                    </p>
                    <p className="text-sm text-green-700 mb-4">
                      <strong>Arquivo salvo:</strong> {result.localFile}
                    </p>
                    {result.imageUrl && (
                      <div className="space-y-4">
                        <div className="relative w-full h-80 rounded-lg overflow-hidden border-2 border-green-200">
                          <Image
                            src={result.imageUrl}
                            alt="Imagem processada"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex space-x-4">
                          <Button asChild>
                            <a href={result.imageUrl} target="_blank" rel="noopener noreferrer">
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Abrir imagem em nova aba
                            </a>
                          </Button>
                          <Button variant="outline" asChild>
                            <a href={result.imageUrl} download>
                              <Download className="mr-2 h-4 w-4" />
                              Baixar imagem
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-red-800 mb-2">
                      ❌ Erro ao processar imagem
                    </h3>
                    <p className="text-sm text-red-700 mb-2">
                      <strong>Erro:</strong> {result.error}
                    </p>
                    <p className="text-sm text-red-600">
                      <strong>Dica:</strong> Tente usar uma das imagens de exemplo ou uma imagem diferente.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

