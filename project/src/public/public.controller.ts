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
    @Query('maxPrice') maxPrice?: string
  ) {
    try {
      return await this.publicProductsService.getProducts(
        parseInt(page),
        parseInt(limit),
        search,
        category,
        minPrice ? parseFloat(minPrice) : undefined,
        maxPrice ? parseFloat(maxPrice) : undefined
      );
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      return {
        success: false,
        error: 'Erro ao buscar produtos',
        message: error.message
      };
    }
  }

  @Get('products/:id')
  async getProductById(@Param('id') productId: string) {
    return this.publicProductsService.getProductById(productId);
  }
}
