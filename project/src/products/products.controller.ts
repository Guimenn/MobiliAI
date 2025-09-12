    import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductCategory } from '@prisma/client';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto, @Request() req) {
    return this.productsService.create(createProductDto, req.user);
  }

  @Get()
  findAll(@Request() req, @Query('storeId') storeId?: string) {
    return this.productsService.findAll(req.user, storeId);
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: ProductCategory, @Request() req, @Query('storeId') storeId?: string) {
    return this.productsService.findByCategory(category, req.user, storeId);
  }

  @Get('color/:color')
  findByColor(@Param('color') color: string, @Request() req, @Query('storeId') storeId?: string) {
    return this.productsService.findByColor(color, req.user, storeId);
  }

  @Get('low-stock')
  getLowStockProducts(@Request() req, @Query('storeId') storeId?: string) {
    return this.productsService.getLowStockProducts(req.user, storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.productsService.findOne(id, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Request() req) {
    return this.productsService.update(id, updateProductDto, req.user);
  }

  @Patch(':id/stock')
  updateStock(@Param('id') id: string, @Body('quantity') quantity: number, @Request() req) {
    return this.productsService.updateStock(id, quantity, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user);
  }
}
