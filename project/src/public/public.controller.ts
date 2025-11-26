import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { PublicProductsService } from './public-products.service';
import { PublicSupportService } from './public-support.service';
import { ImageKitService } from '../upload/imagekit.service';
import { AdminSystemService } from '../admin/admin-system.service';

@Controller('public')
export class PublicController {
  constructor(
    private readonly publicProductsService: PublicProductsService,
    private readonly publicSupportService: PublicSupportService,
    private readonly imagekitService: ImageKitService,
    private readonly adminSystemService: AdminSystemService,
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
}
