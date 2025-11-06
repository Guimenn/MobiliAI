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
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
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

      // Verificar se a venda pertence ao usuário (exceto admin)
      if (req.user.role !== UserRole.ADMIN && sale.customerId !== req.user.id) {
        console.error('Venda não pertence ao usuário:', {
          saleCustomerId: sale.customerId,
          userId: req.user.id,
        });
        throw new ForbiddenException('Venda não pertence ao usuário');
      }

      // Se já existe um pagamento PIX para esta venda, retornar os dados existentes
      if (sale.paymentReference && sale.paymentReference.startsWith('MOCK-')) {
        console.log('Pagamento mock já existe para esta venda, retornando dados existentes');
        // Buscar informações completas da venda
        const fullSale = await this.prisma.sale.findUnique({
          where: { id: data.saleId },
          select: { saleNumber: true },
        });
        
        return {
          qrCode: `00020126580014br.gov.bcb.pix0136${data.saleId}5204000053039865802BR5925MobiliAI Loja de Tintas6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          qrCodeImage: null,
          paymentId: sale.paymentReference,
          expiresAt: new Date(Date.now() + 3600000), // 1 hora
          amount: Number(sale.totalAmount),
          saleId: data.saleId,
          saleNumber: fullSale?.saleNumber || 'MOCK',
        };
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
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  async checkPaymentStatus(@Request() req, @Param('saleId') saleId: string) {
    // Buscar a venda para verificar se pertence ao usuário
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      select: { customerId: true },
    });

    if (!sale) {
      throw new BadRequestException('Venda não encontrada');
    }

    // Verificar se a venda pertence ao usuário (exceto admin)
    if (req.user.role !== UserRole.ADMIN && sale.customerId !== req.user.id) {
      throw new ForbiddenException('Venda não pertence ao usuário');
    }

    return this.paymentService.checkSalePaymentStatus(saleId);
  }

  /**
   * Cria pagamento por Cartão de Crédito (checkout AbacatePay)
   */
  @Post('card/create')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
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

    if (req.user.role !== UserRole.ADMIN && sale.customerId !== req.user.id) {
      throw new ForbiddenException('Venda não pertence ao usuário');
    }

    return this.paymentService.createCardPayment(
      data.saleId,
      Number(sale.totalAmount),
      data.customerInfo
    );
  }

  /**
   * Cria pagamento por Boleto (checkout AbacatePay)
   */
  @Post('boleto/create')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  async createBoletoPayment(
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

    const sale = await this.prisma.sale.findUnique({
      where: { id: data.saleId },
      select: { customerId: true, totalAmount: true },
    });

    if (!sale) {
      throw new BadRequestException(`Venda com ID ${data.saleId} não encontrada`);
    }

    if (req.user.role !== UserRole.ADMIN && sale.customerId !== req.user.id) {
      throw new ForbiddenException('Venda não pertence ao usuário');
    }

    return this.paymentService.createBoletoPayment(
      data.saleId,
      Number(sale.totalAmount),
      data.customerInfo
    );
  }
}

