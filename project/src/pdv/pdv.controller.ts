import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PdvService } from './pdv.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { OpenCashDto } from './dto/open-cash.dto';
import { CloseCashDto } from './dto/close-cash.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pdv')
@UseGuards(JwtAuthGuard)
export class PdvController {
  constructor(private readonly pdvService: PdvService) {}

  // Controle de Caixa
  @Post('cash/open')
  openCash(@Body() openCashDto: OpenCashDto, @Request() req) {
    return this.pdvService.openCash(openCashDto, req.user.id, req.user.storeId);
  }

  @Get('cash/current')
  getCurrentCash(@Request() req) {
    return this.pdvService.getCurrentCash(req.user.storeId);
  }

  @Post('cash/close')
  closeCash(@Body() closeCashDto: CloseCashDto, @Request() req) {
    return this.pdvService.closeCash(closeCashDto, req.user.id, req.user.storeId);
  }

  // Vendas
  @Post('sales')
  createSale(@Body() createSaleDto: CreateSaleDto, @Request() req) {
    return this.pdvService.createSale(createSaleDto, req.user.id, req.user.storeId);
  }

  @Get('sales')
  getSales(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.pdvService.getSales(req.user.storeId, req.user.role, start, end);
  }

  @Get('sales/report')
  getSalesReport(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.pdvService.getSalesReport(
      req.user.storeId,
      req.user.role,
      new Date(startDate),
      new Date(endDate),
    );
  }
}

