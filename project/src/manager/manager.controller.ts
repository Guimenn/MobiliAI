import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerInventoryService } from './manager-inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from '../admin/dto/create-user.dto';
import { UpdateUserDto } from '../admin/dto/update-user.dto';
import { CreateProductDto } from '../admin/dto/create-product.dto';
import { ChangePasswordDto } from '../admin/dto/change-password.dto';

@Controller('manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STORE_MANAGER, UserRole.ADMIN)
export class ManagerController {
  constructor(
    private readonly managerService: ManagerService,
    private readonly managerInventoryService: ManagerInventoryService
  ) {}

  // ==================== DASHBOARD DA FILIAL ====================
  
  @Get('dashboard')
  async getStoreDashboard(@Request() req) {
    return this.managerService.getStoreDashboard(req.user.id);
  }

  // ==================== GESTÃO DE USUÁRIOS DA FILIAL ====================

  @Get('users')
  async getStoreUsers(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = ''
  ) {
    return this.managerService.getStoreUsers(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      search
    );
  }

  @Get('users/:id')
  async getUserById(@Request() req, @Param('id') id: string) {
    return this.managerService.getUserById(req.user.id, id);
  }

  @Post('users')
  async createStoreUser(@Request() req, @Body() userData: CreateUserDto) {
    return this.managerService.createStoreUser(req.user.id, userData);
  }

  @Put('users/:id')
  async updateStoreUser(
    @Request() req,
    @Param('id') id: string,
    @Body() userData: UpdateUserDto
  ) {
    return this.managerService.updateStoreUser(req.user.id, id, userData);
  }

  @Delete('users/:id')
  async deleteStoreUser(@Request() req, @Param('id') id: string) {
    return this.managerService.deleteStoreUser(req.user.id, id);
  }

  @Put('users/:id/password')
  async changeUserPassword(
    @Request() req,
    @Param('id') id: string,
    @Body() data: ChangePasswordDto
  ) {
    return this.managerService.changeUserPassword(req.user.id, id, data.password);
  }

  // ==================== GESTÃO DE PRODUTOS DA FILIAL ====================

  @Get('products')
  async getStoreProducts(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
    @Query('category') category?: string
  ) {
    return this.managerService.getStoreProducts(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      search,
      category
    );
  }

  @Get('products/:id')
  async getProductById(@Request() req, @Param('id') id: string) {
    return this.managerService.getProductById(req.user.id, id);
  }

  @Post('products')
  async createStoreProduct(@Request() req, @Body() productData: CreateProductDto) {
    return this.managerService.createStoreProduct(req.user.id, productData as any);
  }

  @Put('products/:id')
  async updateStoreProduct(
    @Request() req,
    @Param('id') id: string,
    @Body() productData: any
  ) {
    return this.managerService.updateStoreProduct(req.user.id, id, productData);
  }

  @Delete('products/:id')
  async deleteStoreProduct(@Request() req, @Param('id') id: string) {
    return this.managerService.deleteStoreProduct(req.user.id, id);
  }

  // ==================== RELATÓRIOS DA FILIAL ====================

  @Get('reports/sales')
  async getStoreSalesReport(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.managerService.getStoreSalesReport(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('reports/inventory')
  async getStoreInventoryReport(@Request() req) {
    return this.managerService.getStoreInventoryReport(req.user.id);
  }

  @Get('reports/user-activity')
  async getStoreUserActivityReport(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.managerService.getStoreUserActivityReport(
      req.user.id,
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  // ==================== ESTATÍSTICAS DA FILIAL ====================

  @Get('stats/overview')
  async getStoreOverview(@Request() req) {
    const dashboard = await this.managerService.getStoreDashboard(req.user.id);
    return dashboard.overview;
  }

  @Get('stats/recent-sales')
  async getRecentSales(@Request() req) {
    const dashboard = await this.managerService.getStoreDashboard(req.user.id);
    return dashboard.recentSales;
  }

  @Get('stats/top-products')
  async getTopProducts(@Request() req) {
    const dashboard = await this.managerService.getStoreDashboard(req.user.id);
    return dashboard.topProducts;
  }

  @Get('stats/alerts')
  async getStoreAlerts(@Request() req) {
    const dashboard = await this.managerService.getStoreDashboard(req.user.id);
    return dashboard.alerts;
  }

  // ==================== INFORMAÇÕES DA LOJA ====================

  @Get('store')
  async getStoreInfo(@Request() req) {
    const dashboard = await this.managerService.getStoreDashboard(req.user.id);
    return dashboard.store;
  }

  // ==================== CONTROLE DE ESTOQUE ====================

  @Get('inventory/status')
  async getInventoryStatus(@Request() req) {
    return this.managerInventoryService.getInventoryStatus(req.user.id);
  }

  @Get('inventory/alerts')
  async getInventoryAlerts(@Request() req) {
    return this.managerInventoryService.getInventoryAlerts(req.user.id);
  }

  @Put('inventory/products/:id/stock')
  async updateProductStock(
    @Request() req,
    @Param('id') productId: string,
    @Body() data: { stock: number }
  ) {
    return this.managerInventoryService.updateProductStock(req.user.id, productId, data.stock);
  }

  @Post('inventory/products/:id/adjust')
  async adjustInventory(
    @Request() req,
    @Param('id') productId: string,
    @Body() data: { adjustment: number; reason: string }
  ) {
    return this.managerInventoryService.adjustInventory(req.user.id, productId, data.adjustment, data.reason);
  }

  @Get('inventory/report')
  async getInventoryReport(
    @Request() req,
    @Query('category') category?: string
  ) {
    return this.managerInventoryService.getInventoryReport(req.user.id, category);
  }

  @Get('inventory/movement')
  async getStockMovement(
    @Request() req,
    @Query('productId') productId?: string,
    @Query('days') days: string = '30'
  ) {
    return this.managerInventoryService.getStockMovement(req.user.id, productId, parseInt(days));
  }

  // ==================== ESTOQUE POR LOJA (StoreInventory) ====================
  // Permite que gerentes gerenciem estoque da própria loja

  @Get('inventory')
  async getStoreInventory(@Request() req) {
    const userStoreId = req.user.storeId;
    if (!userStoreId) {
      throw new Error('Usuário não está vinculado a uma loja');
    }
    return this.managerService.getStoreInventory(userStoreId);
  }

  @Put('inventory/:productId')
  async updateStoreInventory(
    @Request() req,
    @Param('productId') productId: string,
    @Body() inventoryData: {
      quantity?: number;
      minStock?: number;
      maxStock?: number;
      location?: string;
      notes?: string;
    }
  ) {
    const userStoreId = req.user.storeId;
    if (!userStoreId) {
      throw new Error('Usuário não está vinculado a uma loja');
    }
    return this.managerService.updateStoreInventory(userStoreId, productId, inventoryData);
  }

  @Post('inventory/:productId')
  async addProductToStore(
    @Request() req,
    @Param('productId') productId: string,
    @Body() data: { initialQuantity?: number; minStock?: number }
  ) {
    const userStoreId = req.user.storeId;
    if (!userStoreId) {
      throw new Error('Usuário não está vinculado a uma loja');
    }
    return this.managerService.addProductToStore(
      userStoreId,
      productId,
      data.initialQuantity || 0,
      data.minStock || 0
    );
  }

  @Delete('inventory/:productId')
  async removeProductFromStore(
    @Request() req,
    @Param('productId') productId: string
  ) {
    const userStoreId = req.user.storeId;
    if (!userStoreId) {
      throw new Error('Usuário não está vinculado a uma loja');
    }
    return this.managerService.removeProductFromStore(userStoreId, productId);
  }
}
