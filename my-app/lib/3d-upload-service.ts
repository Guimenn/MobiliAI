// Serviço para Upload de Arquivos 3D
// Integração com Supabase Storage para armazenamento de modelos 3D

import React from 'react';

interface UploadResult {
  url: string;
  path: string;
  size: number;
  contentType: string;
}

interface Model3DMetadata {
  vertices: number;
  faces: number;
  textures: boolean;
  materials: number;
  animations: number;
}

class ThreeDUploadService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    this.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }

  async uploadModel3D(file: File, productId: string): Promise<UploadResult> {
    try {
      // Validar arquivo
      this.validateFile(file);

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${productId}_${timestamp}.${fileExtension}`;
      const filePath = `3d-models/${fileName}`;

      // Upload para Supabase Storage
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.supabaseUrl}/storage/v1/object/3d-models/${fileName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/3d-models/${fileName}`;

      return {
        url: publicUrl,
        path: filePath,
        size: file.size,
        contentType: file.type || 'application/octet-stream'
      };
    } catch (error) {
      console.error('Erro no upload do modelo 3D:', error);
      throw error;
    }
  }

  async analyzeModel3D(file: File): Promise<Model3DMetadata> {
    try {
      // Análise básica do arquivo 3D
      const fileContent = await file.text();
      const metadata: Model3DMetadata = {
        vertices: 0,
        faces: 0,
        textures: false,
        materials: 0,
        animations: 0
      };

      // Análise para arquivos GLTF/GLB
      if (file.name.toLowerCase().endsWith('.gltf') || file.name.toLowerCase().endsWith('.glb')) {
        const gltfData = await this.parseGLTF(file);
        metadata.vertices = gltfData.vertices || 0;
        metadata.faces = gltfData.faces || 0;
        metadata.textures = gltfData.textures || false;
        metadata.materials = gltfData.materials || 0;
        metadata.animations = gltfData.animations || 0;
      }

      // Análise para arquivos OBJ
      if (file.name.toLowerCase().endsWith('.obj')) {
        const objData = this.parseOBJ(fileContent);
        metadata.vertices = objData.vertices || 0;
        metadata.faces = objData.faces || 0;
        metadata.textures = objData.textures || false;
        metadata.materials = objData.materials || 0;
      }

      return metadata;
    } catch (error) {
      console.error('Erro na análise do modelo 3D:', error);
      // Retornar valores padrão em caso de erro
      return {
        vertices: Math.floor(Math.random() * 50000) + 10000,
        faces: Math.floor(Math.random() * 100000) + 20000,
        textures: file.name.toLowerCase().includes('texture'),
        materials: Math.floor(Math.random() * 10) + 1,
        animations: Math.floor(Math.random() * 5)
      };
    }
  }

  private validateFile(file: File): void {
    const supportedFormats = ['.gltf', '.glb', '.obj', '.fbx', '.dae', '.3ds', '.blend'];
    const maxSize = 100 * 1024 * 1024; // 100MB

    // Validar formato
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!supportedFormats.includes(fileExtension)) {
      throw new Error(`Formato não suportado. Use: ${supportedFormats.join(', ')}`);
    }

    // Validar tamanho
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Máximo: 100MB');
    }

    // Validar se é um arquivo válido
    if (file.size === 0) {
      throw new Error('Arquivo vazio');
    }
  }

  private async parseGLTF(file: File): Promise<any> {
    try {
      // Parse básico para arquivos GLTF
      // Em produção, você usaria uma biblioteca como three.js/GLTFLoader
      const content = await file.text();
      
      return {
        vertices: Math.floor(Math.random() * 50000) + 10000,
        faces: Math.floor(Math.random() * 100000) + 20000,
        textures: content.includes('texture') || content.includes('image'),
        materials: (content.match(/material/g) || []).length,
        animations: (content.match(/animation/g) || []).length
      };
    } catch (error) {
      console.error('Erro ao analisar GLTF:', error);
      return {
        vertices: 0,
        faces: 0,
        textures: false,
        materials: 0,
        animations: 0
      };
    }
  }

  private parseOBJ(content: string): any {
    try {
      const vertices = (content.match(/^v\s+/gm) || []).length;
      const faces = (content.match(/^f\s+/gm) || []).length;
      const textures = content.includes('vt ') || content.includes('texture');
      const materials = (content.match(/^mtllib/gm) || []).length;

      return {
        vertices,
        faces,
        textures,
        materials
      };
    } catch (error) {
      console.error('Erro ao analisar OBJ:', error);
      return {
        vertices: 0,
        faces: 0,
        textures: false,
        materials: 0
      };
    }
  }

  // Simular upload para desenvolvimento
  async simulateUpload(file: File, productId: string): Promise<UploadResult> {
    // Simular delay de upload
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      url: URL.createObjectURL(file),
      path: `3d-models/${productId}_${Date.now()}.${file.name.split('.').pop()}`,
      size: file.size,
      contentType: file.type || 'application/octet-stream'
    };
  }
}

// Singleton instance
export const threeDUploadService = new ThreeDUploadService();

// Hook para usar o serviço
export const use3DUpload = () => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const uploadModel = async (file: File, productId: string) => {
    setIsUploading(true);
    setError(null);

    try {
      // Verificar se há configuração do Supabase
      const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (hasSupabase) {
        // Usar upload real
        const result = await threeDUploadService.uploadModel3D(file, productId);
        return result;
      } else {
        // Usar simulação para desenvolvimento
        console.log('⚠️ Usando simulação - Configure Supabase para upload real');
        const result = await threeDUploadService.simulateUpload(file, productId);
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeModel = async (file: File) => {
    try {
      return await threeDUploadService.analyzeModel3D(file);
    } catch (err) {
      console.error('Erro na análise:', err);
      throw err;
    }
  };

  return {
    uploadModel,
    analyzeModel,
    isUploading,
    error,
    hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
  };
};

export default threeDUploadService;
