import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto } from '../dto/sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: CreateSaleDto, @Request() req) {
    return this.salesService.create(createSaleDto, req.user);
  }

  @Get()
  findAll(@Request() req, @Query('storeId') storeId?: string) {
    return this.salesService.findAll(req.user, storeId);
  }

  @Get('customer/:customerId')
  getSalesByCustomer(@Param('customerId') customerId: string, @Request() req) {
    return this.salesService.getSalesByCustomer(customerId, req.user);
  }

  @Get('date-range')
  getSalesByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
    @Query('storeId') storeId?: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.salesService.getSalesByDateRange(start, end, req.user, storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.salesService.findOne(id, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto, @Request() req) {
    return this.salesService.update(id, updateSaleDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.salesService.remove(id, req.user);
  }
}
