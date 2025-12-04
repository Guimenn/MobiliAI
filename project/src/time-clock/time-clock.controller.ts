import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { TimeClockService } from './time-clock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateTimeClockDto } from './dto/create-time-clock.dto';
import { UpdateTimeClockDto } from './dto/update-time-clock.dto';
import { ClockOutDto } from './dto/clock-out.dto';

@Controller('time-clock')
export class TimeClockController {
  constructor(private readonly timeClockService: TimeClockService) {}

  // Registrar ponto (entrada/saída)
  @Post('clock-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER)
  async clockIn(@Body() createTimeClockDto: CreateTimeClockDto) {
    return this.timeClockService.clockIn(createTimeClockDto);
  }

  // Unified registration endpoint for frontend integration
  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER)
  async register(@Body() createTimeClockDto: CreateTimeClockDto) {
    try {
      console.log('🕐 [REAL DATA] Registrando ponto para funcionário:', createTimeClockDto.employeeId);
      
      // Check if employee has an open time clock entry for today
      const today = new Date().toISOString().split('T')[0];
      const existingEntry = await this.timeClockService.getEmployeeTimeClock(
        createTimeClockDto.employeeId, 
        today, 
        today
      );
      
      const openEntry = existingEntry.find(entry => !entry.clockOut);
      
      if (openEntry) {
        // Employee has an open entry, so this is a clock-out
        console.log('🚪 [REAL DATA] Registrando saída - entrada aberta encontrada');
        const result = await this.timeClockService.clockOut({
          employeeId: createTimeClockDto.employeeId,
          photo: createTimeClockDto.photo,
          latitude: createTimeClockDto.latitude,
          longitude: createTimeClockDto.longitude,
          address: createTimeClockDto.address
        });
        
        return {
          ...result,
          action: 'clock-out',
          timestamp: new Date().toISOString()
        };
      } else {
        // No open entry, so this is a clock-in
        console.log('🚪 [REAL DATA] Registrando entrada - nenhuma entrada aberta');
        const result = await this.timeClockService.clockIn(createTimeClockDto);
        
        return {
          ...result,
          action: 'clock-in',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('❌ [REAL DATA] Erro ao registrar ponto:', error);
      throw error;
    }
  }

  @Post('clock-out')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER)
  async clockOut(@Body() clockOutDto: ClockOutDto) {
    try {
      console.log('🚪 [REAL DATA] Registrando saída para funcionário:', clockOutDto.employeeId);
      
      // Validate that employee has an open time clock entry
      const today = new Date().toISOString().split('T')[0];
      const existingEntries = await this.timeClockService.getEmployeeTimeClock(
        clockOutDto.employeeId, 
        today, 
        today
      );
      
      const openEntry = existingEntries.find(entry => !entry.clockOut);
      
      if (!openEntry) {
        throw new Error('Não existe ponto de entrada para fechar');
      }
      
      // Call the service method with proper validation and time calculations
      const result = await this.timeClockService.clockOut(clockOutDto);
      
      console.log('✅ [REAL DATA] Saída registrada com sucesso');
      return {
        ...result,
        action: 'clock-out',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ [REAL DATA] Erro ao registrar saída:', error);
      throw error;
    }
  }

  // Obter registros de ponto
  @Get('employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async getEmployeeTimeClock(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.timeClockService.getEmployeeTimeClock(employeeId, startDate, endDate);
  }

  // History endpoint for frontend integration (moved from AppController)
  @Get('history/:employeeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER, UserRole.EMPLOYEE)
  async getTimeClockHistory(
    @Param('employeeId') employeeId: string, 
    @Query('startDate') startDate?: string, 
    @Query('endDate') endDate?: string,
    @Request() req?: any
  ) {
    try {
      // Se for EMPLOYEE, só pode ver seu próprio histórico
      if (req?.user?.role === UserRole.EMPLOYEE && req?.user?.id !== employeeId) {
        throw new ForbiddenException('Você só pode ver seu próprio histórico de ponto');
      }
      
      console.log('📊 [REAL DATA] Buscando histórico do funcionário:', employeeId);
      console.log('📅 [REAL DATA] Filtros - Início:', startDate, 'Fim:', endDate);
      
      // Buscar dados reais do banco de dados
      const records = await this.timeClockService.getEmployeeTimeClock(employeeId, startDate, endDate);
      console.log('🔍 [REAL DATA] Records encontrados:', records);
      
      console.log('✅ Histórico encontrado:', records.length, 'registros');
      return {
        employeeId,
        records: records,
        totalRecords: records.length,
        period: {
          startDate: startDate || 'Não especificado',
          endDate: endDate || 'Não especificado'
        }
      };
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      throw error;
    }
  }

  // Buscar detalhes de um ponto específico
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER)
  async getTimeClockDetails(@Param('id') id: string) {
    return this.timeClockService.getTimeClockDetails(id);
  }

  @Get('store/:storeId')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async getStoreTimeClock(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.timeClockService.getStoreTimeClock(storeId, startDate, endDate);
  }

  // Atualizar registro de ponto
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async updateTimeClock(
    @Param('id') id: string,
    @Body() updateTimeClockDto: UpdateTimeClockDto
  ) {
    return this.timeClockService.updateTimeClock(id, updateTimeClockDto);
  }

  // Deletar registro de ponto
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteTimeClock(@Param('id') id: string) {
    return this.timeClockService.deleteTimeClock(id);
  }

  // Relatórios
  @Get('reports/employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async getEmployeeReport(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.timeClockService.getEmployeeReport(employeeId, startDate, endDate);
  }

  @Get('reports/store/:storeId')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async getStoreReport(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.timeClockService.getStoreReport(storeId, startDate, endDate);
  }
}
