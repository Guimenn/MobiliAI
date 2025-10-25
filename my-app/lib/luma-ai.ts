// Luma AI API Integration
// Documentation: https://docs.lumalabs.ai/

import React from 'react';

interface LumaAIResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  model_url?: string;
  preview_url?: string;
  error?: string;
  metadata?: {
    vertices: number;
    faces: number;
    textures: boolean;
    confidence: number;
  };
}

interface LumaAIConfig {
  apiKey: string;
  baseUrl: string;
}

class LumaAIService {
  private config: LumaAIConfig;

  constructor() {
    this.config = {
      apiKey: process.env.NEXT_PUBLIC_LUMA_AI_API_KEY || '',
      baseUrl: 'https://api.lumalabs.ai/v1'
    };
  }

  async createCapture(imageFile: File, prompt?: string): Promise<LumaAIResponse> {
    try {
      // Converter arquivo para base64
      const base64Image = await this.fileToBase64(imageFile);
      
      const response = await fetch(`${this.config.baseUrl}/captures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt || 'Generate a detailed 3D model from this product image',
          image: base64Image,
          settings: {
            quality: 'high',
            generate_textures: true,
            optimize_for_web: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Luma AI API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar capture no Luma AI:', error);
      throw error;
    }
  }

  async getCaptureStatus(captureId: string): Promise<LumaAIResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/captures/${captureId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Luma AI API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao verificar status no Luma AI:', error);
      throw error;
    }
  }

  async downloadModel(modelUrl: string): Promise<Blob> {
    try {
      const response = await fetch(modelUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao baixar modelo: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Erro ao baixar modelo do Luma AI:', error);
      throw error;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remover o prefixo "data:image/...;base64,"
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  // Simular conversão para desenvolvimento (quando não há API key)
  async simulateConversion(imageFile: File): Promise<LumaAIResponse> {
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
      id: `sim_${Date.now()}`,
      status: 'completed',
      model_url: '/models/generated-chair.gltf',
      preview_url: URL.createObjectURL(imageFile),
      metadata: {
        vertices: 15420,
        faces: 30840,
        textures: true,
        confidence: 0.85
      }
    };
  }
}

// Singleton instance
export const lumaAI = new LumaAIService();

// Hook para usar o serviço
export const useLumaAI = () => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const convertImageTo3D = async (imageFile: File, prompt?: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Verificar se há API key configurada
      const hasApiKey = process.env.NEXT_PUBLIC_LUMA_AI_API_KEY;
      
      if (hasApiKey) {
        // Usar API real
        const result = await lumaAI.createCapture(imageFile, prompt);
        return result;
      } else {
        // Usar simulação para desenvolvimento
        console.log('⚠️ Usando simulação - Configure NEXT_PUBLIC_LUMA_AI_API_KEY para usar API real');
        const result = await lumaAI.simulateConversion(imageFile);
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    convertImageTo3D,
    isProcessing,
    error,
    hasApiKey: !!process.env.NEXT_PUBLIC_LUMA_AI_API_KEY
  };
};

export default lumaAI;
