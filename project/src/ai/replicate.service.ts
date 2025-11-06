import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate from 'replicate';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReplicateService {
  private replicate: Replicate;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('REPLICATE_API_TOKEN') || 'r8_WwmiM2PiqGiJsyW0oVQ5LJDDHZqLQid1AzXRU';
    
    if (!token) {
      console.warn('⚠️ REPLICATE_API_TOKEN não configurado. Usando token padrão.');
    }
    
    this.replicate = new Replicate({
      auth: token,
    });
    
    console.log('✅ ReplicateService inicializado com token:', token.substring(0, 10) + '...');
  }

  // Função para converter imagem para base64 (para imagens pequenas)
  private imageToBase64(imageBuffer: Buffer, mimeType = 'image/jpeg'): string {
    const base64 = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  // Função para converter imagem para base64 (solução mais confiável)
  private async uploadImageToTempService(imageBuffer: Buffer, filename: string): Promise<string> {
    console.log("📤 Convertendo imagem para base64...");
    
    // Detectar tipo MIME baseado na extensão do arquivo
    const extension = filename.split('.').pop().toLowerCase();
    let mimeType = 'image/jpeg';
    
    switch (extension) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      case 'jpg':
      case 'jpeg':
      default:
        mimeType = 'image/jpeg';
        break;
    }
    
    const sizeKB = Math.round(imageBuffer.length / 1024);
    console.log(`✅ Conversão para base64 concluída (${sizeKB}KB)`);
    return this.imageToBase64(imageBuffer, mimeType);
  }

  // Função principal para processar imagem com prompt usando Google Nano Banana
  async processImageWithPrompt(
    prompt: string, 
    imageBuffer: Buffer, 
    outputFormat: string = "jpg",
    filename?: string
  ): Promise<{ success: boolean; imageUrl?: string; localFile?: string; error?: string }> {
    try {
      console.log("🚀 Iniciando processamento da imagem...");
      console.log(`📝 Prompt: ${prompt}`);
      
      // Converter buffer para base64
      const imageBase64 = await this.uploadImageToTempService(imageBuffer, filename || 'image.jpg');
      
      const input = {
        prompt: prompt,
        image_input: [imageBase64],
        output_format: outputFormat
      };

      console.log("⏳ Enviando requisição para o Replicate...");
      const output = await this.replicate.run("google/nano-banana", { input });

      console.log("✅ Processamento concluído!");
      console.log(`🔗 URL da imagem processada: ${output}`);

      // Validar se o output é uma URL válida
      const imageUrl = String(output);
      if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
        console.error('❌ URL inválida retornada pelo Replicate:', imageUrl);
        return {
          success: false,
          error: 'URL da imagem processada inválida'
        };
      }

      // Salvar a imagem localmente
      const fileName = `processed-image-${Date.now()}.${outputFormat}`;
      console.log(`💾 Tentando fazer download da imagem de: ${imageUrl}`);
      
      // Fazer download da imagem com timeout e tratamento de erros
      let response: Response;
      let buffer: ArrayBuffer;
      
      try {
        // Usar AbortController para timeout (compatível com Node.js 15+)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 30000); // 30 segundos
        
        try {
          response = await fetch(imageUrl, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          throw fetchErr;
        }

        if (!response.ok) {
          console.error(`❌ Erro ao baixar imagem: ${response.status} ${response.statusText}`);
          // Mesmo se falhar ao baixar, retornar a URL para o frontend tentar carregar
          return {
            success: true,
            imageUrl: imageUrl,
            error: `Aviso: Não foi possível salvar localmente (${response.status}), mas a URL está disponível`
          };
        }
        
        buffer = await response.arrayBuffer();
      } catch (fetchError: any) {
        console.error('❌ Erro no fetch da imagem:', fetchError.message);
        // Se o fetch falhar, ainda retornar a URL para o frontend tentar carregar
        return {
          success: true,
          imageUrl: imageUrl,
          error: fetchError.message ? `Aviso: Não foi possível salvar localmente, mas a URL está disponível: ${fetchError.message}` : undefined
        };
      }
      
      // Criar diretório temp se não existir
      const tempDir = path.join(process.cwd(), 'temp');
      try {
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(buffer));
        
        console.log(`✅ Imagem salva com sucesso: ${fileName}`);
      } catch (fileError: any) {
        console.error('❌ Erro ao salvar arquivo localmente:', fileError.message);
        // Mesmo se falhar ao salvar localmente, retornar a URL
      }
      
      return {
        success: true,
        imageUrl: imageUrl,
        localFile: fileName,
      };

    } catch (error: any) {
      console.error("❌ Erro ao processar imagem:", error.message);
      console.error("❌ Stack trace:", error.stack);
      
      // Se o erro for do Replicate, tentar extrair mais informações
      if (error.response) {
        console.error("❌ Resposta do Replicate:", error.response);
      }
      
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao processar imagem'
      };
    }
  }

  // Função para processar imagem com múltiplas imagens (ambiente + produtos)
  async processImageWithMultipleImages(
    prompt: string,
    environmentImageBuffer: Buffer,
    productImageBuffers: Buffer[],
    outputFormat: string = "jpg",
    environmentFilename?: string
  ): Promise<{ success: boolean; imageUrl?: string; localFile?: string; error?: string }> {
    try {
      console.log("🚀 Iniciando processamento com múltiplas imagens...");
      console.log(`📝 Prompt: ${prompt}`);
      console.log(`🖼️  Imagem do ambiente: ${environmentFilename || 'image.jpg'}`);
      console.log(`📦 Número de produtos: ${productImageBuffers.length}`);
      
      // Converter imagem do ambiente para base64
      const environmentImageBase64 = await this.uploadImageToTempService(
        environmentImageBuffer, 
        environmentFilename || 'environment.jpg'
      );
      
      // Converter imagens dos produtos para base64
      const productImagesBase64: string[] = [];
      for (let i = 0; i < productImageBuffers.length; i++) {
        const productBase64 = await this.uploadImageToTempService(
          productImageBuffers[i],
          `product-${i}.jpg`
        );
        productImagesBase64.push(productBase64);
      }
      
      // Combinar todas as imagens: ambiente primeiro, depois produtos
      const allImages = [environmentImageBase64, ...productImagesBase64];
      
      const input = {
        prompt: prompt,
        image_input: allImages,
        output_format: outputFormat
      };

      console.log("⏳ Enviando requisição para o Replicate com", allImages.length, "imagens...");
      const output = await this.replicate.run("google/nano-banana", { input });

      console.log("✅ Processamento concluído!");
      console.log(`🔗 URL da imagem processada: ${output}`);

      // Validar se o output é uma URL válida
      const imageUrl = String(output);
      if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
        console.error('❌ URL inválida retornada pelo Replicate:', imageUrl);
        return {
          success: false,
          error: 'URL da imagem processada inválida'
        };
      }

      // Salvar a imagem localmente
      const fileName = `processed-image-${Date.now()}.${outputFormat}`;
      console.log(`💾 Tentando fazer download da imagem de: ${imageUrl}`);
      
      // Fazer download da imagem com timeout e tratamento de erros
      let response: Response;
      let buffer: ArrayBuffer;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 30000);
        
        try {
          response = await fetch(imageUrl, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          throw fetchErr;
        }

        if (!response.ok) {
          console.error(`❌ Erro ao baixar imagem: ${response.status} ${response.statusText}`);
          return {
            success: true,
            imageUrl: imageUrl,
            error: `Aviso: Não foi possível salvar localmente (${response.status}), mas a URL está disponível`
          };
        }
        
        buffer = await response.arrayBuffer();
      } catch (fetchError: any) {
        console.error('❌ Erro no fetch da imagem:', fetchError.message);
        return {
          success: true,
          imageUrl: imageUrl,
          error: fetchError.message ? `Aviso: Não foi possível salvar localmente, mas a URL está disponível: ${fetchError.message}` : undefined
        };
      }
      
      // Criar diretório temp se não existir
      const tempDir = path.join(process.cwd(), 'temp');
      try {
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(buffer));
        
        console.log(`✅ Imagem salva com sucesso: ${fileName}`);
      } catch (fileError: any) {
        console.error('❌ Erro ao salvar arquivo localmente:', fileError.message);
      }
      
      return {
        success: true,
        imageUrl: imageUrl,
        localFile: fileName,
      };

    } catch (error: any) {
      console.error("❌ Erro ao processar imagem:", error.message);
      console.error("❌ Stack trace:", error.stack);
      
      if (error.response) {
        console.error("❌ Resposta do Replicate:", error.response);
      }
      
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao processar imagem'
      };
    }
  }

  // Função para processar imagem com URL
  async processImageWithUrl(
    prompt: string, 
    imageUrl: string, 
    outputFormat: string = "jpg"
  ): Promise<{ success: boolean; imageUrl?: string; localFile?: string; error?: string }> {
    try {
      console.log("🚀 Iniciando processamento da imagem...");
      console.log(`📝 Prompt: ${prompt}`);
      console.log(`🖼️  Imagem: ${imageUrl}`);
      
      let finalImageUrl = imageUrl;
      
      // Se for uma URL local, fazer upload para um serviço temporário
      if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
        console.log("📤 Detectada URL local, convertendo para formato público...");
        
        try {
          const response = await fetch(imageUrl);
          const buffer = await response.arrayBuffer();
          // Extrair extensão da URL original
          const urlParts = imageUrl.split('/');
          const originalFilename = urlParts[urlParts.length - 1];
          const extension = originalFilename.split('.').pop() || 'jpg';
          const filename = `temp-${Date.now()}.${extension}`;
          
          finalImageUrl = await this.uploadImageToTempService(Buffer.from(buffer), filename);
          console.log(`✅ Conversão concluída: ${finalImageUrl.substring(0, 50)}...`);
        } catch (uploadError) {
          console.error("❌ Erro na conversão:", uploadError.message);
          return {
            success: false,
            error: "Não foi possível converter a imagem para processamento"
          };
        }
      }
      
      const input = {
        prompt: prompt,
        image_input: [finalImageUrl],
        output_format: outputFormat
      };

      console.log("⏳ Enviando requisição para o Replicate...");
      const output = await this.replicate.run("google/nano-banana", { input });

      console.log("✅ Processamento concluído!");
      console.log(`🔗 URL da imagem processada: ${output}`);

      // Salvar a imagem localmente
      const fileName = `processed-image-${Date.now()}.${outputFormat}`;
      console.log(`💾 Salvando imagem como: ${fileName}`);
      
      // Fazer download da imagem
      const response = await fetch(String(output));
      const buffer = await response.arrayBuffer();
      
      // Criar diretório temp se não existir
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(buffer));
      
      console.log(`✅ Imagem salva com sucesso: ${fileName}`);
      
      return {
        success: true,
        imageUrl: String(output),
        localFile: fileName,
      };

    } catch (error) {
      console.error("❌ Erro ao processar imagem:", error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

