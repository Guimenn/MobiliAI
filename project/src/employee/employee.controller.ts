import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeInventoryService } from './employee-inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('employee')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CASHIER)
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly employeeInventoryService: EmployeeInventoryService
  ) {}

  // ==================== DASHBOARD DO FUNCIONÁRIO ====================
  
  @Get('dashboard')
  async getEmployeeDashboard(@Request() req) {
    return this.employeeService.getEmployeeDashboard(req.user.id);
  }

  @Get('store')
  async getStoreInfo(@Request() req) {
    return this.employeeService.getStoreInfo(req.user.id);
  }

  @Get('stats')
  async getInventoryStats(@Request() req) {
    return this.employeeService.getInventoryStats(req.user.id);
  }

  // ==================== CONTROLE DE ESTOQUE ====================

  @Get('inventory/status')
  async getInventoryStatus(@Request() req) {
    return this.employeeInventoryService.getInventoryStatus(req.user.id);
  }

  @Get('inventory/alerts')
  async getInventoryAlerts(@Request() req) {
    return this.employeeInventoryService.getInventoryAlerts(req.user.id);
  }

  @Get('products')
  async getStoreProducts(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
    @Query('category') category?: string
  ) {
    return this.employeeInventoryService.getStoreProducts(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      search,
      category
    );
  }

  @Get('inventory/products')
  async getProductsByCategory(
    @Request() req,
    @Query('category') category?: string
  ) {
    return this.employeeInventoryService.getProductsByCategory(req.user.id, category);
  }

  @Get('inventory/search')
  async searchProducts(
    @Request() req,
    @Query('q') searchTerm: string,
    @Query('category') category?: string
  ) {
    return this.employeeInventoryService.searchProducts(req.user.id, searchTerm, category);
  }

  @Put('inventory/products/:id/stock')
  async updateProductStock(
    @Request() req,
    @Param('id') productId: string,
    @Body() data: { stock: number }
  ) {
    return this.employeeInventoryService.updateProductStock(req.user.id, productId, data.stock);
  }

  @Post('inventory/products/:id/adjust')
  async adjustInventory(
    @Request() req,
    @Param('id') productId: string,
    @Body() data: { adjustment: number; reason: string }
  ) {
    return this.employeeInventoryService.adjustInventory(req.user.id, productId, data.adjustment, data.reason);
  }

  // ==================== RELATÓRIOS DE ESTOQUE ====================

  @Get('inventory/report')
  async getInventoryReport(
    @Request() req,
    @Query('category') category?: string
  ) {
    return this.employeeInventoryService.getInventoryReport(req.user.id, category);
  }

  @Get('inventory/movement')
  async getStockMovement(
    @Request() req,
    @Query('productId') productId?: string,
    @Query('days') days: string = '30'
  ) {
    return this.employeeInventoryService.getStockMovement(req.user.id, productId, parseInt(days));
  }

  // ==================== PEDIDOS ONLINE DA LOJA ====================

  @Get('orders-online')
  async getStoreOnlineOrders(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('status') status?: string
  ) {
    // Funcionários usam os mesmos métodos do manager (apenas da loja)
    return this.employeeService.getStoreOnlineOrders(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      status
    );
  }

  @Get('orders-online/:id')
  async getStoreOnlineOrderById(@Request() req, @Param('id') orderId: string) {
    return this.employeeService.getStoreOnlineOrderById(req.user.id, orderId);
  }

  @Put('orders-online/:id/status')
  async updateStoreOnlineOrderStatus(
    @Request() req,
    @Param('id') orderId: string,
    @Body() data: { status: string; trackingCode?: string }
  ) {
    return this.employeeService.updateStoreOnlineOrderStatus(
      req.user.id,
      orderId,
      data.status,
      data.trackingCode
    );
  }

  // ==================== INFORMAÇÕES BÁSICAS ====================

  @Get('profile')
  async getProfile(@Request() req) {
    const employee = await this.employeeService.getStoreInfo(req.user.id);
    return {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      store: employee
    };
  }
}
