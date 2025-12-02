import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerProductsService } from './customer-products.service';
import { CustomerCartService } from './customer-cart.service';
import { CustomerFavoritesService } from './customer-favorites.service';
import { CustomerOrdersService } from './customer-orders.service';
import { CouponsService } from '../coupons/coupons.service';
import { RedeemCouponDto } from '../coupons/dto/redeem-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('customer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.CASHIER, UserRole.STORE_MANAGER)
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly customerProductsService: CustomerProductsService,
    private readonly customerCartService: CustomerCartService,
    private readonly customerFavoritesService: CustomerFavoritesService,
    private readonly customerOrdersService: CustomerOrdersService,
    private readonly couponsService: CouponsService
  ) {}

  // ==================== REGISTRO E PERFIL ====================

  @Get('profile')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN) // Apenas clientes podem ver seu próprio perfil
  async getProfile(@Request() req) {
    return this.customerService.getProfile(req.user.id);
  }

  @Put('profile')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN) // Apenas clientes podem atualizar seu próprio perfil
  async updateProfile(@Request() req, @Body() updateData: any) {
    return this.customerService.updateProfile(req.user.id, updateData);
  }

  @Put('password')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN) // Apenas clientes podem mudar sua própria senha
  async changePassword(@Request() req, @Body() data: { currentPassword: string; newPassword: string }) {
    return this.customerService.changePassword(req.user.id, data.currentPassword, data.newPassword);
  }

  // ==================== DASHBOARD DO CLIENTE ====================

  @Get('dashboard')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN) // Apenas clientes podem ver seu próprio dashboard
  async getCustomerDashboard(@Request() req) {
    return this.customerService.getCustomerDashboard(req.user.id);
  }

  // ==================== CATÁLOGO DE PRODUTOS ====================

  @Get('products')
  async getProducts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
    @Query('search') search: string = '',
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string
  ) {
    return this.customerProductsService.getProducts(
      parseInt(page),
      parseInt(limit),
      search,
      category,
      minPrice ? parseFloat(minPrice) : undefined,
      maxPrice ? parseFloat(maxPrice) : undefined
    );
  }

  @Get('products/:id')
  async getProductById(@Param('id') productId: string) {
    return this.customerProductsService.getProductById(productId);
  }

  @Get('products/featured')
  async getFeaturedProducts(@Query('limit') limit: string = '8') {
    return this.customerProductsService.getFeaturedProducts(parseInt(limit));
  }

  @Get('products/new')
  async getNewProducts(@Query('limit') limit: string = '8') {
    return this.customerProductsService.getNewProducts(parseInt(limit));
  }

  @Get('products/bestsellers')
  async getBestSellerProducts(@Query('limit') limit: string = '8') {
    return this.customerProductsService.getBestSellerProducts(parseInt(limit));
  }

  @Get('products/search')
  async searchProducts(
    @Query('q') searchTerm: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12'
  ) {
    return this.customerProductsService.searchProducts(searchTerm, parseInt(page), parseInt(limit));
  }

  @Get('products/category/:category')
  async getProductsByCategory(
    @Param('category') category: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12'
  ) {
    return this.customerProductsService.getProductsByCategory(category, parseInt(page), parseInt(limit));
  }

  @Get('categories')
  async getCategories() {
    return this.customerProductsService.getCategories();
  }

  @Get('brands')
  async getBrands() {
    return this.customerProductsService.getBrands();
  }

  @Get('price-ranges')
  async getPriceRanges() {
    return this.customerProductsService.getPriceRanges();
  }

  // ==================== CARRINHO DE COMPRAS ====================

  @Get('cart')
  async getCart(@Request() req) {
    return this.customerCartService.getCart(req.user.id);
  }

  @Post('cart/add')
  async addToCart(@Request() req, @Body() data: { productId: string; quantity: number }) {
    return this.customerCartService.addToCart(req.user.id, data.productId, data.quantity);
  }

  @Put('cart/items/:id')
  async updateCartItem(
    @Request() req,
    @Param('id') cartItemId: string,
    @Body() data: { quantity: number }
  ) {
    return this.customerCartService.updateCartItem(req.user.id, cartItemId, data.quantity);
  }

  @Delete('cart/items/:id')
  async removeFromCart(@Request() req, @Param('id') cartItemId: string) {
    return this.customerCartService.removeFromCart(req.user.id, cartItemId);
  }

  @Delete('cart/clear')
  async clearCart(@Request() req) {
    return this.customerCartService.clearCart(req.user.id);
  }

  @Get('cart/validate')
  async validateCart(@Request() req) {
    return this.customerCartService.validateCart(req.user.id);
  }

  @Post('cart/checkout')
  async checkout(
    @Request() req, 
    @Body() data: { 
      storeId: string;
      shippingAddress?: string;
      shippingCity?: string;
      shippingState?: string;
      shippingZipCode?: string;
      shippingPhone?: string;
      shippingCost?: number;
      insuranceCost?: number;
      tax?: number;
      discount?: number;
      couponCode?: string;
      notes?: string;
    }
  ) {
    try {
      const shippingInfo = data.shippingAddress ? {
        address: data.shippingAddress,
        city: data.shippingCity || '',
        state: data.shippingState || '',
        zipCode: data.shippingZipCode || '',
        phone: data.shippingPhone
      } : undefined;
      
      return await this.customerCartService.checkout(
        req.user.id, 
        data.storeId, 
        shippingInfo,
        {
          shippingCost: data.shippingCost || 0,
          insuranceCost: data.insuranceCost || 0,
          tax: data.tax || 0,
          discount: data.discount || 0,
          couponCode: data.couponCode,
          notes: data.notes,
        }
      );
    } catch (error: any) {
      console.error('Erro no checkout:', {
        userId: req.user.id,
        storeId: data.storeId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // ==================== FAVORITOS ====================

  @Get('favorites')
  async getFavorites(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12'
  ) {
    return this.customerFavoritesService.getFavorites(req.user.id, parseInt(page), parseInt(limit));
  }

  @Post('favorites/add')
  async addToFavorites(@Request() req, @Body() data: { productId: string }) {
    return this.customerFavoritesService.addToFavorites(req.user.id, data.productId);
  }

  @Delete('favorites/remove')
  async removeFromFavorites(@Request() req, @Body() data: { productId: string }) {
    return this.customerFavoritesService.removeFromFavorites(req.user.id, data.productId);
  }

  @Get('favorites/check/:productId')
  async isFavorite(@Request() req, @Param('productId') productId: string) {
    return this.customerFavoritesService.isFavorite(req.user.id, productId);
  }

  @Get('favorites/count')
  async getFavoriteCount(@Request() req) {
    return this.customerFavoritesService.getFavoriteCount(req.user.id);
  }

  // ==================== COMPARAÇÃO DE PRODUTOS ====================

  @Get('comparison')
  async getComparison(@Request() req) {
    return this.customerFavoritesService.getComparison(req.user.id);
  }

  @Post('comparison/add')
  async addToComparison(@Request() req, @Body() data: { productId: string }) {
    return this.customerFavoritesService.addToComparison(req.user.id, data.productId);
  }

  @Delete('comparison/remove')
  async removeFromComparison(@Request() req, @Body() data: { productId: string }) {
    return this.customerFavoritesService.removeFromComparison(req.user.id, data.productId);
  }

  @Delete('comparison/clear')
  async clearComparison(@Request() req) {
    return this.customerFavoritesService.clearComparison(req.user.id);
  }

  // ==================== PEDIDOS ====================

  @Get('orders')
  async getOrders(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string
  ) {
    return this.customerOrdersService.getOrders(req.user.id, parseInt(page), parseInt(limit), status);
  }

  @Get('orders/:id')
  async getOrderById(@Request() req, @Param('id') orderId: string) {
    return this.customerOrdersService.getOrderById(req.user.id, orderId);
  }

  @Put('orders/:id/cancel')
  async cancelOrder(@Request() req, @Param('id') orderId: string, @Body() data: { reason?: string }) {
    return this.customerOrdersService.cancelOrder(req.user.id, orderId, data.reason);
  }

  // ==================== AVALIAÇÕES ====================

  @Post('reviews')
  async addReview(
    @Request() req,
    @Body() data: { productId: string; rating: number; title?: string; comment?: string; saleId?: string }
  ) {
    return this.customerOrdersService.addReview(req.user.id, data.productId, data.rating, data.title, data.comment, data.saleId);
  }

  @Put('reviews/:id')
  async updateReview(
    @Request() req,
    @Param('id') reviewId: string,
    @Body() data: { rating: number; title?: string; comment?: string }
  ) {
    return this.customerOrdersService.updateReview(req.user.id, reviewId, data.rating, data.title, data.comment);
  }

  @Delete('reviews/:id')
  async deleteReview(@Request() req, @Param('id') reviewId: string) {
    return this.customerOrdersService.deleteReview(req.user.id, reviewId);
  }

  @Get('reviews/my')
  async getMyReviews(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.customerOrdersService.getMyReviews(req.user.id, parseInt(page), parseInt(limit));
  }

  @Get('reviews/product/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.customerOrdersService.getProductReviews(productId, parseInt(page), parseInt(limit));
  }

  @Get('reviews/reviewable')
  async getReviewableProducts(@Request() req) {
    return this.customerOrdersService.getReviewableProducts(req.user.id);
  }

  // ==================== ENDEREÇOS DE ENTREGA ====================

  @Get('shipping-addresses')
  async getShippingAddresses(@Request() req) {
    return this.customerService.getShippingAddresses(req.user.id);
  }

  @Get('shipping-addresses/:id')
  async getShippingAddressById(@Request() req, @Param('id') addressId: string) {
    return this.customerService.getShippingAddressById(req.user.id, addressId);
  }

  @Post('shipping-addresses')
  async createShippingAddress(@Request() req, @Body() addressData: any) {
    return this.customerService.createShippingAddress(req.user.id, addressData);
  }

  @Put('shipping-addresses/:id')
  async updateShippingAddress(@Request() req, @Param('id') addressId: string, @Body() updateData: any) {
    return this.customerService.updateShippingAddress(req.user.id, addressId, updateData);
  }

  @Delete('shipping-addresses/:id')
  async deleteShippingAddress(@Request() req, @Param('id') addressId: string) {
    return this.customerService.deleteShippingAddress(req.user.id, addressId);
  }

  @Put('shipping-addresses/:id/default')
  async setDefaultShippingAddress(@Request() req, @Param('id') addressId: string) {
    return this.customerService.setDefaultShippingAddress(req.user.id, addressId);
  }

  // ==================== CUPONS ====================

  @Post('coupons/redeem')
  async redeemCoupon(@Request() req, @Body() body: RedeemCouponDto) {
    console.log('📥 Endpoint POST /customer/coupons/redeem chamado para usuário:', req.user.id, req.user.email, 'código:', body.code);
    try {
      const result = await this.couponsService.redeemCouponForCustomer(req.user.id, body.code);
      console.log('✅ Cupom resgatado com sucesso:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao resgatar cupom:', error);
      throw error;
    }
  }

  @Get('coupons')
  async getCoupons(@Request() req) {
    console.log('📥 Endpoint GET /customer/coupons chamado para usuário:', req.user.id, req.user.email);
    const coupons = await this.couponsService.getCustomerCoupons(req.user.id);
    console.log('📤 Retornando cupons:', coupons.length);
    return coupons;
  }
}
