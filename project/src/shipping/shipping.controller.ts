import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ShippingService, CepResponse } from './shipping.service';
import { CalculateShippingDto, ShippingMode } from './dto/calculate-shipping.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  /**
   * Consulta de CEP via ViaCEP (API pública e gratuita).
   * Permite buscar endereço a partir do CEP.
   * Referência: https://viacep.com.br/
   */
  @Get('cep/:cep')
  async lookupCep(@Param('cep') cep: string): Promise<CepResponse> {
    return this.shippingService.lookupCep(cep);
  }

  /**
   * (Opcional) Busca CEP aproximado a partir de cidade/UF e logradouro.
   * Nem todos os contratos da API dos Correios habilitam essa funcionalidade,
   * por isso este endpoint é apenas um "proxy" e pode ser ajustado depois.
   */
  @Get('cep')
  async lookupCepByAddress(
    @Query('logradouro') logradouro: string,
    @Query('cidade') cidade: string,
    @Query('uf') uf: string,
  ) {
    // Por enquanto, reaproveitamos a lógica de lookupCep se o cliente já souber o CEP.
    // Caso queira implementar a busca de CEP por endereço, este é o lugar ideal.
    return {
      message:
        'Busca de CEP por endereço ainda não implementada. Use /shipping/cep/:cep para consulta direta.',
      logradouro,
      cidade,
      uf,
    };
  }

  /**
   * Calcula frete manualmente (sem API dos Correios) considerando múltiplas lojas.
   * Retorna opções de frete SEPARADO e COMBINADO para o frontend exibir ao cliente.
   * O cálculo é baseado em distância estimada, peso e tipo de serviço.
   */
  @Post('quote')
  async calculateShipping(@Body() body: CalculateShippingDto) {
    try {
      // Garantir valor padrão seguro para mode
      if (!body.mode) {
        body.mode = ShippingMode.BOTH;
      }

      console.log('📦 Iniciando cálculo de frete:', {
        destinationZipCode: body.destinationZipCode,
        itemsCount: body.items?.length || 0,
        serviceType: body.serviceType,
        mode: body.mode,
      });

      const result = await this.shippingService.calculateShipping(body);
      
      // Log para debug
      console.log('📦 Resultado do cálculo de frete:', JSON.stringify({
        destination: result.destination,
        modeRequested: result.modeRequested,
        separateGroups: result.separate?.groups?.length || 0,
        combinedAvailable: !!result.combined,
      }, null, 2));
      
      return result;
    } catch (error: any) {
      console.error('❌ Erro no controller de shipping:', {
        error: error.message,
        stack: error.stack,
        status: error.status,
        response: error.response,
      });
      throw error;
    }
  }
}


