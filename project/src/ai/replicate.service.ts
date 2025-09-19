import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate from 'replicate';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReplicateService {
  private replicate: Replicate;

  constructor(private configService: ConfigService) {
    this.replicate = new Replicate({
      auth: this.configService.get<string>('REPLICATE_API_TOKEN'),
    });
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

