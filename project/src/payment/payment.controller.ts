import { Controller, Post, Get, Body, Param, UseGuards, Request, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('payment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Cria um pagamento PIX para uma venda
   */
  @Post('pix/create')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CASHIER, UserRole.STORE_MANAGER)
  async createPixPayment(
    @Request() req,
    @Body() data: {
      saleId: string;
      customerInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        cpf?: string;
      };
    }
  ) {
    try {
      if (!data.saleId) {
        throw new BadRequestException('ID da venda é obrigatório');
      }

      // Buscar a venda para verificar se pertence ao usuário
      const sale = await this.prisma.sale.findUnique({
        where: { id: data.saleId },
        select: { customerId: true, totalAmount: true, status: true, paymentReference: true },
      });

      if (!sale) {
        console.error('Venda não encontrada:', data.saleId);
        throw new BadRequestException(`Venda com ID ${data.saleId} não encontrada`);
      }

      console.log('Venda encontrada:', {
        saleId: data.saleId,
        customerId: sale.customerId,
        userId: req.user.id,
        status: sale.status,
        totalAmount: sale.totalAmount,
        hasPaymentReference: !!sale.paymentReference,
      });

      // Verificar se a venda pertence ao usuário (exceto admin, funcionários e gerentes)
      const isEmployeeOrManager = req.user.role === UserRole.ADMIN || 
                                   req.user.role === UserRole.EMPLOYEE || 
                                   req.user.role === UserRole.CASHIER || 
                                   req.user.role === UserRole.STORE_MANAGER;
      
      if (!isEmployeeOrManager && sale.customerId !== req.user.id) {
        console.error('Venda não pertence ao usuário:', {
          saleCustomerId: sale.customerId,
          userId: req.user.id,
        });
        throw new ForbiddenException('Venda não pertence ao usuário');
      }

      return await this.paymentService.createPixPayment(
        data.saleId,
        Number(sale.totalAmount),
        data.customerInfo
      );
    } catch (error: any) {
      console.error('Erro ao criar pagamento PIX:', {
        userId: req.user.id,
        saleId: data.saleId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Verifica o status de um pagamento PIX
   */
  @Get('pix/status/:saleId')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CASHIER, UserRole.STORE_MANAGER)
  async checkPaymentStatus(@Request() req, @Param('saleId') saleId: string) {
    // Buscar a venda para verificar se pertence ao usuário
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      select: { customerId: true },
    });

    if (!sale) {
      throw new BadRequestException('Venda não encontrada');
    }

    // Verificar se a venda pertence ao usuário (exceto admin, funcionários e gerentes)
    const isEmployeeOrManager = req.user.role === UserRole.ADMIN || 
                                 req.user.role === UserRole.EMPLOYEE || 
                                 req.user.role === UserRole.CASHIER || 
                                 req.user.role === UserRole.STORE_MANAGER;
    
    if (!isEmployeeOrManager && sale.customerId !== req.user.id) {
      throw new ForbiddenException('Venda não pertence ao usuário');
    }

    return this.paymentService.checkSalePaymentStatus(saleId);
  }

  /**
   * Simula o pagamento de um QR Code PIX (apenas ambientes não produtivos)
   */
  @Post('pix/simulate')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CASHIER, UserRole.STORE_MANAGER)
  async simulatePixPayment(
    @Request() req,
    @Body() data: { saleId: string },
  ) {
    if (!data.saleId) {
      throw new BadRequestException('ID da venda é obrigatório');
    }

    const sale = await this.prisma.sale.findUnique({
      where: { id: data.saleId },
      select: { customerId: true },
    });

    if (!sale) {
      throw new BadRequestException('Venda não encontrada');
    }

    const isEmployeeOrManager = req.user.role === UserRole.ADMIN || 
                                 req.user.role === UserRole.EMPLOYEE || 
                                 req.user.role === UserRole.CASHIER || 
                                 req.user.role === UserRole.STORE_MANAGER;
    
    if (!isEmployeeOrManager && sale.customerId !== req.user.id) {
      throw new ForbiddenException('Venda não pertence ao usuário');
    }

    return this.paymentService.simulatePixPayment(data.saleId);
  }

  /**
   * Cria pagamento por Cartão de Crédito (checkout AbacatePay)
   */
  @Post('card/create')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CASHIER, UserRole.STORE_MANAGER)
  async createCardPayment(
    @Request() req,
    @Body() data: {
      saleId: string;
      customerInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        cpf?: string;
      };
      installments?: number;
    }
  ) {
    if (!data.saleId) {
      throw new BadRequestException('ID da venda é obrigatório');
    }

    const sale = await this.prisma.sale.findUnique({
      where: { id: data.saleId },
      select: { customerId: true, totalAmount: true },
    });

    if (!sale) {
      throw new BadRequestException(`Venda com ID ${data.saleId} não encontrada`);
    }

    const isEmployeeOrManager = req.user.role === UserRole.ADMIN || 
                                 req.user.role === UserRole.EMPLOYEE || 
                                 req.user.role === UserRole.CASHIER || 
                                 req.user.role === UserRole.STORE_MANAGER;
    
    if (!isEmployeeOrManager && sale.customerId !== req.user.id) {
      throw new ForbiddenException('Venda não pertence ao usuário');
    }

    return this.paymentService.createCardPayment(
      data.saleId,
      Number(sale.totalAmount),
      data.customerInfo,
      { installments: data.installments },
    );
  }

  /**
   * Cria um PaymentIntent do Stripe para pagamento com cartão
   */
  @Post('stripe/create-intent')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CASHIER, UserRole.STORE_MANAGER)
  async createStripePaymentIntent(
    @Request() req,
    @Body() data: {
      saleId: string;
      customerInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        cpf?: string;
      };
    }
  ) {
    if (!data.saleId) {
      throw new BadRequestException('ID da venda é obrigatório');
    }

    // Garantir conexão com o banco antes de buscar a venda
    await this.prisma.ensureConnection();

    const sale = await this.prisma.executeWithRetry(async () => {
      return await this.prisma.sale.findUnique({
        where: { id: data.saleId },
        select: { customerId: true, totalAmount: true, saleNumber: true },
      });
    });

    if (!sale) {
      console.error('Venda não encontrada:', {
        saleId: data.saleId,
        userId: req.user.id,
        userRole: req.user.role,
      });
      throw new BadRequestException(`Venda com ID ${data.saleId} não encontrada. Verifique se o pedido foi criado corretamente.`);
    }

    const isEmployeeOrManager = req.user.role === UserRole.ADMIN || 
                                 req.user.role === UserRole.EMPLOYEE || 
                                 req.user.role === UserRole.CASHIER || 
                                 req.user.role === UserRole.STORE_MANAGER;
    
    if (!isEmployeeOrManager && sale.customerId !== req.user.id) {
      throw new ForbiddenException('Venda não pertence ao usuário');
    }

    return this.paymentService.createStripePaymentIntent(
      data.saleId,
      Number(sale.totalAmount),
      data.customerInfo
    );
  }

  /**
   * Confirma o pagamento do Stripe após confirmação no frontend
   */
  @Post('stripe/confirm')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CASHIER, UserRole.STORE_MANAGER)
  async confirmStripePayment(
    @Request() req,
    @Body() data: { paymentIntentId: string }
  ) {
    if (!data.paymentIntentId) {
      throw new BadRequestException('ID do PaymentIntent é obrigatório');
    }

    // Verificar se o pagamento pertence ao usuário
    const paymentStatus = await this.paymentService.checkStripePaymentStatus(data.paymentIntentId);
    
    if (paymentStatus.saleId) {
      const sale = await this.prisma.sale.findUnique({
        where: { id: paymentStatus.saleId },
        select: { customerId: true },
      });

      const isEmployeeOrManager = req.user.role === UserRole.ADMIN || 
                                   req.user.role === UserRole.EMPLOYEE || 
                                   req.user.role === UserRole.CASHIER || 
                                   req.user.role === UserRole.STORE_MANAGER;
      
      if (sale && !isEmployeeOrManager && sale.customerId !== req.user.id) {
        throw new ForbiddenException('Pagamento não pertence ao usuário');
      }
    }

    return this.paymentService.confirmStripePayment(data.paymentIntentId);
  }

  /**
   * Verifica o status de um pagamento Stripe
   */
  @Get('stripe/status/:paymentIntentId')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CASHIER, UserRole.STORE_MANAGER)
  async checkStripePaymentStatus(
    @Request() req,
    @Param('paymentIntentId') paymentIntentId: string
  ) {
    const paymentStatus = await this.paymentService.checkStripePaymentStatus(paymentIntentId);
    
    // Verificar se o pagamento pertence ao usuário
    if (paymentStatus.saleId) {
      const sale = await this.prisma.sale.findUnique({
        where: { id: paymentStatus.saleId },
        select: { customerId: true },
      });

      const isEmployeeOrManager = req.user.role === UserRole.ADMIN || 
                                   req.user.role === UserRole.EMPLOYEE || 
                                   req.user.role === UserRole.CASHIER || 
                                   req.user.role === UserRole.STORE_MANAGER;
      
      if (sale && !isEmployeeOrManager && sale.customerId !== req.user.id) {
        throw new ForbiddenException('Pagamento não pertence ao usuário');
      }
    }

    return paymentStatus;
  }

  /**
   * Simula o pagamento de um boleto do Stripe (apenas ambientes não produtivos)
   */
  @Post('stripe/simulate-boleto')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CASHIER, UserRole.STORE_MANAGER)
  async simulateBoletoPayment(
    @Request() req,
    @Body() data: { saleId: string },
  ) {
    if (!data.saleId) {
      throw new BadRequestException('ID da venda é obrigatório');
    }

    const sale = await this.prisma.sale.findUnique({
      where: { id: data.saleId },
      select: { customerId: true },
    });

    if (!sale) {
      throw new BadRequestException('Venda não encontrada');
    }

    const isEmployeeOrManager = req.user.role === UserRole.ADMIN || 
                                 req.user.role === UserRole.EMPLOYEE || 
                                 req.user.role === UserRole.CASHIER || 
                                 req.user.role === UserRole.STORE_MANAGER;
    
    if (!isEmployeeOrManager && sale.customerId !== req.user.id) {
      throw new ForbiddenException('Venda não pertence ao usuário');
    }

    return this.paymentService.simulateBoletoPayment(data.saleId);
  }
}

