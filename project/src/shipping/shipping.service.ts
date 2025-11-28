import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CalculateShippingDto, ShippingMode, ShippingServiceType } from './dto/calculate-shipping.dto';

export interface CorreiosCepResponse {
  cep: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

interface CorreiosPriceResponse {
  valor: number;
  prazo: number;
  raw?: any;
}

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);
  private readonly correiosBaseUrl: string;
  private readonly correiosPacCode: string; // PAC (padrão)
  private readonly correiosSedexCode: string; // SEDEX (expresso)
  private readonly http: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // URL base da API dos Correios (REST oficial)
    this.correiosBaseUrl =
      this.configService.get<string>('CORREIOS_API_BASE_URL') ||
      'https://api.correios.com.br';

    // Códigos dos serviços dos Correios
    // PAC (padrão - mais barato, mais lento): 03140 (contrato) ou 04669 (varejo)
    this.correiosPacCode =
      this.configService.get<string>('CORREIOS_PAC_CODE') || '04669';
    
    // SEDEX (expresso - mais caro, mais rápido): 03220 (varejo) ou 03298 (contrato)
    this.correiosSedexCode =
      this.configService.get<string>('CORREIOS_SEDEX_CODE') || '03220';

    this.http = axios.create({
      baseURL: this.correiosBaseUrl.replace(/\/+$/, ''),
      timeout: 10000,
    });
  }

  /**
   * Consulta CEP usando API oficial dos Correios.
   * Mantém tipagem simples para ser usada tanto no checkout quanto em outros fluxos.
   */
  async lookupCep(cep: string): Promise<CorreiosCepResponse> {
    const cleanCep = (cep || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      throw new BadRequestException('CEP inválido. Deve conter 8 dígitos numéricos.');
    }

    const token = this.configService.get<string>('CORREIOS_API_TOKEN');
    if (!token) {
      // Não bloquear completamente o fluxo se o token não estiver configurado
      // Isso facilita desenvolvimento local.
      this.logger.warn('CORREIOS_API_TOKEN não configurado. lookupCep não será chamado.');
      throw new InternalServerErrorException(
        'Integração com Correios não configurada. Configure CORREIOS_API_TOKEN para usar este recurso.',
      );
    }

    try {
      const response = await this.http.get(`/cep/v1/enderecos/${cleanCep}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      return {
        cep: data.cep || cleanCep,
        logradouro: data.logradouro,
        complemento: data.complemento,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
      };
    } catch (error: any) {
      this.logger.error('Erro ao consultar CEP nos Correios', error?.response?.data || error.message);
      throw new InternalServerErrorException(
        error?.response?.data?.mensagem ||
          'Erro ao consultar CEP nos Correios. Tente novamente mais tarde.',
      );
    }
  }

  /**
   * Chamada simplificada para cálculo de preço e prazo nos Correios.
   * A API oficial possui muitos campos, aqui usamos o básico e mantemos extensível.
   */
  private async calculateCorreiosPriceAndDeadline(params: {
    cepOrigem: string;
    cepDestino: string;
    pesoKg: number;
    comprimentoCm: number;
    larguraCm: number;
    alturaCm: number;
    serviceType: 'standard' | 'express';
  }): Promise<CorreiosPriceResponse> {
    const token = this.configService.get<string>('CORREIOS_API_TOKEN');
    if (!token) {
      throw new InternalServerErrorException(
        'Integração com Correios não configurada. Configure CORREIOS_API_TOKEN para cálculo de frete.',
      );
    }

    // Escolher código do serviço baseado no tipo
    const productCode = params.serviceType === 'express' 
      ? this.correiosSedexCode 
      : this.correiosPacCode;

    const payload = {
      coProduto: productCode,
      cepOrigem: params.cepOrigem.replace(/\D/g, ''),
      cepDestino: params.cepDestino.replace(/\D/g, ''),
      peso: Math.max(0.3, Number(params.pesoKg.toFixed(3))), // mínimo técnico de 300g
      comprimento: Math.max(16, Math.round(params.comprimentoCm)), // mínimos sugeridos pelos Correios
      largura: Math.max(11, Math.round(params.larguraCm)),
      altura: Math.max(2, Math.round(params.alturaCm)),
    };

    try {
      const response = await this.http.post('/preco/v1/nacional', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      const valor = Number(data?.pcFinal || data?.valor || 0);
      const prazo = Number(data?.prazoEntrega || data?.prazo || 0);

      if (!valor || !prazo) {
        this.logger.warn('Resposta inesperada da API de preço/prazo dos Correios', data);
      }

      return {
        valor,
        prazo,
        raw: data,
      };
    } catch (error: any) {
      this.logger.error(
        'Erro ao calcular preço/prazo nos Correios',
        error?.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        error?.response?.data?.mensagem ||
          'Erro ao calcular frete nos Correios. Tente novamente mais tarde.',
      );
    }
  }

  /**
   * Calcula frete por loja e também opção combinada (quando aplicável).
   * Usa dados reais de produtos/lojas do banco (peso, dimensões, CEP).
   */
  async calculateShipping(dto: CalculateShippingDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Nenhum item informado para cálculo de frete.');
    }

    const cleanDestinationCep = dto.destinationZipCode.replace(/\D/g, '');
    if (cleanDestinationCep.length !== 8) {
      throw new BadRequestException('CEP de destino inválido. Deve conter 8 dígitos numéricos.');
    }

    // Buscar produtos com informações de loja e dimensões
    // Incluir StoreInventory para produtos que estão em múltiplas lojas
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: dto.items.map((i) => i.productId) },
      },
      select: {
        id: true,
        weight: true,
        width: true,
        height: true,
        depth: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
            zipCode: true,
            city: true,
            state: true,
            address: true,
          },
        },
        storeInventory: {
          select: {
            storeId: true,
            quantity: true,
            store: {
              select: {
                id: true,
                name: true,
                zipCode: true,
                city: true,
                state: true,
                address: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (products.length === 0) {
      throw new BadRequestException('Nenhum produto encontrado para cálculo de frete.');
    }

    // Mapear quantidade por produto
    const quantityMap = new Map<string, number>();
    for (const item of dto.items) {
      quantityMap.set(item.productId, (quantityMap.get(item.productId) || 0) + Number(item.quantity || 0));
    }

    // Agrupar por loja
    type StoreGroup = {
      storeId: string;
      storeName: string;
      originZipCode: string;
      city?: string;
      state?: string;
      address?: string;
      totalWeightKg: number;
      maxWidthCm: number;
      maxHeightCm: number;
      maxDepthCm: number;
      items: {
        productId: string;
        quantity: number;
        weightKg: number;
      }[];
    };

    const storeGroups = new Map<string, StoreGroup>();

    for (const product of products) {
      const quantity = quantityMap.get(product.id) || 0;
      if (!quantity) continue;

      // Determinar qual loja usar para este produto
      // Prioridade: 1) StoreInventory com estoque, 2) storeId direto, 3) primeira loja do StoreInventory
      let targetStoreId: string | null = null;
      let targetStore: any = null;

      this.logger.debug(`Processando produto ${product.id}: storeId=${product.storeId}, storeInventory.length=${product.storeInventory?.length || 0}`);

      // Se o produto tem StoreInventory (está em múltiplas lojas)
      if (product.storeInventory && product.storeInventory.length > 0) {
        this.logger.debug(`Produto ${product.id} tem ${product.storeInventory.length} lojas no storeInventory`);
        
        // Buscar loja com estoque suficiente (ou maior estoque disponível)
        const availableStores = product.storeInventory
          .filter(inv => inv.store?.isActive && inv.quantity >= quantity)
          .sort((a, b) => b.quantity - a.quantity);

        if (availableStores.length > 0) {
          // Usar loja com maior estoque disponível
          targetStoreId = availableStores[0].storeId;
          targetStore = availableStores[0].store;
          this.logger.debug(`Produto ${product.id}: usando loja ${targetStoreId} (${targetStore?.name}) do storeInventory com estoque`);
        } else {
          // Se nenhuma tem estoque suficiente, usar a que tem mais estoque
          const sortedByStock = product.storeInventory
            .filter(inv => inv.store?.isActive)
            .sort((a, b) => b.quantity - a.quantity);
          
          if (sortedByStock.length > 0) {
            targetStoreId = sortedByStock[0].storeId;
            targetStore = sortedByStock[0].store;
            this.logger.debug(`Produto ${product.id}: usando loja ${targetStoreId} (${targetStore?.name}) do storeInventory (maior estoque disponível)`);
          }
        }
      }

      // Fallback: usar storeId direto do produto
      if (!targetStoreId && product.storeId && product.store) {
        targetStoreId = product.storeId;
        targetStore = product.store;
        this.logger.debug(`Produto ${product.id}: usando loja ${targetStoreId} (${targetStore?.name}) do storeId direto`);
      }

      if (!targetStoreId || !targetStore) {
        // Se o produto não estiver associado a uma loja, ignorar no cálculo
        this.logger.warn(`Produto ${product.id} sem loja associada. storeId=${product.storeId}, storeInventory=${product.storeInventory?.length || 0}. Ignorando no cálculo de frete.`);
        continue;
      }

      if (!targetStore.zipCode) {
        this.logger.warn(`Loja ${targetStoreId} (${targetStore.name}) sem CEP de origem configurado. Ignorando produto ${product.id} no cálculo de frete.`);
        continue;
      }

      const existing = storeGroups.get(targetStoreId) || {
        storeId: targetStoreId,
        storeName: targetStore.name,
        originZipCode: targetStore.zipCode,
        city: targetStore.city,
        state: targetStore.state,
        address: targetStore.address,
        totalWeightKg: 0,
        maxWidthCm: 0,
        maxHeightCm: 0,
        maxDepthCm: 0,
        items: [],
      };

      const weightKg = Number(product.weight || 0.5); // peso padrão de 0.5kg se não informado
      const widthCm = Number(product.width || 20);
      const heightCm = Number(product.height || 10);
      const depthCm = Number(product.depth || 20);

      existing.totalWeightKg += weightKg * quantity;
      existing.maxWidthCm = Math.max(existing.maxWidthCm, widthCm);
      existing.maxHeightCm = Math.max(existing.maxHeightCm, heightCm);
      existing.maxDepthCm = Math.max(existing.maxDepthCm, depthCm);
      existing.items.push({
        productId: product.id,
        quantity,
        weightKg,
      });

      storeGroups.set(targetStoreId, existing);
    }

    if (storeGroups.size === 0) {
      throw new BadRequestException(
        'Nenhum produto com loja/CEP de origem válido encontrado para cálculo de frete.',
      );
    }

    // Calcular frete separado (por loja)
    const perStoreResults = [];
    let sumSeparatePrice = 0;
    let maxSeparateDeadline = 0;

    for (const group of storeGroups.values()) {
      if (!group.originZipCode) {
        this.logger.warn(`Loja ${group.storeId} (${group.storeName}) sem CEP de origem configurado. Ignorando.`);
        continue;
      }

      this.logger.debug(`Calculando frete para loja ${group.storeId} (${group.storeName}): CEP origem=${group.originZipCode}, CEP destino=${cleanDestinationCep}, peso=${group.totalWeightKg}kg`);

      const serviceType = dto.serviceType || ShippingServiceType.STANDARD;
      const correiosResult = await this.calculateCorreiosPriceAndDeadline({
        cepOrigem: group.originZipCode,
        cepDestino: cleanDestinationCep,
        pesoKg: group.totalWeightKg,
        comprimentoCm: group.maxDepthCm,
        larguraCm: group.maxWidthCm,
        alturaCm: group.maxHeightCm,
        serviceType: serviceType === ShippingServiceType.EXPRESS ? 'express' : 'standard',
      });

      sumSeparatePrice += correiosResult.valor;
      maxSeparateDeadline = Math.max(maxSeparateDeadline, correiosResult.prazo || 0);

      perStoreResults.push({
        storeId: group.storeId,
        storeName: group.storeName,
        originZipCode: group.originZipCode,
        originCity: group.city,
        originState: group.state,
        destinationZipCode: cleanDestinationCep,
        serviceCode: serviceType === ShippingServiceType.EXPRESS ? this.correiosSedexCode : this.correiosPacCode,
        serviceType: serviceType,
        price: correiosResult.valor,
        deadlineDays: correiosResult.prazo,
        totalWeightKg: group.totalWeightKg,
        items: group.items,
      });
    }

    if (perStoreResults.length === 0) {
      throw new BadRequestException(
        'Não foi possível calcular frete para nenhuma loja. Verifique CEPs de origem e destino.',
      );
    }

    // Opção combinada: usar o frete mais "pesado" como base, aplicar desconto e prazo extra
    let combinedOption: any = null;
    if (storeGroups.size > 1) {
      const combinedBasePrice = sumSeparatePrice;
      const discountPercent = 15; // 15% de desconto quando o cliente aceita aguardar consolidação
      const finalPrice = Number((combinedBasePrice * (1 - discountPercent / 100)).toFixed(2));

      // Prazo combinado: máximo dos prazos + 2 dias para consolidação
      const extraDays = 2;
      const combinedDeadline = maxSeparateDeadline + extraDays;

      combinedOption = {
        mode: 'combined',
        basePriceSum: combinedBasePrice,
        discountPercent,
        finalPrice,
        baseMaxDeadlineDays: maxSeparateDeadline,
        extraDaysForConsolidation: extraDays,
        deadlineDays: combinedDeadline,
        description:
          'Todos os produtos enviados juntos em um único pacote. Prazo maior, porém frete com desconto.',
      };
    }

    return {
      destination: {
        zipCode: cleanDestinationCep,
        city: dto.destinationCity,
        state: dto.destinationState,
      },
      modeRequested: dto.mode,
      separate: dto.mode === ShippingMode.COMBINED ? null : {
        mode: 'separate',
        totalPrice: sumSeparatePrice,
        maxDeadlineDays: maxSeparateDeadline,
        groups: perStoreResults,
        description:
          'Cada loja envia seus produtos separadamente. Prazos menores por loja, custo total maior.',
      },
      combined: dto.mode === ShippingMode.SEPARATE ? null : combinedOption,
    };
  }
}


