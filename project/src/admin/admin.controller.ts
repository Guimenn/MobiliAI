import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateMedicalCertificateDto } from './dto/create-medical-certificate.dto';
import { TransformUserDataInterceptor } from './interceptors/transform-user-data.interceptor';

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
  @UseInterceptors(TransformUserDataInterceptor)
  async createUser(@Body() userData: CreateUserDto) {
    try {
      // Log para debug - verificar dados recebidos
      console.log('📝 [AdminController] Dados recebidos para criar usuário:', {
        name: userData.name,
        email: userData.email,
        hasPassword: !!userData.password,
        hasRole: !!userData.role,
        role: userData.role,
        storeId: userData.storeId
      });
      
      return await this.adminService.createUser(userData);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
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

  @Put('users/:id/working-hours')
  async updateUserWorkingHours(
    @Param('id') id: string,
    @Body() data: { workingHours: any }
  ) {
    return this.adminService.updateUserWorkingHours(id, data.workingHours);
  }

  // ==================== GESTÃO DE CLIENTES ====================

  @Get('customers')
  async getAllCustomers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = ''
  ) {
    return this.adminService.getAllCustomers(
      parseInt(page),
      parseInt(limit),
      search
    );
  }

  // IMPORTANTE: Esta rota deve vir ANTES de 'customers/:id' para evitar interceptação
  @Get('customers/cpf/:cpf')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.EMPLOYEE, UserRole.CASHIER)
  async getCustomerByCpf(@Param('cpf') cpf: string, @Request() req) {
    console.log('🔍 [Controller] Rota getCustomerByCpf chamada');
    console.log('🔍 [Controller] CPF recebido:', cpf);
    console.log('👤 [Controller] Usuário solicitante:', req.user?.id, req.user?.role);
    try {
      const customer = await this.adminService.getCustomerByCpf(cpf);
      console.log('✅ [Controller] Cliente encontrado:', customer.id);
      return customer;
    } catch (error) {
      console.error('❌ [Controller] Erro ao buscar cliente:', error);
      throw error;
    }
  }

  @Get('customers/:id')
  async getCustomerById(@Param('id') id: string) {
    return this.adminService.getCustomerById(id);
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
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
    description?: string;
    workingHours?: any;
    settings?: any;
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

  // ==================== PONTO ELETRÔNICO ====================

  @Post('time-clock')
  async registerTimeClock(@Body() timeClockData: any) {
    try {
      console.log('🕐 Dados de ponto recebidos:', JSON.stringify(timeClockData, null, 2));
      
      // Usar o TimeClockService para registrar o ponto
      const result = await this.adminService.registerTimeClock(timeClockData);
      
      console.log('✅ Ponto registrado com sucesso:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao registrar ponto:', error);
      throw error;
    }
  }

  // Endpoint de teste sem autenticação
  @Post('test-time-clock')
  async testTimeClock(@Body() timeClockData: any) {
    try {
      console.log('🧪 Teste de time-clock - Dados recebidos:', JSON.stringify(timeClockData, null, 2));
      
      return {
        message: 'Endpoint de teste funcionando',
        receivedData: timeClockData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      throw error;
    }
  }

  // Endpoint simples para registro de ponto
  @Post('simple-time-clock')
  async simpleTimeClock(@Body() timeClockData: any) {
    try {
      console.log('🕐 Simple time-clock - Dados recebidos:', JSON.stringify(timeClockData, null, 2));
      
      // Simular registro de ponto (temporário)
      const result = {
        id: `time-${Date.now()}`,
        employeeId: timeClockData.employeeId,
        date: new Date().toISOString().split('T')[0],
        clockIn: new Date().toTimeString().split(' ')[0].substring(0, 5),
        photo: timeClockData.photo ? 'Foto capturada' : null,
        latitude: timeClockData.latitude,
        longitude: timeClockData.longitude,
        address: timeClockData.address,
        status: 'PRESENT',
        createdAt: new Date().toISOString()
      };
      
      console.log('✅ Ponto registrado com sucesso:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao registrar ponto:', error);
      throw error;
    }
  }

  // ==================== FUNCIONÁRIOS ====================

  @Post('employees')
  async createEmployee(@Body() employeeData: CreateEmployeeDto) {
    try {
      console.log('🔍 Dados recebidos no controller:', JSON.stringify(employeeData, null, 2));
      console.log('🔍 Tipo dos dados:', typeof employeeData);
      console.log('🔍 Chaves dos dados:', Object.keys(employeeData));
      return await this.adminService.createEmployee(employeeData);
    } catch (error) {
      console.error('❌ Erro ao criar funcionário:', error);
      throw error;
    }
  }

  @Put('employees/:id')
  async updateEmployee(
    @Param('id') id: string,
    @Body() employeeData: UpdateEmployeeDto
  ) {
    return this.adminService.updateEmployee(id, employeeData);
  }

  @Delete('employees/:id')
  async deleteEmployee(@Param('id') id: string) {
    return this.adminService.deleteEmployee(id);
  }

  // ==================== FUNCIONÁRIOS POR LOJA ====================

  @Get('stores/:id/employees')
  async getStoreEmployees(@Param('id') id: string) {
    return this.adminService.getStoreEmployees(id);
  }

  // ==================== VENDAS POR LOJA ====================

  @Get('stores/:id/sales')
  async getStoreSales(@Param('id') id: string) {
    return this.adminService.getStoreSales(id);
  }

  @Get('stores/:id/sales/stats')
  async getStoreSalesStats(@Param('id') id: string) {
    return this.adminService.getStoreSalesStats(id);
  }

  // ==================== ANÁLISES E MÉTRICAS ====================

  @Get('stores/:id/analytics')
  async getStoreAnalytics(
    @Param('id') id: string,
    @Query('period') period: string = '30d'
  ) {
    return this.adminService.getStoreAnalytics(id, period);
  }

  // ==================== RELATÓRIOS POR LOJA ====================

  @Get('stores/:id/reports')
  async getStoreReport(
    @Param('id') id: string,
    @Query('type') type: string = 'sales',
    @Query('period') period: string = '30d',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.adminService.getStoreReport(id, {
      type,
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });
  }

  @Post('stores/:id/reports/export')
  async exportStoreReport(
    @Param('id') id: string,
    @Body() options: {
      type: string;
      period: string;
      format: 'pdf' | 'excel' | 'csv';
      startDate?: string;
      endDate?: string;
    }
  ) {
    return this.adminService.exportStoreReport(id, options);
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
  @UseInterceptors(FilesInterceptor('images', 10))
  async createProduct(
    @Body() productData: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    // Se há arquivos enviados, usar createProductWithImages
    if (files && files.length > 0) {
      return this.adminService.createProductWithImages(productData as any, files);
    }
    // Caso contrário, usar createProduct normal
    return this.adminService.createProduct(productData as any);
  }

  @Patch('products/:id')
  async patchProduct(
    @Param('id') id: string,
    @Body() productData: any
  ) {
    console.log('🔵 PATCH /admin/products/:id chamado', { id, productData });
    return this.adminService.updateProduct(id, productData);
  }

  @Put('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() productData: any
  ) {
    console.log('🟢 PUT /admin/products/:id chamado', { id, productData });
    return this.adminService.updateProduct(id, productData);
  }

  @Post('products/:id/generate-3d')
  @UseInterceptors(FilesInterceptor('images', 1))
  async generate3DForProduct(
    @Param('id') id: string,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    console.log('📥 Recebida requisição para gerar 3D. Files recebidos:', files?.length || 0);
    return this.adminService.generate3DForProduct(id, files?.[0]);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  // ==================== VENDAS ====================

  @Get('sales')
  async getAllSales(@Request() req) {
    return this.adminService.getAllSales(req.user.id);
  }

  // ==================== PEDIDOS ONLINE ====================

  @Get('orders-online')
  async getOnlineOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('status') status?: string,
    @Query('storeId') storeId?: string
  ) {
    return this.adminService.getOnlineOrders(
      parseInt(page),
      parseInt(limit),
      status,
      storeId
    );
  }

  @Get('orders-online/:id')
  async getOnlineOrderById(@Param('id') orderId: string) {
    return this.adminService.getOnlineOrderById(orderId);
  }

  @Put('orders-online/:id/status')
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() data: { status: string; trackingCode?: string }
  ) {
    return this.adminService.updateOrderStatus(orderId, data.status, data.trackingCode);
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

  // ==================== RELATÓRIOS SALVOS ====================

  @Get('reports')
  async getAllReports() {
    return this.adminService.getAllReports();
  }

  @Post('reports')
  async createReport(@Body() reportData: {
    name: string;
    type: string;
    period: string;
    status: string;
    data?: any;
    userId?: string;
    storeId?: string;
  }) {
    return this.adminService.createReport(reportData);
  }

  @Post('reports/generate-daily')
  async generateDailyReport(@Query('date') date?: string) {
    const reportDate = date ? new Date(date) : new Date();
    return this.adminService.generateDailyReport(reportDate);
  }

  @Delete('reports/:id')
  async deleteReport(@Param('id') id: string) {
    return this.adminService.deleteReport(id);
  }

  // ==================== ESTOQUE POR LOJA ====================
  // Permissão para ADMIN e STORE_MANAGER

  @Get('stores/:id/inventory')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async getStoreInventory(@Param('id') storeId: string) {
    return this.adminService.getStoreInventory(storeId);
  }

  @Get('stores/:id/inventory/available-products')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async getAvailableProductsForStore(
    @Param('id') storeId: string,
    @Query('search') search?: string
  ) {
    return this.adminService.getAvailableProductsForStore(storeId, search);
  }

  @Get('stores/:id/catalog/global-products')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async getGlobalProductsForCatalog(
    @Param('id') storeId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.adminService.getGlobalProductsForCatalog(
      storeId,
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50
    );
  }

  @Post('stores/:id/catalog/:productId')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async addProductToStoreCatalog(
    @Param('id') storeId: string,
    @Param('productId') productId: string
  ) {
    return this.adminService.addProductToStoreCatalog(storeId, productId);
  }

  @Put('stores/:id/inventory/:productId')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async updateStoreInventory(
    @Param('id') storeId: string,
    @Param('productId') productId: string,
    @Body() inventoryData: {
      quantity?: number;
      minStock?: number;
      maxStock?: number;
      location?: string;
      notes?: string;
    }
  ) {
    return this.adminService.updateStoreInventory(storeId, productId, inventoryData);
  }

  @Post('stores/:id/inventory/:productId')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async addProductToStore(
    @Param('id') storeId: string,
    @Param('productId') productId: string,
    @Body() data: { initialQuantity?: number; minStock?: number }
  ) {
    return this.adminService.addProductToStore(
      storeId,
      productId,
      data.initialQuantity || 0,
      data.minStock || 0
    );
  }

  @Delete('stores/:id/inventory/:productId')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async removeProductFromStore(
    @Param('id') storeId: string,
    @Param('productId') productId: string
  ) {
    return this.adminService.removeProductFromStore(storeId, productId);
  }

  // ==================== GESTÃO DE ATESTADOS MÉDICOS ====================

  @Post('medical-certificates')
  async createMedicalCertificate(
    @Request() req,
    @Body() createDto: CreateMedicalCertificateDto
  ) {
    return this.adminService.createMedicalCertificate(req.user.id, createDto);
  }

  @Get('medical-certificates')
  async getMedicalCertificates(
    @Query('employeeId') employeeId?: string
  ) {
    return this.adminService.getMedicalCertificates(employeeId);
  }

  @Get('medical-certificates/:id')
  async getMedicalCertificateById(@Param('id') id: string) {
    return this.adminService.getMedicalCertificateById(id);
  }

  @Post('medical-certificates/reactivate-expired')
  async reactivateEmployeesWithExpiredCertificates() {
    return this.adminService.reactivateEmployeesWithExpiredCertificates();
  }
}
