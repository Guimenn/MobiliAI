import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('store/:storeId/overview')
  async getStoreOverview(@Param('storeId') storeId: string) {
    return this.dashboardService.getStoreOverview(storeId);
  }

  @Get('store/:storeId/sales')
  async getStoreSales(@Param('storeId') storeId: string) {
    return this.dashboardService.getStoreSales(storeId);
  }

  @Get('store/:storeId/attendance')
  async getStoreAttendance(@Param('storeId') storeId: string) {
    return this.dashboardService.getStoreAttendance(storeId);
  }

  @Get('store/:storeId/employee-performance')
  async getEmployeePerformance(@Param('storeId') storeId: string) {
    return this.dashboardService.getEmployeePerformance(storeId);
  }

  @Get('store/:storeId/recent-activity')
  async getRecentActivity(@Param('storeId') storeId: string) {
    return this.dashboardService.getRecentActivity(storeId);
  }
}
