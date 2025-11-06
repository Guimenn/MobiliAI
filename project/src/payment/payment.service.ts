import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  private readonly apiKey: string;
  private readonly environment: string;
  private readonly baseUrl: string;
  private readonly returnUrl: string;
  private readonly completionUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.apiKey = this.configService.get<string>('ABACATEPAY_API_KEY') || '';
    this.environment = this.configService.get<string>('ABACATEPAY_ENVIRONMENT') || 'sandbox';
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.abacatepay.com'
      : 'https://sandbox.abacatepay.com';
    this.returnUrl = this.configService.get<string>('ABACATEPAY_RETURN_URL') 
      || this.configService.get<string>('FRONTEND_BASE_URL')
      || 'http://localhost:3000/payment/return';
    this.completionUrl = this.configService.get<string>('ABACATEPAY_COMPLETION_URL') 
      || this.configService.get<string>('FRONTEND_BASE_URL')
      || 'http://localhost:3000/checkout/success';
  }

  /**
   * Instancia o cliente oficial do AbacatePay (SDK).
   * Usa require dinâmico para evitar problemas de tipo/interop em ambientes CJS/ESM.
   */
  private getAbacateClient() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SDK = (require('abacatepay-nodejs-sdk')?.default) || require('abacatepay-nodejs-sdk');
    return SDK(this.apiKey);
  }

  /**
   * Cria uma cobrança (billing) na AbacatePay para um método específico
   * Suporta: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
   */
  private async createBillingForSale(
    saleId: string,
    method: 'PIX' | 'CREDIT_CARD' | 'BOLETO',
    amount: number,
    customerInfo?: { name?: string; email?: string; phone?: string; cpf?: string; }
  ) {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new BadRequestException('AbacatePay API key não configurada.');
    }

    // Buscar a venda com itens e cliente
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: { product: true }
        },
        customer: {
          select: { name: true, email: true, phone: true, cpf: true }
        }
      }
    });

    if (!sale) {
      throw new BadRequestException('Venda não encontrada');
    }

    const products = (sale.items || []).map((it) => ({
      externalId: it.productId,
      name: it.product?.name || 'Produto',
      quantity: it.quantity,
      price: Math.round(Number(it.unitPrice) * 100), // centavos
    }));

    const customer = {
      name: customerInfo?.name || sale.customer?.name || undefined,
      email: customerInfo?.email || sale.customer?.email || undefined,
      cellphone: customerInfo?.phone || sale.customer?.phone || undefined,
      tax_id: customerInfo?.cpf || sale.customer?.cpf || undefined,
    };

    try {
      const abacate = this.getAbacateClient();

      const billing = await abacate.billing.create({
        frequency: 'ONE_TIME',
        methods: [method],
        products: products.length > 0 ? products : [{
          externalId: saleId,
          name: `Pedido ${sale.saleNumber}`,
          quantity: 1,
          price: Math.round(Number(amount) * 100),
        }],
        returnUrl: this.returnUrl,
        completionUrl: `${this.completionUrl}?orderId=${saleId}`,
        customer: {
          email: customer.email,
          name: customer.name,
          cellphone: customer.cellphone,
          tax_id: customer.tax_id,
        },
      });

      const provider = billing || {};
      const providerData = provider.data || provider;

      // Persistir referência no pedido
      const paymentId: string = providerData.id || providerData.reference || providerData.paymentId || '';
      if (paymentId) {
        await this.prisma.sale.update({
          where: { id: saleId },
          data: { paymentReference: paymentId },
        });
      }

      // Tentar extrair dados úteis
      const checkoutUrl = providerData.checkoutUrl || providerData.paymentLink || providerData.url;
      const pixBrCode = providerData?.pix?.brCode || providerData?.brCode || providerData?.qrCode || providerData?.code;
      const expiresAt = providerData.expiresAt
        ? new Date(providerData.expiresAt)
        : new Date(Date.now() + 3600000);

      return {
        paymentId: paymentId || `ABACATE-${saleId}`,
        checkoutUrl,
        qrCode: method === 'PIX' ? pixBrCode : undefined,
        amount,
        expiresAt,
        saleId,
        saleNumber: sale.saleNumber,
        providerResponse: providerData,
      };
    } catch (error: any) {
      // Em caso de erro, podemos aplicar fallbacks em desenvolvimento
      const isNetworkError = error.code === 'ENOTFOUND' || 
        error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('getaddrinfo') ||
        error.message?.includes('ECONNREFUSED');

      // Em desenvolvimento, faça fallback para mock em QUALQUER erro do provedor
      if (this.environment !== 'production') {
        const mockQrCode = `00020126580014br.gov.bcb.pix0136${saleId}5204000053039865802BR5925MobiliAI Loja de Tintas6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await this.prisma.sale.update({
          where: { id: saleId },
          data: { paymentReference: `MOCK-${saleId}-${Date.now()}` },
        });

        return {
          paymentId: `MOCK-${saleId}`,
          checkoutUrl: undefined,
          qrCode: method === 'PIX' ? mockQrCode : undefined,
          amount,
          expiresAt: new Date(Date.now() + 3600000),
          saleId,
          saleNumber: sale.saleNumber,
          providerResponse: { mock: true },
        };
      }

      console.error('Erro AbacatePay (billing.create):', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });

      throw new BadRequestException(
        error.response?.data?.message || error.response?.data?.error || 'Erro ao criar cobrança na AbacatePay'
      );
    }
  }

  /**
   * Cria uma cobrança PIX e retorna o QR code
   */
  async createPixPayment(
    saleId: string,
    amount: number,
    customerInfo?: {
      name?: string;
      email?: string;
      phone?: string;
      cpf?: string;
    }
  ) {
    // Se tiver SDK e chave, usar billing.create (Abacate oficial)
    if (this.apiKey && this.apiKey.trim() !== '') {
      return this.createBillingForSale(saleId, 'PIX', amount, customerInfo);
    }

    // Modo de desenvolvimento: se não houver API key configurada, gerar QR code mock
    if (!this.apiKey || this.apiKey.trim() === '') {
      if (this.environment !== 'production') {
        console.warn('⚠️ AbacatePay API key não configurada. Usando modo de desenvolvimento com QR code mock.');
        
        // Buscar informações da venda para obter o saleNumber
        const sale = await this.prisma.sale.findUnique({
          where: { id: saleId },
          select: { saleNumber: true }
        });
        
        // Gerar um código PIX mock para desenvolvimento
        const mockQrCode = `00020126580014br.gov.bcb.pix0136${saleId}5204000053039865802BR5925MobiliAI Loja de Tintas6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        // Atualizar a venda com referência mock
        await this.prisma.sale.update({
          where: { id: saleId },
          data: {
            paymentReference: `MOCK-${saleId}-${Date.now()}`,
          }
        });

        return {
          qrCode: mockQrCode,
          qrCodeImage: null,
          paymentId: `MOCK-${saleId}`,
          expiresAt: new Date(Date.now() + 3600000), // 1 hora
          amount: amount,
          saleId: saleId,
          saleNumber: sale?.saleNumber || 'MOCK',
        };
      } else {
        throw new BadRequestException('AbacatePay API key não configurada. Configure a chave de API para usar pagamentos PIX.');
      }
    }

    // Buscar informações da venda
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
            cpf: true,
          }
        }
      }
    });

    if (!sale) {
      throw new BadRequestException('Venda não encontrada');
    }

    // Preparar dados do cliente
    const customer = {
      name: customerInfo?.name || sale.customer?.name || 'Cliente',
      email: customerInfo?.email || sale.customer?.email || '',
      cellphone: customerInfo?.phone || sale.customer?.phone || '',
      tax_id: customerInfo?.cpf || sale.customer?.cpf || '',
    };

    try {
      // Preparar payload para AbacatePay (rota legacy - fallback)
      const payload: any = {
        amount: Math.round(amount * 100), // Converter para centavos
        description: `Pedido ${sale.saleNumber}`,
        expires_in: 3600, // 1 hora
      };

      // Adicionar dados do cliente se disponíveis
      if (customer.name) {
        payload.customer = {};
        if (customer.name) payload.customer.name = customer.name;
        if (customer.email) payload.customer.email = customer.email;
        if (customer.cellphone) payload.customer.cellphone = customer.cellphone;
        if (customer.tax_id) payload.customer.tax_id = customer.tax_id;
      }

      // Criar cobrança PIX via AbacatePay
      const response = await axios.post(
        `${this.baseUrl}/v1/pix/qrcode`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const pixData = response.data;

      // Atualizar a venda com a referência do pagamento
      await this.prisma.sale.update({
        where: { id: saleId },
        data: {
          paymentReference: pixData.id || pixData.qrCodeId || pixData.paymentId,
        }
      });

      // Calcular data de expiração
      const expiresAt = pixData.expiresAt 
        ? new Date(pixData.expiresAt)
        : new Date(Date.now() + 3600000); // 1 hora padrão

      return {
        qrCode: pixData.brCode || pixData.qrCode || pixData.code,
        qrCodeImage: pixData.qrCodeImage || pixData.image || pixData.qrCodeImageUrl,
        paymentId: pixData.id || pixData.qrCodeId || pixData.paymentId,
        expiresAt: expiresAt,
        amount: amount,
        saleId: saleId,
        saleNumber: sale.saleNumber,
      };
    } catch (error: any) {
      // Em desenvolvimento, usar modo mock para QUALQUER erro
      if (this.environment !== 'production') {
        console.warn('⚠️ Erro de conexão com AbacatePay. Usando modo de desenvolvimento com QR code mock.');
        
        // Buscar informações da venda para obter o saleNumber
        const sale = await this.prisma.sale.findUnique({
          where: { id: saleId },
          select: { saleNumber: true }
        });
        
        // Gerar um código PIX mock para desenvolvimento
        const mockQrCode = `00020126580014br.gov.bcb.pix0136${saleId}5204000053039865802BR5925MobiliAI Loja de Tintas6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        // Atualizar a venda com referência mock
        await this.prisma.sale.update({
          where: { id: saleId },
          data: {
            paymentReference: `MOCK-${saleId}-${Date.now()}`,
          }
        });

        return {
          qrCode: mockQrCode,
          qrCodeImage: null,
          paymentId: `MOCK-${saleId}`,
          expiresAt: new Date(Date.now() + 3600000), // 1 hora
          amount: amount,
          saleId: saleId,
          saleNumber: sale?.saleNumber || 'MOCK',
        };
      }

      console.error('Erro ao criar pagamento PIX:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Mensagem de erro mais detalhada
      let errorMessage = 'Erro ao gerar QR code PIX';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = `Erro ao conectar com o gateway de pagamento: ${error.message}`;
      }
      
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Cria cobrança para Cartão de Crédito (checkout AbacatePay)
   */
  async createCardPayment(
    saleId: string,
    amount: number,
    customerInfo?: {
      name?: string;
      email?: string;
      phone?: string;
      cpf?: string;
    }
  ) {
    return this.createBillingForSale(saleId, 'CREDIT_CARD', amount, customerInfo);
  }

  /**
   * Cria cobrança para Boleto (checkout AbacatePay)
   */
  async createBoletoPayment(
    saleId: string,
    amount: number,
    customerInfo?: {
      name?: string;
      email?: string;
      phone?: string;
      cpf?: string;
    }
  ) {
    return this.createBillingForSale(saleId, 'BOLETO', amount, customerInfo);
  }

  /**
   * Verifica o status de um pagamento PIX
   */
  async checkPixPaymentStatus(paymentId: string) {
    if (!this.apiKey) {
      throw new BadRequestException('AbacatePay API key não configurada');
    }

    try {
      // Tentar via SDK
      try {
        const abacate = this.getAbacateClient();
        const billing = await abacate.billing.get(paymentId);
        const data = billing?.data || billing;
        const status = (data?.status || 'PENDING').toUpperCase();
        return {
          status,
          paidAt: data?.paidAt,
          amount: data?.amount ? data.amount / 100 : null,
        };
      } catch {
        // Fallback HTTP (rota legacy)
      }

      const response = await axios.get(`${this.baseUrl}/v1/pix/qrcode/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      const paymentData = response.data;      
      return {
        status: paymentData.status || 'PENDING', // PAID, PENDING, EXPIRED
        paidAt: paymentData.paidAt,
        amount: paymentData.amount ? paymentData.amount / 100 : null, // Converter de centavos
      };
    } catch (error: any) {
      console.error('Erro ao verificar status do pagamento:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Erro ao verificar status do pagamento'
      );
    }
  }

  /**
   * Verifica o status do pagamento de uma venda
   */
  async checkSalePaymentStatus(saleId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
    });

    if (!sale) {
      throw new BadRequestException('Venda não encontrada');
    }

    if (!sale.paymentReference) {
      return {
        status: 'PENDING',
        saleStatus: sale.status,
      };
    }

    const paymentStatus = await this.checkPixPaymentStatus(sale.paymentReference);

    // Se o pagamento foi confirmado, atualizar o status da venda
    if (paymentStatus.status === 'PAID' && sale.status === 'PENDING') {
      await this.prisma.sale.update({
        where: { id: saleId },
        data: {
          status: 'COMPLETED',
        }
      });
    }

    return {
      ...paymentStatus,
      saleStatus: paymentStatus.status === 'PAID' ? 'COMPLETED' : sale.status,
    };
  }
}

