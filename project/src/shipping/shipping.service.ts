import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CalculateShippingDto, ShippingMode, ShippingServiceType } from './dto/calculate-shipping.dto';

export interface CepResponse {
  cep: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

interface ShippingPriceResponse {
  valor: number;
  prazo: number;
}

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);
  private readonly viaCepBaseUrl = 'https://viacep.com.br';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Consulta CEP usando ViaCEP (API pública e gratuita).
   * Referência: https://viacep.com.br/
   */
  async lookupCep(cep: string): Promise<CepResponse> {
    const cleanCep = (cep || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      throw new BadRequestException('CEP inválido. Deve conter 8 dígitos numéricos.');
    }

    try {
      const response = await axios.get(`${this.viaCepBaseUrl}/ws/${cleanCep}/json/`, {
        timeout: 10000,
      });

      const data = response.data;

      if (data.erro) {
        throw new BadRequestException('CEP não encontrado.');
      }

      return {
        cep: data.cep || cleanCep,
        logradouro: data.logradouro,
        complemento: data.complemento,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
      };
    } catch (error: any) {
      this.logger.error('Erro ao consultar CEP no ViaCEP', error?.response?.data || error.message);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Erro ao consultar CEP. Tente novamente mais tarde.',
      );
    }
  }

  /**
   * Calcula distância aproximada entre dois CEPs usando uma fórmula simples.
   * Baseado na diferença numérica dos CEPs (aproximação).
   * Para cálculo mais preciso, seria necessário usar API de geolocalização.
   */
  private calculateDistance(cepOrigem: string, cepDestino: string): number {
    const origem = parseInt(cepOrigem.replace(/\D/g, ''), 10);
    const destino = parseInt(cepDestino.replace(/\D/g, ''), 10);
    
    // Diferença absoluta entre CEPs
    const diff = Math.abs(origem - destino);
    
    // Converter diferença em distância aproximada (km)
    // Fórmula mais conservadora: usar logaritmo para suavizar diferenças grandes
    // Base: distância mínima de 10km, máxima de 3000km
    // Para CEPs próximos (diferença < 10000): ~10-50km
    // Para CEPs médios (diferença 10000-100000): ~50-500km
    // Para CEPs distantes (diferença > 100000): ~500-3000km
    
    let distanceKm: number;
    if (diff < 1000) {
      // CEPs muito próximos (mesma cidade/região)
      distanceKm = 10 + (diff / 100);
    } else if (diff < 10000) {
      // CEPs na mesma região metropolitana
      distanceKm = 20 + (diff / 500);
    } else if (diff < 100000) {
      // CEPs em estados diferentes mas região próxima
      distanceKm = 100 + (diff / 200);
    } else {
      // CEPs muito distantes (regiões diferentes do país)
      distanceKm = 500 + (diff / 500);
    }
    
    // Limitar distância entre 10km e 3000km (Brasil tem ~4000km de extensão)
    return Math.max(10, Math.min(3000, distanceKm));
  }

  /**
   * Calcula peso cúbico (volume weight) para transporte.
   * Usado quando o volume ocupa mais espaço que o peso real.
   */
  private calculateCubicWeight(
    widthCm: number,
    heightCm: number,
    depthCm: number,
  ): number {
    // Fórmula: (largura × altura × profundidade) / fator de cubagem
    // Fator de cubagem padrão: 6000 (usado pelos Correios)
    const volumeCm3 = widthCm * heightCm * depthCm;
    const cubicWeightKg = volumeCm3 / 6000;
    return cubicWeightKg;
  }

  /**
   * Calcula frete manualmente baseado em distância, peso e tipo de serviço.
   * Não usa API dos Correios, apenas cálculos estimados.
   */
  private calculateShippingPriceAndDeadline(params: {
    cepOrigem: string;
    cepDestino: string;
    pesoKg: number;
    comprimentoCm: number;
    larguraCm: number;
    alturaCm: number;
    serviceType: 'standard' | 'express';
  }): ShippingPriceResponse {
    const { cepOrigem, cepDestino, pesoKg, comprimentoCm, larguraCm, alturaCm, serviceType } = params;

    // Calcular distância aproximada
    const distanceKm = this.calculateDistance(cepOrigem, cepDestino);

    // Calcular peso cúbico
    const cubicWeightKg = this.calculateCubicWeight(larguraCm, alturaCm, comprimentoCm);
    
    // Usar o maior entre peso real e peso cúbico
    const effectiveWeightKg = Math.max(pesoKg, cubicWeightKg);
    
    // Peso mínimo de 0.3kg
    const finalWeightKg = Math.max(0.3, effectiveWeightKg);

    // Calcular preço baseado em distância e peso
    // Fórmula ajustada para valores mais realistas de frete no Brasil
    
    // Preços base (em R$)
    const basePriceStandard = 12.00; // PAC - valor base mínimo
    const basePriceExpress = 25.00; // SEDEX - valor base mínimo
    
    // Taxas por km (reduzidas para valores mais realistas)
    const ratePerKmStandard = 0.05; // R$ 0,05 por km (PAC) - mais conservador
    const ratePerKmExpress = 0.10; // R$ 0,10 por km (SEDEX) - mais conservador
    
    // Taxas por kg (reduzidas)
    const ratePerKgStandard = 1.50; // R$ 1,50 por kg (PAC)
    const ratePerKgExpress = 3.00; // R$ 3,00 por kg (SEDEX)

    // Calcular preço base
    let price: number;
    if (serviceType === 'express') {
      price = basePriceExpress + (distanceKm * ratePerKmExpress) + (finalWeightKg * ratePerKgExpress);
    } else {
      price = basePriceStandard + (distanceKm * ratePerKmStandard) + (finalWeightKg * ratePerKgStandard);
    }

    // Aplicar faixas de preço mais realistas baseadas em distância
    // Para evitar valores muito altos ou muito baixos
    if (serviceType === 'express') {
      // SEDEX: R$ 25-150 (dependendo da distância e peso)
      if (distanceKm < 100) {
        price = Math.max(25, Math.min(price, 60)); // Curta distância
      } else if (distanceKm < 500) {
        price = Math.max(30, Math.min(price, 100)); // Média distância
      } else {
        price = Math.max(50, Math.min(price, 150)); // Longa distância
      }
    } else {
      // PAC: R$ 12-80 (dependendo da distância e peso)
      if (distanceKm < 100) {
        price = Math.max(12, Math.min(price, 35)); // Curta distância
      } else if (distanceKm < 500) {
        price = Math.max(18, Math.min(price, 50)); // Média distância
      } else {
        price = Math.max(30, Math.min(price, 80)); // Longa distância
      }
    }

    // Arredondar para 2 casas decimais
    price = Math.round(price * 100) / 100;

    // Calcular prazo baseado em distância
    // Fórmula ajustada para prazos mais realistas no Brasil
    const baseDeadlineStandard = 5; // 5 dias úteis base (PAC) - aumentado
    const baseDeadlineExpress = 2; // 2 dias úteis base (SEDEX) - aumentado
    
    // Velocidade média de entrega (km por dia útil)
    // Valores mais conservadores para prazos mais realistas
    const avgSpeedKmPerDayStandard = 250; // PAC: ~250km por dia útil
    const avgSpeedKmPerDayExpress = 500; // SEDEX: ~500km por dia útil
    
    let deadline: number;
    if (serviceType === 'express') {
      // SEDEX: prazo base + dias de transporte + margem de segurança
      const transportDays = Math.ceil(distanceKm / avgSpeedKmPerDayExpress);
      deadline = baseDeadlineExpress + transportDays + 1; // +1 dia de margem
    } else {
      // PAC: prazo base + dias de transporte + margem de segurança
      const transportDays = Math.ceil(distanceKm / avgSpeedKmPerDayStandard);
      deadline = baseDeadlineStandard + transportDays + 2; // +2 dias de margem
    }

    // Limitar prazo mínimo e máximo com valores mais realistas
    if (serviceType === 'express') {
      // SEDEX: mínimo 2 dias, máximo 10 dias úteis
      deadline = Math.max(2, Math.min(deadline, 10));
    } else {
      // PAC: mínimo 5 dias, máximo 20 dias úteis
      deadline = Math.max(5, Math.min(deadline, 20));
    }

    this.logger.debug(`Cálculo de frete: distância=${distanceKm.toFixed(2)}km, peso=${finalWeightKg.toFixed(2)}kg, tipo=${serviceType}, preço=R$${price.toFixed(2)}, prazo=${deadline} dias`);

    return {
      valor: price,
      prazo: deadline,
    };
  }

  /**
   * Calcula frete por loja e também opção combinada (quando aplicável).
   * Usa dados reais de produtos/lojas do banco (peso, dimensões, CEP).
   * Calcula frete manualmente sem usar API dos Correios.
   */
  async calculateShipping(dto: CalculateShippingDto) {
    try {
      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException('Nenhum item informado para cálculo de frete.');
      }

      if (!dto.destinationZipCode) {
        throw new BadRequestException('CEP de destino não informado.');
      }

      const cleanDestinationCep = dto.destinationZipCode.replace(/\D/g, '');
      if (cleanDestinationCep.length !== 8) {
        throw new BadRequestException('CEP de destino inválido. Deve conter 8 dígitos numéricos.');
      }

      this.logger.debug(`Calculando frete: CEP destino=${cleanDestinationCep}, items=${dto.items.length}, serviceType=${dto.serviceType || 'standard'}`);

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
      const shippingResult = this.calculateShippingPriceAndDeadline({
        cepOrigem: group.originZipCode,
        cepDestino: cleanDestinationCep,
        pesoKg: group.totalWeightKg,
        comprimentoCm: group.maxDepthCm,
        larguraCm: group.maxWidthCm,
        alturaCm: group.maxHeightCm,
        serviceType: serviceType === ShippingServiceType.EXPRESS ? 'express' : 'standard',
      });

      sumSeparatePrice += shippingResult.valor;
      maxSeparateDeadline = Math.max(maxSeparateDeadline, shippingResult.prazo || 0);

      perStoreResults.push({
        storeId: group.storeId,
        storeName: group.storeName,
        originZipCode: group.originZipCode,
        originCity: group.city,
        originState: group.state,
        destinationZipCode: cleanDestinationCep,
        serviceType: serviceType,
        price: shippingResult.valor,
        deadlineDays: shippingResult.prazo,
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
    } catch (error: any) {
      this.logger.error('Erro ao calcular frete:', {
        error: error.message,
        stack: error.stack,
        dto: {
          destinationZipCode: dto.destinationZipCode,
          itemsCount: dto.items?.length || 0,
          serviceType: dto.serviceType,
        },
      });

      // Se já for uma BadRequestException, relançar
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Para outros erros, lançar como erro genérico com mensagem clara
      throw new BadRequestException(
        `Erro ao calcular frete: ${error.message || 'Erro desconhecido. Verifique se todos os produtos têm loja e CEP configurados.'}`,
      );
    }
  }
}
