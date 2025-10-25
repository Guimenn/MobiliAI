'use client';

import React, { useState, useRef, useCallback } from 'react';
import { use3DUpload } from '@/lib/3d-upload-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Box, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  Download,
  Trash2,
  Info
} from 'lucide-react';

interface Direct3DUploaderProps {
  onUploaded: (model3D: any) => void;
  onClose: () => void;
}

interface Model3D {
  id: string;
  name: string;
  category: string;
  originalFile: File;
  modelUrl: string;
  previewUrl?: string;
  metadata: {
    method: 'direct_upload';
    fileSize: number;
    fileType: string;
    vertices?: number;
    faces?: number;
    textures: boolean;
    createdAt: string;
  };
}

export default function Direct3DUploader({ onUploaded, onClose }: Direct3DUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('gerado_3d');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Usar o hook do serviço de upload
  const { uploadModel, analyzeModel, isUploading, error, hasSupabase } = use3DUpload();

  const supportedFormats = ['.gltf', '.glb', '.obj', '.fbx', '.dae', '.3ds', '.blend'];
  const maxFileSize = 100 * 1024 * 1024; // 100MB

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Validar formato
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!supportedFormats.includes(fileExtension)) {
        setError(`Formato não suportado. Use: ${supportedFormats.join(', ')}`);
        return;
      }

      // Validar tamanho
      if (file.size > maxFileSize) {
        setError('Arquivo muito grande. Máximo: 100MB');
        return;
      }

      // Gerar nome do produto baseado no arquivo
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setProductName(baseName);
      
      // Criar preview (para arquivos GLTF/GLB)
      if (fileExtension === '.gltf' || fileExtension === '.glb') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(URL.createObjectURL(file));
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Simular seleção de arquivo
      const mockEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(mockEvent);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const upload3DModel = async () => {
    if (!selectedFile) return;

    try {
      // Fazer upload do arquivo
      const uploadResult = await uploadModel(selectedFile, `direct_${Date.now()}`);
      
      // Analisar o modelo 3D
      const analysis = await analyzeModel(selectedFile);
      
      const modelResult: Model3D = {
        id: `direct_${Date.now()}`,
        name: productName || selectedFile.name.replace(/\.[^/.]+$/, ''),
        category: productCategory,
        originalFile: selectedFile,
        modelUrl: uploadResult.url,
        previewUrl: preview,
        metadata: {
          method: 'direct_upload',
          fileSize: selectedFile.size,
          fileType: selectedFile.type || 'application/octet-stream',
          vertices: analysis.vertices,
          faces: analysis.faces,
          textures: analysis.textures,
          createdAt: new Date().toISOString()
        }
      };

      setUploadResult(modelResult);
      onUploaded(modelResult);
    } catch (err) {
      console.error('Erro no upload:', err);
      // O erro já é tratado pelo hook use3DUpload
    }
  };

  const resetUploader = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadResult(null);
    setError(null);
    setProductName('');
    setProductCategory('gerado_3d');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#3e2626] to-[#8B4513] rounded-xl flex items-center justify-center">
                <Box className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upload Direto de Modelo 3D</h2>
                <p className="text-sm text-gray-600">Envie arquivos 3D prontos para usar</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Aviso sobre Supabase */}
          {!hasSupabase && (
            <div className="flex items-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-semibold">Modo Desenvolvimento</p>
                <p className="text-yellow-700 text-sm">
                  Configure Supabase Storage para upload real de arquivos 3D
                </p>
              </div>
            </div>
          )}

          {/* Informações sobre formatos */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Formatos Suportados</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                  <div>
                    <p><strong>GLTF/GLB:</strong> Recomendado (com texturas)</p>
                    <p><strong>OBJ:</strong> Geometria + materiais</p>
                    <p><strong>FBX:</strong> Animação + geometria</p>
                  </div>
                  <div>
                    <p><strong>DAE:</strong> Collada format</p>
                    <p><strong>3DS:</strong> 3D Studio</p>
                    <p><strong>BLEND:</strong> Blender nativo</p>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Tamanho máximo: 100MB | Resolução recomendada: 1024x1024+
                </p>
              </div>
            </div>
          </div>

          {/* Área de Upload */}
          {!selectedFile && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#3e2626] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Arraste e solte seu modelo 3D aqui
                  </h3>
                  <p className="text-gray-600 mb-4">
                    ou clique para selecionar um arquivo
                  </p>
                  <Button variant="outline" className="border-[#3e2626] text-[#3e2626] hover:bg-[#3e2626] hover:text-white">
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo 3D
                  </Button>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {supportedFormats.map(format => (
                    <Badge key={format} variant="secondary" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview do arquivo selecionado */}
          {selectedFile && !uploadResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3e2626] to-[#8B4513] rounded-lg flex items-center justify-center">
                  <Box className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedFile.name}</h3>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Arquivo 3D'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetUploader}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Configurações do produto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productName" className="text-sm font-medium text-gray-700">
                    Nome do Produto
                  </Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Cadeira Premium"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="productCategory" className="text-sm font-medium text-gray-700">
                    Categoria
                  </Label>
                  <select
                    id="productCategory"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2626]"
                  >
                    <option value="gerado_3d">Modelo 3D</option>
                    <option value="cadeira">Cadeira</option>
                    <option value="mesa">Mesa</option>
                    <option value="sofa">Sofá</option>
                    <option value="armario">Armário</option>
                    <option value="luminaria">Luminária</option>
                    <option value="acessorio">Acessório</option>
                  </select>
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex space-x-3">
                <Button
                  onClick={upload3DModel}
                  disabled={isUploading || !productName.trim()}
                  className="flex-1 bg-[#3e2626] hover:bg-[#2a1a1a]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fazendo Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Fazer Upload do Modelo
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetUploader}
                  className="px-6"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Resultado do upload */}
          {uploadResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="text-green-800 font-semibold">Modelo 3D Uploadado com Sucesso!</h4>
                  <p className="text-green-700 text-sm">
                    {uploadResult.name} foi adicionado aos produtos
                  </p>
                </div>
              </div>

              {/* Informações do modelo */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Informações do Modelo</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Nome:</strong> {uploadResult.name}</p>
                    <p><strong>Categoria:</strong> {uploadResult.category}</p>
                    <p><strong>Tamanho:</strong> {formatFileSize(uploadResult.metadata.fileSize)}</p>
                  </div>
                  <div>
                    <p><strong>Vértices:</strong> {uploadResult.metadata.vertices?.toLocaleString()}</p>
                    <p><strong>Faces:</strong> {uploadResult.metadata.faces?.toLocaleString()}</p>
                    <p><strong>Texturas:</strong> {uploadResult.metadata.textures ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
              </div>

              {/* Botões finais */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    onClose();
                    resetUploader();
                  }}
                  className="flex-1 bg-[#3e2626] hover:bg-[#2a1a1a]"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Concluir
                </Button>
                <Button
                  variant="outline"
                  onClick={resetUploader}
                  className="px-6"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Novo Upload
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Input hidden para seleção de arquivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept={supportedFormats.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
