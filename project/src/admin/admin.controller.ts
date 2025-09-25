import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminSystemService } from './admin-system.service';
import { AdminNotificationsService } from './admin-notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminCategoriesService: AdminCategoriesService,
    private readonly adminSystemService: AdminSystemService,
    private readonly adminNotificationsService: AdminNotificationsService
  ) {}

  // ==================== DASHBOARD ====================
  
  @Get('dashboard')
  async getDashboard(@Request() req) {
    return this.adminService.getDashboardStats();
  }

  // ==================== GESTÃO DE USUÁRIOS ====================

  @Get('users')
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = ''
  ) {
    return this.adminService.getAllUsers(
      parseInt(page),
      parseInt(limit),
      search
    );
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  async createUser(@Body() userData: CreateUserDto) {
    return this.adminService.createUser(userData);
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() userData: UpdateUserDto
  ) {
    return this.adminService.updateUser(id, userData);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Put('users/:id/password')
  async changeUserPassword(
    @Param('id') id: string,
    @Body() data: ChangePasswordDto
  ) {
    return this.adminService.changeUserPassword(id, data.password);
  }

  // ==================== GESTÃO DE LOJAS ====================

  @Get('stores')
  async getAllStores() {
    return this.adminService.getAllStores();
  }

  @Get('stores/:id')
  async getStoreById(@Param('id') id: string) {
    return this.adminService.getStoreById(id);
  }

  @Post('stores')
  async createStore(@Body() storeData: {
    name: string;
    address: string;
    phone: string;
    email: string;
    managerId?: string;
  }) {
    return this.adminService.createStore(storeData);
  }

  @Put('stores/:id')
  async updateStore(
    @Param('id') id: string,
    @Body() storeData: {
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
      isActive?: boolean;
    }
  ) {
    return this.adminService.updateStore(id, storeData);
  }

  @Delete('stores/:id')
  async deleteStore(@Param('id') id: string) {
    return this.adminService.deleteStore(id);
  }

  // ==================== GESTÃO DE PRODUTOS ====================

  @Get('products')
  async getAllProducts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
    @Query('category') category?: string
  ) {
    return this.adminService.getAllProducts(
      parseInt(page),
      parseInt(limit),
      search,
      category as any
    );
  }

  @Post('products')
  async createProduct(@Body() productData: CreateProductDto) {
    return this.adminService.createProduct(productData as any);
  }

  @Put('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() productData: any
  ) {
    return this.adminService.updateProduct(id, productData);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  // ==================== RELATÓRIOS ====================

  @Get('reports/sales')
  async getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('storeId') storeId?: string
  ) {
    return this.adminService.getSalesReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      storeId
    );
  }

  @Get('reports/inventory')
  async getInventoryReport(@Query('storeId') storeId?: string) {
    return this.adminService.getInventoryReport(storeId);
  }

  @Get('reports/user-activity')
  async getUserActivityReport(
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.adminService.getUserActivityReport(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  // ==================== ESTATÍSTICAS RÁPIDAS ====================

  @Get('stats/overview')
  async getOverviewStats() {
    const stats = await this.adminService.getDashboardStats();
    return stats.overview;
  }

  @Get('stats/recent-sales')
  async getRecentSales() {
    const stats = await this.adminService.getDashboardStats();
    return stats.recentSales;
  }

  @Get('stats/top-products')
  async getTopProducts() {
    const stats = await this.adminService.getDashboardStats();
    return stats.topProducts;
  }

  // ==================== CATEGORIAS E ANÁLISES ====================

  @Get('categories')
  async getCategories() {
    return this.adminCategoriesService.getProductCategories();
  }

  @Get('categories/stats')
  async getCategoryStats() {
    return this.adminCategoriesService.getCategoryStats();
  }

  @Get('categories/analysis')
  async getCategoryAnalysis() {
    return this.adminCategoriesService.getCategoryAnalysis();
  }

  @Get('categories/:category/products')
  async getProductsByCategory(
    @Param('category') category: string,
    @Query('limit') limit: string = '10'
  ) {
    return this.adminCategoriesService.getProductsByCategory(
      category as any,
      parseInt(limit)
    );
  }

  @Get('categories/:category/top-selling')
  async getTopSellingByCategory(
    @Param('category') category: string,
    @Query('limit') limit: string = '5'
  ) {
    return this.adminCategoriesService.getTopSellingByCategory(
      category as any,
      parseInt(limit)
    );
  }

  @Get('inventory/categories')
  async getInventoryByCategory() {
    return this.adminCategoriesService.getInventoryByCategory();
  }

  @Get('inventory/low-stock')
  async getLowStockByCategory() {
    return this.adminCategoriesService.getLowStockByCategory();
  }

  // ==================== SISTEMA E LOGS ====================

  @Get('system/logs')
  async getSystemLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('level') level?: string,
    @Query('userId') userId?: string
  ) {
    return this.adminSystemService.getSystemLogs(
      parseInt(page),
      parseInt(limit),
      level,
      userId
    );
  }

  @Get('system/stats')
  async getSystemStats() {
    return this.adminSystemService.getSystemStats();
  }

  @Get('system/health')
  async getSystemHealth() {
    return this.adminSystemService.getSystemHealth();
  }

  @Get('system/settings')
  async getSystemSettings() {
    return this.adminSystemService.getSystemSettings();
  }

  @Put('system/settings')
  async updateSystemSettings(@Body() settings: any) {
    return this.adminSystemService.updateSystemSettings(settings);
  }

  @Post('system/backup')
  async createBackup() {
    return this.adminSystemService.createBackup();
  }

  @Post('system/cleanup')
  async cleanupSystem() {
    return this.adminSystemService.cleanupSystem();
  }

  // ==================== RELATÓRIOS AVANÇADOS ====================

  @Get('reports/financial')
  async getFinancialReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('storeId') storeId?: string
  ) {
    return this.adminService.getSalesReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      storeId
    );
  }

  @Get('reports/user-performance')
  async getUserPerformanceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string
  ) {
    return this.adminService.getUserActivityReport(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('reports/product-performance')
  async getProductPerformanceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string
  ) {
    // Implementar relatório de performance de produtos
    return {
      message: 'Relatório de performance de produtos em desenvolvimento'
    };
  }

  // ==================== NOTIFICAÇÕES E ALERTAS ====================

  @Get('notifications')
  async getNotifications() {
    return this.adminNotificationsService.getSystemNotifications();
  }

  @Get('alerts')
  async getAlerts() {
    return this.adminNotificationsService.getSystemAlerts();
  }

  @Get('dashboard/summary')
  async getDashboardSummary() {
    return this.adminNotificationsService.getDashboardSummary();
  }

  @Get('performance')
  async getPerformanceReport() {
    return this.adminNotificationsService.getPerformanceReport();
  }
}
