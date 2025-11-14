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

      // Usar o buffer da imagem diretamente para evitar problemas de acessibilidade de URL
      // O Gradio Client pode aceitar Blob criado a partir do buffer
      let imageUrl: string | undefined;
      let shouldCleanup = false;
      
      try {
        this.logger.log('Generating 3D model from image');
        
        // Preparar multiimages conforme documentação (estrutura FileData)
        // Se não houver multiimages, usar array vazio
        const multiimages: any[] = [];
        
        // Criar Blob diretamente do buffer da imagem (mais eficiente e confiável)
        // Isso evita problemas de acessibilidade de URL do Supabase pelo Trellis
        this.logger.log('Creating Blob from image buffer...');
        const imageBlob = new Blob([image.buffer], { type: image.mimetype || 'image/jpeg' });
        this.logger.log(`Image Blob created: size=${imageBlob.size} bytes, type=${imageBlob.type}`);
        
        // O Gradio Client geralmente aceita Blob diretamente
        // Se isso não funcionar, tentaremos fazer upload para obter uma URL pública
        const imageInput = imageBlob;
        this.logger.log('Using image Blob directly for Trellis');
        
        // Enviar para o Trellis
        this.logger.log('Sending image to Trellis...');
        this.logger.log(`Image input type: ${typeof imageInput}, is Blob: ${imageInput instanceof Blob}`);
        
        const result = await this.client.predict('/generate_and_extract_glb', {
          image: imageInput,
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

      // Verificar se o resultado indica erro ANTES de tentar acessar result.data
      // O Gradio pode retornar um objeto de status/erro diretamente
      if (result && typeof result === 'object') {
        // Verificar se há stage de erro (resposta de erro do Gradio)
        if ('stage' in result && result.stage === 'error') {
          const errorMessage = result.message || result.error || 'Erro desconhecido no processamento do Trellis';
          this.logger.error('Error generating 3D model');
          this.logger.error('Object:', JSON.stringify(result, null, 2));
          
          // Se for FileNotFoundError, pode ser problema com o formato da imagem ou com o Blob
          // Nesse caso, vamos tentar usar uma URL pública como fallback
          if (errorMessage === 'FileNotFoundError' || errorMessage.includes('FileNotFound')) {
            this.logger.warn('FileNotFoundError detected, trying URL fallback...');
            
            // Tentar fazer upload para obter URL pública e usar como fallback
            try {
              const tempProductId = `trellis_fallback_${Date.now()}_${Math.random().toString(36).substring(7)}`;
              imageUrl = await this.uploadService.uploadProductImage(image, tempProductId);
              shouldCleanup = true;
              this.logger.log(`Fallback: Image uploaded to URL: ${imageUrl}`);
              
              // Tentar novamente com a URL
              const fallbackResult = await this.client.predict('/generate_and_extract_glb', {
                image: imageUrl,
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
              
              // Verificar se há erro no resultado do fallback
              if (fallbackResult && typeof fallbackResult === 'object') {
                if ('stage' in fallbackResult && fallbackResult.stage === 'error') {
                  throw new Error(`Fallback URL method também falhou: ${fallbackResult.message || 'Erro desconhecido'}`);
                }
                if ('success' in fallbackResult && fallbackResult.success === false) {
                  throw new Error(`Fallback URL method também falhou: ${fallbackResult.message || 'Erro desconhecido'}`);
                }
              }
              
              // Verificar se o resultado do fallback é válido
              if (fallbackResult && typeof fallbackResult === 'object' && 'data' in fallbackResult && Array.isArray(fallbackResult.data)) {
                const glbUrl = fallbackResult.data[2]?.url || fallbackResult.data[1]?.url || fallbackResult.data[1]?.path;
                const videoUrl = fallbackResult.data[0]?.path;
                
                if (glbUrl) {
                  this.logger.log('Fallback URL method succeeded');
                  // Limpar variável shouldCleanup já que o fallback criou a URL
                  shouldCleanup = true;
                  return {
                    videoUrl,
                    glbUrl,
                  };
                }
              }
              
              // Se chegou aqui, o fallback não retornou um resultado válido
              throw new Error('Fallback URL method não retornou um resultado válido');
            } catch (fallbackError) {
              this.logger.error('Fallback URL method also failed:', fallbackError);
            }
            
            throw new Error(`Erro ao processar imagem no Trellis: A imagem não foi encontrada ou não pôde ser processada. Verifique se a imagem está em um formato válido (PNG, JPG) e tente novamente. Se o problema persistir, o serviço Trellis pode estar temporariamente indisponível.`);
          }
          
          throw new Error(`Erro no processamento do Trellis: ${errorMessage}. O serviço pode estar temporariamente indisponível, a imagem pode ser incompatível, ou pode haver problema com a URL da imagem.`);
        }
        
        // Verificar se é um objeto de status de erro do Gradio
        if ('success' in result && result.success === false) {
          const errorMessage = result.message || result.error || 'Erro desconhecido ao gerar modelo 3D';
          this.logger.error('Error generating 3D model');
          this.logger.error('Object:', JSON.stringify(result, null, 2));
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
      this.logger.error('Error generating 3D model');
      this.logger.error('Error type:', typeof error);
      this.logger.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Extrair mensagem de erro de diferentes formatos
      let errorMessage = '';
      let errorTitle = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        errorMessage = (error as any).message || (error as any).error || '';
        errorTitle = (error as any).title || '';
      } else {
        errorMessage = String(error);
      }
      
      // Verificar se o erro tem detalhes do status (objeto de erro do Gradio)
      // Isso deve ser verificado PRIMEIRO porque o Gradio retorna objetos estruturados
      if (error && typeof error === 'object' && 'stage' in error && error.stage === 'error') {
        const errorMsg = (error as any).message || errorMessage || 'Erro desconhecido no Trellis';
        const errorTitleFromObject = (error as any).title || errorTitle || '';
        
        // Atualizar errorMessage e errorTitle para uso posterior
        errorMessage = errorMsg;
        errorTitle = errorTitleFromObject;
        
        // 1. Verificar se é erro de quota excedida (prioridade alta)
        if (errorTitleFromObject.includes('quota exceeded') || errorMsg.includes('quota exceeded') || errorMsg.includes('exceeded your GPU quota')) {
          // Extrair tempo de espera da mensagem
          const timeMatch = errorMsg.match(/Try again in ([\d:]+)/);
          const timeToWait = timeMatch ? timeMatch[1] : 'algumas horas';
          
          // Extrair informações sobre a quota (se disponível)
          const quotaMatch = errorMsg.match(/(\d+s?) requested vs\. (\d+s?) left/);
          let quotaInfo = '';
          if (quotaMatch) {
            quotaInfo = ` (${quotaMatch[1]} solicitado, ${quotaMatch[2]} restante)`;
          }
          
          throw new Error(`Quota de GPU excedida${quotaInfo}. Você atingiu o limite de uso do serviço Trellis. Tente novamente em ${timeToWait}.`);
        }
        
        // 2. Verificar se é timeout do ZeroGPU (sem GPUs disponíveis)
        if (errorTitleFromObject === 'ZeroGPU queue timeout' || errorMsg.includes('No GPU was available')) {
          const cleanMsg = String(errorMsg).replace(/<[^>]*>/g, '').trim();
          throw new Error(`Serviço Trellis temporariamente indisponível: Não há GPUs disponíveis no momento. O serviço está sobrecarregado. Por favor, tente novamente em alguns minutos. ${cleanMsg}`);
        }
        
        // 3. Verificar se é FileNotFoundError - tentar fallback com URL
        if (errorTitleFromObject.includes('FileNotFound') || errorMsg.includes('FileNotFound')) {
          this.logger.warn('FileNotFoundError detected in Gradio error object, trying URL fallback...');
          
          // Tentar fazer upload para obter URL pública e usar como fallback
          try {
            if (!imageUrl) {
              const tempProductId = `trellis_fallback_${Date.now()}_${Math.random().toString(36).substring(7)}`;
              imageUrl = await this.uploadService.uploadProductImage(image, tempProductId);
              shouldCleanup = true;
              this.logger.log(`Fallback: Image uploaded to URL: ${imageUrl}`);
            }
            
            // Tentar novamente com a URL
            this.logger.log('Retrying with URL fallback...');
            const fallbackResult = await this.client.predict('/generate_and_extract_glb', {
              image: imageUrl,
              multiimages: [],
              seed: seed,
              ss_guidance_strength: ssGuidanceStrength,
              ss_sampling_steps: ssSamplingSteps,
              slat_guidance_strength: slatGuidanceStrength,
              slat_sampling_steps: slatSamplingSteps,
              multiimage_algo: 'stochastic',
              mesh_simplify: meshSimplify,
              texture_size: textureSize,
            });
            
            // Verificar se há erro no resultado do fallback
            if (fallbackResult && typeof fallbackResult === 'object') {
              if ('stage' in fallbackResult && fallbackResult.stage === 'error') {
                const fallbackErrorMsg = fallbackResult.message || 'Erro desconhecido';
                this.logger.error('Fallback URL method also failed:', JSON.stringify(fallbackResult, null, 2));
                throw new Error(`Erro ao processar imagem no Trellis: Tanto o método Blob quanto a URL falharam. Erro: ${fallbackErrorMsg}. Verifique se a imagem está em um formato válido (PNG, JPG) e tente novamente.`);
              }
              if ('success' in fallbackResult && fallbackResult.success === false) {
                const fallbackErrorMsg = fallbackResult.message || 'Erro desconhecido';
                this.logger.error('Fallback URL method also failed:', JSON.stringify(fallbackResult, null, 2));
                throw new Error(`Erro ao processar imagem no Trellis: Tanto o método Blob quanto a URL falharam. Erro: ${fallbackErrorMsg}. Verifique se a imagem está em um formato válido (PNG, JPG) e tente novamente.`);
              }
            }
            
            // Verificar se o resultado do fallback é válido
            if (fallbackResult && typeof fallbackResult === 'object' && 'data' in fallbackResult && Array.isArray(fallbackResult.data)) {
              const glbUrl = fallbackResult.data[2]?.url || fallbackResult.data[1]?.url || fallbackResult.data[1]?.path;
              const videoUrl = fallbackResult.data[0]?.path;
              
              if (glbUrl) {
                this.logger.log('Fallback URL method succeeded!');
                return {
                  videoUrl,
                  glbUrl,
                };
              }
            }
            
            // Se chegou aqui, o fallback não retornou um resultado válido
            throw new Error('Fallback URL method não retornou um resultado válido');
          } catch (fallbackError) {
            this.logger.error('Fallback URL method also failed:', fallbackError);
            // Se o fallback falhar, lançar erro original
            throw new Error(`Erro ao processar imagem no Trellis: A imagem não foi encontrada ou não pôde ser processada. Tanto o método Blob quanto a URL falharam. Verifique se a imagem está em um formato válido (PNG, JPG) e tente novamente. Se o problema persistir, o serviço Trellis pode estar temporariamente indisponível.`);
          }
        }
        
        // 4. Mensagem genérica para outros erros do Gradio
        throw new Error(`Erro ao gerar modelo 3D: ${errorTitleFromObject ? errorTitleFromObject + ' - ' : ''}${errorMsg}. O serviço Trellis pode estar temporariamente indisponível ou a imagem pode ser inválida.`);
      }
      
      // Verificar se é FileNotFoundError em qualquer formato (fallback para erros não-Gradio)
      if (errorMessage.includes('FileNotFound') || errorTitle.includes('FileNotFound')) {
        this.logger.warn('FileNotFoundError detected (non-Gradio format), trying URL fallback...');
        
        // Tentar fazer upload para obter URL pública e usar como fallback
        try {
          if (!imageUrl) {
            const tempProductId = `trellis_fallback_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            imageUrl = await this.uploadService.uploadProductImage(image, tempProductId);
            shouldCleanup = true;
            this.logger.log(`Fallback: Image uploaded to URL: ${imageUrl}`);
          }
          
          // Tentar novamente com a URL
          this.logger.log('Retrying with URL fallback...');
          const fallbackResult = await this.client.predict('/generate_and_extract_glb', {
            image: imageUrl,
            multiimages: [],
            seed: seed,
            ss_guidance_strength: ssGuidanceStrength,
            ss_sampling_steps: ssSamplingSteps,
            slat_guidance_strength: slatGuidanceStrength,
            slat_sampling_steps: slatSamplingSteps,
            multiimage_algo: 'stochastic',
            mesh_simplify: meshSimplify,
            texture_size: textureSize,
          });
          
          // Verificar se há erro no resultado do fallback
          if (fallbackResult && typeof fallbackResult === 'object') {
            if ('stage' in fallbackResult && fallbackResult.stage === 'error') {
              const fallbackErrorMsg = fallbackResult.message || 'Erro desconhecido';
              this.logger.error('Fallback URL method also failed:', JSON.stringify(fallbackResult, null, 2));
              throw new Error(`Erro ao processar imagem no Trellis: Tanto o método Blob quanto a URL falharam. Erro: ${fallbackErrorMsg}. Verifique se a imagem está em um formato válido (PNG, JPG) e tente novamente.`);
            }
            if ('success' in fallbackResult && fallbackResult.success === false) {
              const fallbackErrorMsg = fallbackResult.message || 'Erro desconhecido';
              this.logger.error('Fallback URL method also failed:', JSON.stringify(fallbackResult, null, 2));
              throw new Error(`Erro ao processar imagem no Trellis: Tanto o método Blob quanto a URL falharam. Erro: ${fallbackErrorMsg}. Verifique se a imagem está em um formato válido (PNG, JPG) e tente novamente.`);
            }
          }
          
          // Verificar se o resultado do fallback é válido
          if (fallbackResult && typeof fallbackResult === 'object' && 'data' in fallbackResult && Array.isArray(fallbackResult.data)) {
            const glbUrl = fallbackResult.data[2]?.url || fallbackResult.data[1]?.url || fallbackResult.data[1]?.path;
            const videoUrl = fallbackResult.data[0]?.path;
            
            if (glbUrl) {
              this.logger.log('Fallback URL method succeeded!');
              return {
                videoUrl,
                glbUrl,
              };
            }
          }
          
          // Se chegou aqui, o fallback não retornou um resultado válido
          throw new Error('Fallback URL method não retornou um resultado válido');
        } catch (fallbackError) {
          this.logger.error('Fallback URL method also failed:', fallbackError);
          // Se o fallback falhar, lançar erro original
          throw new Error(`Erro ao processar imagem no Trellis: A imagem não foi encontrada ou não pôde ser processada. Tanto o método Blob quanto a URL falharam. Verifique se a imagem está em um formato válido (PNG, JPG) e tente novamente. Se o problema persistir, o serviço Trellis pode estar temporariamente indisponível.`);
        }
      }
      
      // Se o erro já foi formatado acima (dentro do try), apenas relançar
      if (error instanceof Error && error.message.includes('Trellis')) {
        throw error;
      }
      
      // Verificar se é erro de quota excedida (fallback para erros não-Gradio)
      if (errorMessage.includes('quota exceeded') || errorMessage.includes('exceeded your GPU quota')) {
        const timeMatch = errorMessage.match(/Try again in ([\d:]+)/);
        const timeToWait = timeMatch ? timeMatch[1] : 'algumas horas';
        throw new Error(`Quota de GPU excedida. Você atingiu o limite de uso do serviço Trellis. Tente novamente em ${timeToWait}.`);
      }
      
      // Log do erro completo para debug
      this.logger.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Erro genérico - usar errorMessage já declarado ou criar se não foi criado
      if (!errorMessage) {
        errorMessage = error instanceof Error ? error.message : (error?.toString() || 'Erro desconhecido');
      }
      throw new Error(`Falha ao gerar modelo 3D: ${errorMessage}`);
    } finally {
      // Limpar arquivo temporário do Supabase apenas se foi criado
      if (shouldCleanup && imageUrl) {
        try {
          await this.uploadService.deleteProductImage(imageUrl);
          this.logger.log('Temporary image file cleaned up from Supabase');
        } catch (cleanupError) {
          this.logger.warn('Failed to cleanup temporary image file from Supabase', cleanupError);
        }
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

