import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNotEmpty()
  quantity: number;
}

export enum ShippingMode {
  COMBINED = 'combined',
  SEPARATE = 'separate',
  BOTH = 'both',
}

export enum ShippingServiceType {
  STANDARD = 'standard', // PAC - mais barato, mais lento
  EXPRESS = 'express',   // SEDEX - mais caro, mais rápido
}

export class CalculateShippingDto {
  @IsString()
  @IsNotEmpty()
  destinationZipCode: string;

  @IsOptional()
  @IsString()
  destinationCity?: string;

  @IsOptional()
  @IsString()
  destinationState?: string;

  /**
   * Modo de cálculo:
   * - 'separate': calcula apenas frete separado por loja
   * - 'combined': calcula apenas opção combinada
   * - 'both' (default): retorna as duas opções para o cliente escolher
   */
  @IsOptional()
  @IsEnum(ShippingMode)
  mode: ShippingMode = ShippingMode.BOTH;

  /**
   * Tipo de serviço dos Correios:
   * - 'standard': PAC (mais barato, mais lento)
   * - 'express': SEDEX (mais caro, mais rápido)
   */
  @IsOptional()
  @IsEnum(ShippingServiceType)
  serviceType?: ShippingServiceType = ShippingServiceType.STANDARD;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingItemDto)
  items: ShippingItemDto[];
}


