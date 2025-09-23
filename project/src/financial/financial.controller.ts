import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FinancialService } from './financial.service';
import { CreateCashFlowDto } from './dto/create-cash-flow.dto';
import { CreateCashExpenseDto } from './dto/create-cash-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('financial')
@UseGuards(JwtAuthGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // Fluxo de Caixa
  @Post('cash-flow')
  createCashFlow(@Body() createCashFlowDto: CreateCashFlowDto, @Request() req) {
    return this.financialService.createCashFlow(
      createCashFlowDto,
      req.user.id,
      req.user.storeId,
      req.user.role,
    );
  }

  @Get('cash-flow')
  getCashFlow(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.financialService.getCashFlow(req.user.storeId, req.user.role, start, end);
  }

  @Get('cash-flow/report')
  getCashFlowReport(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financialService.getCashFlowReport(
      req.user.storeId,
      req.user.role,
      new Date(startDate),
      new Date(endDate),
    );
  }

  // Despesas de Caixa
  @Post('expenses')
  createCashExpense(@Body() createCashExpenseDto: CreateCashExpenseDto, @Request() req) {
    return this.financialService.createCashExpense(
      createCashExpenseDto,
      req.user.id,
      req.user.storeId,
      req.user.role,
    );
  }

  @Get('expenses')
  getCashExpenses(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.financialService.getCashExpenses(req.user.storeId, req.user.role, start, end);
  }

  // Relatórios Consolidados (apenas ADMIN)
  @Get('consolidated-report')
  getConsolidatedReport(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financialService.getConsolidatedReport(
      req.user.role,
      new Date(startDate),
      new Date(endDate),
    );
  }
}

