import { Controller, Get, Query, Param } from '@nestjs/common';
import { PublicProductsService } from './public-products.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicProductsService: PublicProductsService) {}

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
}
