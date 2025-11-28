import { Controller, Get, Query, Param, Post, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PublicProductsService } from './public-products.service';
import { PublicSupportService } from './public-support.service';
import { ImageKitService } from '../upload/imagekit.service';
import { AdminSystemService } from '../admin/admin-system.service';
import { ReplicateService } from '../ai/replicate.service';

@Controller('public')
export class PublicController {
  constructor(
    private readonly publicProductsService: PublicProductsService,
    private readonly publicSupportService: PublicSupportService,
    private readonly imagekitService: ImageKitService,
    private readonly adminSystemService: AdminSystemService,
    private readonly replicateService: ReplicateService,
  ) {}

  @Get('products')
  async getProducts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('search') search: string = '',
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('storeId') storeId?: string
  ) {
    try {
      return await this.publicProductsService.getProducts(
        parseInt(page),
        parseInt(limit),
        search,
        category,
        minPrice ? parseFloat(minPrice) : undefined,
        maxPrice ? parseFloat(maxPrice) : undefined,
        storeId
      );
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      // Retornar estrutura consistente mesmo em caso de erro
      return {
        products: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      };
    }
  }

  @Get('products/:id')
  async getProductById(@Param('id') productId: string) {
    return this.publicProductsService.getProductById(productId);
  }

  @Get('products/:id/reviews')
  async getProductReviews(
    @Param('id') productId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.publicProductsService.getProductReviews(productId, parseInt(page), parseInt(limit));
  }

  // Endpoints para n8n - Webhook de atendimento
  @Post('support/webhook')
  async supportWebhook(@Body() body: any) {
    // Endpoint que o n8n pode chamar para obter dados do sistema
    return this.publicSupportService.handleWebhook(body);
  }

  @Get('support/stores')
  async getStores() {
    return this.publicSupportService.getStores();
  }

  @Get('support/products/search')
  async searchProducts(@Query('q') query: string) {
    return this.publicSupportService.searchProducts(query);
  }

  // Endpoints públicos para buscar imagens do ImageKit
  @Get('product-images/:productId')
  async getProductImages(@Param('productId') productId: string) {
    try {
      const imageUrls = await this.imagekitService.listProductImages(productId);
      return { imageUrls };
    } catch (error: any) {
      console.error('❌ [PublicController] Erro ao buscar imagens:', error);
      return { imageUrls: [] };
    }
  }

  @Get('all-images')
  async getAllImages() {
    try {
      const images = await this.imagekitService.listAllProductImages();
      return { images };
    } catch (error: any) {
      console.error('❌ [PublicController] Erro ao buscar imagens:', error);
      return { images: [] };
    }
  }

  // Endpoint público para verificar modo de manutenção
  @Get('maintenance-mode')
  async getMaintenanceMode() {
    try {
      const maintenanceMode = await this.adminSystemService.getMaintenanceMode();
      return { maintenanceMode };
    } catch (error) {
      console.error('Erro ao verificar modo de manutenção:', error);
      return { maintenanceMode: false };
    }
  }

  // Endpoint público para processar imagens com IA (demo sem autenticação)
  @Post('ai/process-upload')
  @UseInterceptors(FilesInterceptor('images', 10)) // Aceita até 10 imagens
  async processImageWithUpload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { prompt: string; outputFormat?: string },
  ) {
    console.log('🚀 PublicController: Processando upload de imagens (público)');
    console.log('📁 Arquivos recebidos:', files ? files.length : 0);
    console.log('📝 Prompt:', body.prompt);

    if (!files || files.length === 0) {
      throw new Error('Nenhuma imagem foi enviada');
    }

    // Validar formato das imagens
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`Formato de imagem não suportado: ${file.originalname}. Formatos aceitos: ${allowedMimeTypes.join(', ')}`);
      }
      
      // Validar tamanho do arquivo (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error(`Arquivo muito grande: ${file.originalname}. Tamanho máximo: 10MB`);
      }
    }

    // Primeira imagem é o ambiente, as demais são produtos
    const environmentImage = files[0];
    const productImages = files.slice(1);

    console.log(`🖼️  Imagem do ambiente: ${environmentImage.originalname}`);
    console.log(`📦 Imagens de produtos: ${productImages.length}`);

    // Se não houver produtos, usar o método antigo
    if (productImages.length === 0) {
      const result = await this.replicateService.processImageWithPrompt(
        body.prompt || 'Adicione os produtos na imagem de forma realista',
        environmentImage.buffer,
        body.outputFormat || 'jpg',
        environmentImage.originalname
      );

      if (result.success) {
        return {
          success: true,
          imageUrl: result.imageUrl,
          localFile: result.localFile,
          message: 'Imagem processada com sucesso!'
        };
      } else {
        throw new Error(result.error || 'Erro ao processar imagem');
      }
    }

    // Usar método com múltiplas imagens
    const productBuffers = productImages.map(img => img.buffer);
    const result = await this.replicateService.processImageWithMultipleImages(
      body.prompt || 'Adicione os produtos mostrados nas imagens na foto do ambiente de forma realista e natural, mantendo o ambiente original intacto',
      environmentImage.buffer,
      productBuffers,
      body.outputFormat || 'jpg',
      environmentImage.originalname
    );

    if (result.success) {
      return {
        success: true,
        imageUrl: result.imageUrl,
        localFile: result.localFile,
        message: 'Imagem processada com sucesso!'
      };
    } else {
      throw new Error(result.error || 'Erro ao processar imagem');
    }
  }
}
