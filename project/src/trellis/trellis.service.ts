import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@gradio/client';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class TrellisService {
  private readonly logger = new Logger(TrellisService.name);
  private client: Client | null = null;
  private initPromise: Promise<Client> | null = null;
  private readonly hfToken: string | undefined;

  constructor(private uploadService: UploadService) {
    // Obter token do Hugging Face das variáveis de ambiente
    // Pode ser HF_TOKEN ou HUGGINGFACE_TOKEN
    this.hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN;
    
    if (this.hfToken) {
      this.logger.log('Hugging Face token encontrado - será usado para prioridade na fila ZeroGPU');
    } else {
      this.logger.warn('Hugging Face token não encontrado - usando serviço sem autenticação (menor prioridade)');
    }
  }

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
        
        // Configurar variável de ambiente com token se disponível
        // O cliente Gradio usa HF_TOKEN automaticamente se disponível
        const originalHfToken = process.env.HF_TOKEN;
        if (this.hfToken) {
          // Sempre configurar o token se disponível, mesmo que já exista outro
          // Isso garante que usamos o token correto
          process.env.HF_TOKEN = this.hfToken;
          this.logger.log('Hugging Face token configurado para maior prioridade na fila ZeroGPU');
        }
        
        // Conectar ao cliente Gradio
        // O cliente Gradio detecta automaticamente o token via HF_TOKEN
        const client = await Client.connect('trellis-community/TRELLIS');
        
        // Restaurar token original se foi alterado
        if (this.hfToken && originalHfToken && originalHfToken !== this.hfToken) {
          process.env.HF_TOKEN = originalHfToken;
        }
        
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
      ssGuidanceStrength = 7.5, // Valor padrão da documentação
      ssSamplingSteps = 12, // Valor padrão da documentação
      slatGuidanceStrength = 3, // Valor padrão da documentação
      slatSamplingSteps = 12, // Valor padrão da documentação
      meshSimplify = 0.95, // Valor padrão da documentação (0.95)
      textureSize = 1024, // Valor padrão da documentação (1024)
    } = options;

      // Seguir exatamente a documentação do Gradio
      // A documentação mostra: fazer fetch da URL e converter para Blob
      let imageUrl: string | undefined;
      
      try {
        this.logger.log('Generating 3D model from image');
        
        // Fazer upload temporário para obter URL pública
        this.logger.log('Uploading image to temporary URL...');
        const tempProductId = `trellis_temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        imageUrl = await this.uploadService.uploadProductImage(image, tempProductId);
        this.logger.log(`Image uploaded to: ${imageUrl}`);
        
        // Seguir EXATAMENTE o padrão da documentação: fetch + blob
        this.logger.log('Fetching image from URL to convert to Blob (following documentation)...');
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Falha ao buscar imagem: ${response.status} ${response.statusText}`);
        }
        const imageBlob = await response.blob();
        this.logger.log(`Image converted to Blob (size: ${imageBlob.size} bytes, type: ${imageBlob.type})`);

        // Preparar multiimages conforme documentação (estrutura FileData)
        // Se não houver multiimages, usar array vazio mas com estrutura correta se necessário
        const multiimages: any[] = [];
        
        // Seguir EXATAMENTE a documentação - usar Blob e valores padrão
        this.logger.log('Sending to Trellis following documentation format...');
        const result = await this.client.predict('/generate_and_extract_glb', {
          image: imageBlob,
          multiimages: multiimages,
          seed: seed,
          ss_guidance_strength: ssGuidanceStrength,
          ss_sampling_steps: ssSamplingSteps,
          slat_guidance_strength: slatGuidanceStrength,
          slat_sampling_steps: slatSamplingSteps,
          multiimage_algo: 'stochastic',
          mesh_simplify: meshSimplify,
          texture_size: textureSize,
        });

      // Verificar se o resultado indica erro (Gradio pode retornar objeto de erro)
      // O Trellis/Gradio pode retornar um objeto de status de erro em vez de resultado válido
      if (result && typeof result === 'object') {
        // Verificar se há stage de erro (primeira verificação, mais comum)
        if ('stage' in result && result.stage === 'error') {
          const errorMessage = result.message || result.error || 'Erro desconhecido no processamento do Trellis';
          this.logger.error('Trellis processing error:', JSON.stringify(result, null, 2));
          throw new Error(`Erro no processamento do Trellis: ${errorMessage}. O serviço pode estar temporariamente indisponível, a imagem pode ser incompatível, ou pode haver problema com a URL da imagem.`);
        }
        
        // Verificar se é um objeto de status de erro do Gradio
        if ('success' in result && result.success === false) {
          const errorMessage = result.message || result.error || 'Erro desconhecido ao gerar modelo 3D';
          this.logger.error('Trellis returned error status:', JSON.stringify(result, null, 2));
          throw new Error(`Trellis API error: ${errorMessage}. O serviço pode estar temporariamente indisponível ou a imagem pode ser incompatível.`);
        }
        
        // Verificar se há mensagem de erro no resultado
        if ('error' in result && result.error) {
          throw new Error(`Trellis error: ${result.error}`);
        }
      }

      // Verificar se result.data existe antes de acessar
      if (!result || !result.data || !Array.isArray(result.data)) {
        this.logger.error('Invalid result structure from Trellis:', JSON.stringify(result, null, 2));
        throw new Error('Resposta inválida do Trellis: estrutura de dados não encontrada');
      }

      // result.data é um array com [video, glbModel, downloadButton]
      const glbUrl = result.data[2]?.url || result.data[1]?.url || result.data[1]?.path;
      const videoUrl = result.data[0]?.path;

      if (!glbUrl) {
        // Log mais detalhado para debug
        this.logger.error('GLB URL not found in result:', JSON.stringify(result, null, 2));
        throw new Error('Falha ao gerar modelo GLB: URL do modelo não encontrada na resposta do Trellis');
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
      
      // Verificar se é erro do Gradio/Trellis
      if (error.message && error.message.includes('Trellis')) {
        // Já é uma mensagem formatada, apenas relançar
        throw error;
      }
      
      // Verificar se o erro tem detalhes do status
      if (error && typeof error === 'object' && 'stage' in error && error.stage === 'error') {
        const errorMsg = error.message || 'Erro desconhecido no Trellis';
        const errorTitle = error.title || '';
        
        // Mensagem específica para timeout do ZeroGPU (sem GPUs disponíveis)
        if (errorTitle === 'ZeroGPU queue timeout' || errorMsg.includes('No GPU was available')) {
          // Limpar HTML da mensagem se houver
          const cleanMsg = errorMsg.replace(/<[^>]*>/g, '').trim();
          throw new Error(`Serviço Trellis temporariamente indisponível: Não há GPUs disponíveis no momento. O serviço está sobrecarregado. Por favor, tente novamente em alguns minutos. ${cleanMsg}`);
        }
        
        // Mensagem específica para FileNotFoundError
        if (errorMsg === 'FileNotFoundError' || errorMsg.includes('FileNotFound')) {
          throw new Error(`Erro ao processar imagem no Trellis: A imagem não foi encontrada ou não pôde ser acessada. Verifique se a imagem está em um formato válido (PNG, JPG) e tente novamente. Se o problema persistir, o serviço Trellis pode estar temporariamente indisponível.`);
        }
        
        // Mensagem genérica para outros erros
        throw new Error(`Erro ao gerar modelo 3D: ${errorTitle ? errorTitle + ' - ' : ''}${errorMsg}. O serviço Trellis pode estar temporariamente indisponível ou a imagem pode ser inválida.`);
      }
      
      // Erro genérico
      const errorMessage = error?.message || error?.toString() || 'Erro desconhecido';
      throw new Error(`Falha ao gerar modelo 3D: ${errorMessage}`);
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

