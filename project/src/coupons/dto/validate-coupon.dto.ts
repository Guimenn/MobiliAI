import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateCouponDto {
  @IsString()
  code: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'shippingCost deve ser um número' })
  @Min(0, { message: 'shippingCost deve ser maior ou igual a 0' })
  shippingCost?: number;
}

