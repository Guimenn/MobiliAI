import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class SaleItemDto {
  @IsUUID()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tax?: number;

  @IsEnum(PaymentMethod)
  @Transform(({ value }) => {
    // Garantir que o valor do enum está em maiúsculas
    if (typeof value === 'string') {
      return value.toUpperCase() as PaymentMethod;
    }
    return value;
  })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}

