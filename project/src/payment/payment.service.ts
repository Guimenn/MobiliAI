import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentService {
  private readonly apiKey: string;
  private readonly environment: string;
  private readonly baseUrl: string;
  private readonly returnUrl: string;
  private readonly completionUrl: string;
  private readonly devMode: boolean;
  private readonly stripe: Stripe | null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {
    this.apiKey = this.configService.get<string>('ABACATEPAY_API_KEY') || '';
    this.environment = this.configService.get<string>('ABACATEPAY_ENVIRONMENT') || 'sandbox';
    this.devMode = this.configService.get<boolean>('ABACATEPAY_DEV_MODE') ?? false;
    const configuredBaseUrl = this.configService.get<string>('ABACATEPAY_BASE_URL');
    const defaultBaseUrl = 'https://api.abacatepay.com/v1';
    this.baseUrl = (configuredBaseUrl || defaultBaseUrl).replace(/\/+$/, '');
    this.returnUrl = this.configService.get<string>('ABACATEPAY_RETURN_URL') 
      || this.configService.get<string>('FRONTEND_BASE_URL')
      || 'http://localhost:3000/payment/return';
    this.completionUrl = this.configService.get<string>('ABACATEPAY_COMPLETION_URL') 
      || this.configService.get<string>('FRONTEND_BASE_URL')
      || 'http://localhost:3000/checkout/success';
    
    // Inicializar Stripe
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    if (stripeSecretKey && stripeSecretKey.trim() !== '') {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-10-29.clover',
      });
    } else {
      // Criar instância vazia para evitar erros de tipo
      this.stripe = null as any;
    }
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

  private buildDefaultHeaders() {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (this.devMode && this.environment !== 'production') {
      headers['X-AbacatePay-DevMode'] = 'true';
    }

    return headers;
  }

  private buildCompletionUrl(orderId: string) {
    const base = (this.completionUrl || '').trim();
    if (!base) {
      return `http://localhost:3000/customer/orders/${orderId}`;
    }

    const normalized = base.replace(/\/+$/, '');

    if (normalized.includes('{orderId}')) {
      return normalized.replace('{orderId}', orderId);
    }

    if (normalized.includes('{id}')) {
      return normalized.replace('{id}', orderId);
    }

    if (normalized.includes(':orderId')) {
      return normalized.replace(':orderId', orderId);
    }

    if (normalized.includes(':id')) {
      return normalized.replace(':id', orderId);
    }

    if (normalized.includes('?')) {
      const needsAmpersand = !normalized.endsWith('?') && !normalized.endsWith('&');
      return `${normalized}${needsAmpersand ? '&' : ''}orderId=${orderId}`;
    }

    return `${normalized}?orderId=${orderId}`;
  }

  /**
   * Cria uma cobrança (billing) na AbacatePay para um método específico
   * Suporta: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
   */
  private async createBillingForSale(
    saleId: string,
    method: 'PIX' | 'CARD',
    amount: number,
    customerInfo?: { name?: string; email?: string; phone?: string; cpf?: string; },
    options?: { installments?: number },
  ) {
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

    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new BadRequestException('AbacatePay API key não configurada.');
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
      taxId: customerInfo?.cpf || sale.customer?.cpf || undefined,
    };

    if (method === 'PIX') {
      return this.createPixQrCodeForSale(
        sale,
        amount,
        customer,
      );
    }

    try {
      const abacate = this.getAbacateClient();

      const metadata: Record<string, any> = {
        saleId,
        saleNumber: sale.saleNumber,
        method,
      };

      if (method === 'CARD' && options?.installments) {
        metadata.installments = options.installments;
      }

      const customerPayload = Object.fromEntries(
        Object.entries({
          email: customer.email,
          name: customer.name,
          cellphone: customer.cellphone,
          taxId: customer.taxId,
        }).filter(([, value]) => !!value),
      );

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
        completionUrl: this.buildCompletionUrl(saleId),
        customer: Object.keys(customerPayload).length > 0 ? customerPayload : undefined,
        metadata,
      });

      const provider = billing || {};
      const providerData = provider.data || provider;

      let paymentId: string =
        providerData.id || providerData.reference || providerData.paymentId || '';
      let checkoutUrl =
        providerData.checkoutUrl || providerData.paymentLink || providerData.url;
      let expiresAt = providerData.expiresAt
        ? new Date(providerData.expiresAt)
        : new Date(Date.now() + 3600000);

      if (!paymentId) {
        console.error('AbacatePay (billing.create via SDK) não retornou paymentId válido.', {
          providerData,
        });
        throw new BadRequestException('AbacatePay não retornou identificador da cobrança.');
      }

      await this.prisma.sale.update({
        where: { id: saleId },
        data: { paymentReference: paymentId },
      });

      return {
        paymentId,
        checkoutUrl,
        qrCode: undefined,
        qrCodeImage: undefined,
        amount,
        expiresAt,
        saleId,
        saleNumber: sale.saleNumber,
        providerResponse: providerData,
      };
    } catch (error: any) {
      console.error('Erro AbacatePay (billing.create via SDK):', {
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
    return this.createBillingForSale(saleId, 'PIX', amount, customerInfo);
  }

  private async createPixQrCodeForSale(
    sale: {
      id: string;
      saleNumber?: string | null;
    } & Partial<{
      customer: {
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        cpf?: string | null;
      };
    }>,
    amount: number,
    customer: {
      name?: string;
      email?: string;
      cellphone?: string;
      taxId?: string;
    },
  ) {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new BadRequestException('AbacatePay API key não configurada.');
    }

    const hasCompleteCustomer =
      customer.name && customer.email && customer.cellphone && customer.taxId;

    const payload: Record<string, any> = {
      amount: Math.round(Number(amount) * 100),
      description: `Pedido ${sale.saleNumber}`,
      expiresIn: 3600,
      metadata: {
        externalId: sale.id,
        saleNumber: sale.saleNumber,
      },
    };

    if (hasCompleteCustomer) {
      payload.customer = {
        name: customer.name,
        email: customer.email,
        cellphone: customer.cellphone,
        taxId: customer.taxId,
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/pixQrCode/create`,
        payload,
        {
          headers: this.buildDefaultHeaders(),
        }
      );

      const paymentData = response.data?.data || response.data;

      const paymentId =
        paymentData.id || paymentData.qrCodeId || paymentData.paymentId;

      if (!paymentId) {
        console.error('AbacatePay (pixQrCode/create) não retornou paymentId válido.', {
          paymentData,
        });
        throw new BadRequestException('AbacatePay não retornou identificador da cobrança PIX.');
      }

      await this.prisma.sale.update({
        where: { id: sale.id },
        data: { paymentReference: paymentId },
      });

      const expiresAt = paymentData.expiresAt
        ? new Date(paymentData.expiresAt)
        : new Date(Date.now() + 3600000);

      return {
        paymentId,
        checkoutUrl:
          paymentData.checkoutUrl ||
          paymentData.paymentLink ||
          paymentData.url,
        qrCode: paymentData.brCode || paymentData.qrCode || paymentData.code,
        qrCodeImage:
          paymentData.brCodeBase64 ||
          paymentData.qrCodeImage ||
          paymentData.image ||
          paymentData.qrCodeImageUrl,
        amount,
        expiresAt,
        saleId: sale.id,
        saleNumber: sale.saleNumber,
        providerResponse: paymentData,
      };
    } catch (error: any) {
      console.error('Erro AbacatePay (pixQrCode/create):', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });

      throw new BadRequestException(
        error.response?.data?.message || error.response?.data?.error || 'Erro ao criar cobrança PIX na AbacatePay'
      );
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
    },
    options?: { installments?: number },
  ) {
    return this.createBillingForSale(saleId, 'CARD', amount, customerInfo, options);
  }

  /**
   * Verifica o status de um pagamento PIX
   */
  async checkPixPaymentStatus(paymentId: string) {
    if (!paymentId) {
      throw new BadRequestException('ID do pagamento não informado');
    }

    if (!this.apiKey) {
      throw new BadRequestException('AbacatePay API key não configurada');
    }

    try {
      // Tentar via SDK
      if (!this.devMode || this.environment === 'production') {
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
      }

      const response = await axios.get(`${this.baseUrl}/pixQrCode/check`, {
        headers: this.buildDefaultHeaders(),
        params: { id: paymentId },
      });
      const paymentData = response.data?.data || response.data;      
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
    console.log(`[Payment Service] Verificando status do pagamento para venda ${saleId}...`);
    
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      select: {
        id: true,
        status: true,
        paymentReference: true,
        customerId: true,
        saleNumber: true,
      },
    });

    if (!sale) {
      console.error(`[Payment Service] Venda ${saleId} não encontrada.`);
      throw new BadRequestException('Venda não encontrada');
    }

    console.log(`[Payment Service] Venda ${saleId} encontrada. Status atual: ${sale.status}, paymentReference: ${sale.paymentReference || 'N/A'}`);

    if (!sale.paymentReference) {
      console.log(`[Payment Service] Venda ${saleId} não possui paymentReference. Retornando status PENDING.`);
      return {
        status: 'PENDING',
        saleStatus: sale.status,
      };
    }

    try {
      console.log(`[Payment Service] Verificando status do pagamento PIX com reference ${sale.paymentReference}...`);
      const paymentStatus = await this.checkPixPaymentStatus(sale.paymentReference);
      console.log(`[Payment Service] Status do pagamento PIX: ${paymentStatus.status} (venda status: ${sale.status})`);
      
      let finalSaleStatus = sale.status;

      // Se o pagamento foi confirmado, atualizar o status da venda para PREPARING
      // Verificar se o status do pagamento é 'PAID' (case-insensitive)
      const paymentStatusUpper = String(paymentStatus.status || '').toUpperCase();
      const saleStatusUpper = String(sale.status || '').toUpperCase();
      
      if (paymentStatusUpper === 'PAID' && saleStatusUpper === 'PENDING') {
        console.log(`[Payment Service] ✅ Pagamento PIX confirmado para venda ${saleId}. Atualizando status de PENDING para PREPARING.`);
        
        const updatedSale = await this.prisma.sale.update({
          where: { id: saleId },
          data: {
            status: 'PREPARING' as any,
          },
        });
        finalSaleStatus = 'PREPARING';

        console.log(`[Payment Service] ✅ Status da venda ${saleId} atualizado para PREPARING com sucesso. Novo status no banco: ${updatedSale.status}`);

        // Enviar notificação ao cliente sobre o status PREPARING
        if (sale.customerId) {
          try {
            await this.notificationsService.notifyOrderPreparing(
              sale.customerId,
              saleId,
              sale.saleNumber,
            );
            console.log(`[Payment Service] ✅ Notificação de preparação enviada para cliente ${sale.customerId}.`);
          } catch (notifError) {
            console.error('[Payment Service] Erro ao enviar notificação de preparação:', notifError);
          }
        }
      } else if (paymentStatusUpper === 'PAID' && saleStatusUpper !== 'PENDING') {
        console.log(`[Payment Service] ⚠️ Pagamento PIX confirmado para venda ${saleId}, mas status já é ${sale.status}. Não atualizando.`);
        finalSaleStatus = sale.status;
      } else if (paymentStatusUpper !== 'PAID') {
        console.log(`[Payment Service] Pagamento PIX ainda não foi confirmado. Status: ${paymentStatus.status}`);
      }

      return {
        status: paymentStatus.status,
        saleStatus: finalSaleStatus,
        paidAt: paymentStatus.paidAt,
        amount: paymentStatus.amount,
      };
    } catch (error: any) {
      const notFoundMessage = 'Pix QRCode not found';
      const errorMessage = error?.message || error?.response?.data?.message;

      if (
        error instanceof BadRequestException &&
        typeof errorMessage === 'string' &&
        errorMessage.includes(notFoundMessage)
      ) {
        await this.prisma.sale.update({
          where: { id: saleId },
          data: {
            paymentReference: null,
          },
        });

        throw new BadRequestException(notFoundMessage);
      }

      throw error;
    }
  }

  async simulatePixPayment(saleId: string) {
    if (this.environment === 'production') {
      throw new BadRequestException('Simulação de pagamento não permitida em produção.');
    }

    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      select: {
        paymentReference: true,
        status: true,
      },
    });

    if (!sale) {
      throw new BadRequestException('Venda não encontrada');
    }

    if (!sale.paymentReference) {
      throw new BadRequestException('Venda não possui referência de pagamento PIX ativa.');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/pixQrCode/simulate-payment`,
        { metadata: { saleId } },
        {
          headers: this.buildDefaultHeaders(),
          params: { id: sale.paymentReference },
        }
      );

      const paymentData = response.data?.data || response.data;
      const paymentStatus = paymentData?.status?.toUpperCase?.() || 'PAID';

      return {
        status: paymentStatus,
        providerResponse: paymentData,
      };
    } catch (error: any) {
      console.error('Erro ao simular pagamento PIX:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });

      throw new BadRequestException(
        error.response?.data?.message || error.response?.data?.error || 'Erro ao simular pagamento PIX'
      );
    }
  }

  /**
   * Cria um PaymentIntent do Stripe para pagamento com cartão
   */
  async createStripePaymentIntent(
    saleId: string,
    amount: number,
    customerInfo?: {
      name?: string;
      email?: string;
      phone?: string;
      cpf?: string;
    }
  ) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe não configurado. Verifique STRIPE_SECRET_KEY.');
    }

    // Garantir conexão com o banco
    await this.prisma.ensureConnection();

    // Buscar a venda com retry
    const sale = await this.prisma.executeWithRetry(async () => {
      return await this.prisma.sale.findUnique({
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
    });

    if (!sale) {
      throw new BadRequestException(`Venda com ID ${saleId} não encontrada`);
    }

    try {
      // Converter valor para centavos (Stripe usa centavos)
      const amountInCents = Math.round(amount * 100);

      // Preparar metadados
      const metadata: Record<string, string> = {
        saleId,
        saleNumber: sale.saleNumber || '',
      };

      // Criar PaymentIntent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'brl',
        metadata,
        description: `Pedido ${sale.saleNumber}`,
        receipt_email: customerInfo?.email || sale.customer?.email || undefined,
      });

      // Atualizar venda com paymentReference (com retry)
      await this.prisma.executeWithRetry(async () => {
        return await this.prisma.sale.update({
          where: { id: saleId },
          data: { paymentReference: paymentIntent.id },
        });
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        saleId,
        saleNumber: sale.saleNumber,
      };
    } catch (error: any) {
      console.error('Erro ao criar PaymentIntent do Stripe:', {
        message: error.message,
        code: error.code,
        type: error.type,
      });

      throw new BadRequestException(
        error.message || 'Erro ao criar pagamento com cartão'
      );
    }
  }

  /**
   * Confirma o pagamento do Stripe após o cliente confirmar no frontend
   */
  async confirmStripePayment(paymentIntentId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe não configurado.');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent.metadata?.saleId) {
        throw new BadRequestException('PaymentIntent não possui saleId nos metadados');
      }

      const saleId = paymentIntent.metadata.saleId;

      // Garantir conexão com o banco
      await this.prisma.ensureConnection();

      // Buscar a venda atual para verificar seu status
      const currentSale = await this.prisma.sale.findUnique({
        where: { id: saleId },
        select: { status: true, paymentReference: true },
      });

      if (!currentSale) {
        throw new BadRequestException(`Venda com ID ${saleId} não encontrada`);
      }

      // Se a venda já está em PREPARING ou status posterior, retornar sucesso sem atualizar novamente
      if (currentSale.status === 'PREPARING' || currentSale.status === 'SHIPPED' || currentSale.status === 'DELIVERED') {
        return {
          success: true,
          status: 'succeeded',
          saleId,
          amount: paymentIntent.amount / 100,
          message: 'Pagamento já foi confirmado anteriormente',
        };
      }

      // Verificar status do pagamento
      if (paymentIntent.status === 'succeeded') {
        // Verificar se o pagamento realmente foi processado
        // Só atualizar se a venda ainda estiver em PENDING
        if (currentSale.status === 'PENDING') {
          console.log(`[Payment Service] Pagamento Stripe confirmado para venda ${saleId}. Atualizando status de PENDING para PREPARING.`);
          
          // Buscar informações da venda para notificação
          const sale = await this.prisma.sale.findUnique({
            where: { id: saleId },
            select: { customerId: true, saleNumber: true },
          });

          // Atualizar venda para PREPARING após pagamento confirmado (com retry)
          await this.prisma.executeWithRetry(async () => {
            return await this.prisma.sale.update({
              where: { id: saleId },
              data: {
                status: 'PREPARING',
                paymentMethod: 'CREDIT_CARD',
                paymentReference: paymentIntentId,
              },
            });
          });

          console.log(`[Payment Service] Status da venda ${saleId} atualizado para PREPARING com sucesso.`);

          // Enviar notificação ao cliente sobre o status PREPARING
          if (sale?.customerId) {
            try {
              await this.notificationsService.notifyOrderPreparing(
                sale.customerId,
                saleId,
                sale.saleNumber,
              );
              console.log(`[Payment Service] Notificação de preparação enviada para cliente ${sale.customerId}.`);
            } catch (notifError) {
              console.error('Erro ao enviar notificação de preparação:', notifError);
            }
          }
        } else {
          // Se a venda não está em PENDING, não atualizar o status
          console.warn(`Tentativa de confirmar pagamento para venda ${saleId} com status ${currentSale.status}`);
          return {
            success: false,
            status: paymentIntent.status,
            saleId,
            message: `Venda já possui status ${currentSale.status}, não foi possível atualizar para PREPARING`,
          };
        }

        return {
          success: true,
          status: 'succeeded',
          saleId,
          amount: paymentIntent.amount / 100, // Converter de centavos
        };
      } else if (paymentIntent.status === 'requires_payment_method') {
        throw new BadRequestException('Pagamento requer método de pagamento');
      } else if (paymentIntent.status === 'requires_confirmation') {
        throw new BadRequestException('Pagamento requer confirmação');
      } else {
        return {
          success: false,
          status: paymentIntent.status,
          saleId,
        };
      }
    } catch (error: any) {
      console.error('Erro ao confirmar pagamento Stripe:', {
        message: error.message,
        code: error.code,
        type: error.type,
      });

      throw new BadRequestException(
        error.message || 'Erro ao confirmar pagamento'
      );
    }
  }

  /**
   * Verifica o status de um pagamento Stripe
   */
  async checkStripePaymentStatus(paymentIntentId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe não configurado.');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        saleId: paymentIntent.metadata?.saleId,
      };
    } catch (error: any) {
      console.error('Erro ao verificar status do pagamento Stripe:', {
        message: error.message,
        code: error.code,
      });

      throw new BadRequestException(
        error.message || 'Erro ao verificar status do pagamento'
      );
    }
  }
}

