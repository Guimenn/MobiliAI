import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@gradio/client';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class TrellisService {
  private readonly logger = new Logger(TrellisService.name);
  private client: Client | null = null;
  private initPromise: Promise<Client> | null = null;

  constructor(private uploadService: UploadService) {}

  private async initializeClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.logger.log('Connecting to TRELLIS...');
        const client = await Client.connect('trellis-community/TRELLIS');
        this.logger.log('TRELLIS client connected successfully');
        this.client = client;
        return client;
      } catch (error) {
        this.logger.error('Failed to connect to TRELLIS', error);
        this.initPromise = null;
        throw new Error('Failed to initialize TRELLIS client');
      }
    })();

    return this.initPromise;
  }

  async generate3DModel(
    image: Express.Multer.File,
    options: {
      seed?: number;
      ssGuidanceStrength?: number;
      ssSamplingSteps?: number;
      slatGuidanceStrength?: number;
      slatSamplingSteps?: number;
      meshSimplify?: number;
      textureSize?: number;
    } = {}
  ): Promise<{
    videoUrl?: string;
    glbUrl: string;
  }> {
    if (!this.client) {
      await this.initializeClient();
    }

    const {
      seed = 0,
      ssGuidanceStrength = 7.5,
      ssSamplingSteps = 4, // Reduzido ainda mais para ser mais rápido (4 steps)
      slatGuidanceStrength = 3,
      slatSamplingSteps = 4, // Reduzido ainda mais para ser mais rápido (4 steps)
      meshSimplify = 0.8, // Reduzido ainda mais para ser mais rápido
      textureSize = 256, // Reduzido ainda mais para ser mais rápido (256px)
    } = options;

    // Fazer upload temporário para obter URL pública
    // O cliente Gradio precisa de uma URL pública, não um arquivo local
    const tempProductId = `trellis_temp_${Date.now()}`;
    let imageUrl: string;
    
    try {
      this.logger.log('Generating 3D model from image');
      
      // Fazer upload temporário para obter URL pública
      this.logger.log('Uploading image to temporary URL...');
      imageUrl = await this.uploadService.uploadProductImage(image, tempProductId);
      this.logger.log(`Image uploaded to: ${imageUrl}`);

      // Passar a URL pública para o cliente Gradio
      const result = await this.client.predict('/generate_and_extract_glb', {
        image: imageUrl,
        multiimages: [],
        seed,
        ss_guidance_strength: ssGuidanceStrength,
        ss_sampling_steps: ssSamplingSteps,
        slat_guidance_strength: slatGuidanceStrength,
        slat_sampling_steps: slatSamplingSteps,
        multiimage_algo: 'stochastic',
        mesh_simplify: meshSimplify,
        texture_size: textureSize,
      });

      // result.data é um array com [video, glbModel, downloadButton]
      const glbUrl = result.data[2]?.url || result.data[1]?.url || result.data[1]?.path;
      const videoUrl = result.data[0]?.path;

      if (!glbUrl) {
        throw new Error('Failed to generate GLB model');
      }

      this.logger.log('3D model generated successfully');
      this.logger.log(`GLB URL: ${glbUrl}`);

      return {
        videoUrl,
        glbUrl,
      };
    } catch (error) {
      this.logger.error('Error generating 3D model', error);
      
      // Verificar se é erro de quota excedida
      if (error.message && error.message.includes('quota exceeded')) {
        const match = error.message.match(/Try again in ([\d:]+)/);
        const timeToWait = match ? match[1] : '~24 horas';
        throw new Error(`Quota de GPU excedida. Tente novamente em ${timeToWait}`);
      }
      
      throw new Error(`Failed to generate 3D model: ${error.message}`);
    } finally {
      // Limpar arquivo temporário do Supabase
      try {
        if (imageUrl) {
          await this.uploadService.deleteProductImage(imageUrl);
          this.logger.log('Temporary image file cleaned up from Supabase');
        }
      } catch (cleanupError) {
        this.logger.warn('Failed to cleanup temporary image file from Supabase', cleanupError);
      }
    }
  }

  async preprocessImage(image: Express.Multer.File): Promise<Buffer> {
    if (!this.client) {
      await this.initializeClient();
    }

    // Fazer upload temporário para obter URL pública
    const tempProductId = `trellis_preprocess_temp_${Date.now()}`;
    let imageUrl: string;
    
    try {
      this.logger.log('Preprocessing image');

      // Fazer upload temporário para obter URL pública
      this.logger.log('Uploading image to temporary URL...');
      imageUrl = await this.uploadService.uploadProductImage(image, tempProductId);
      this.logger.log(`Image uploaded to: ${imageUrl}`);

      // Passar a URL pública para o cliente Gradio
      const result = await this.client.predict('/preprocess_image', {
        image: imageUrl,
      });

      // Retorna o buffer da imagem processada
      // Se o resultado for uma URL, fazer download
      if (typeof result.data === 'string') {
        if (result.data.startsWith('http')) {
          const response = await fetch(result.data);
          return Buffer.from(await response.arrayBuffer());
        }
      }
      
      return result.data;
    } catch (error) {
      this.logger.error('Error preprocessing image', error);
      throw new Error(`Failed to preprocess image: ${error.message}`);
    } finally {
      // Limpar arquivo temporário do Supabase
      try {
        if (imageUrl) {
          await this.uploadService.deleteProductImage(imageUrl);
          this.logger.log('Temporary image file cleaned up from Supabase');
        }
      } catch (cleanupError) {
        this.logger.warn('Failed to cleanup temporary image file from Supabase', cleanupError);
      }
    }
  }
}

