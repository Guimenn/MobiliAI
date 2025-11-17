import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsBoolean, Min, Max, ValidateIf } from 'class-validator';

export enum CouponDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum CouponApplicableTo {
  ALL = 'ALL',
  CATEGORY = 'CATEGORY',
  PRODUCT = 'PRODUCT',
  STORE = 'STORE',
}

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CouponDiscountType)
  discountType: CouponDiscountType;

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumPurchase?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;

  @IsEnum(CouponApplicableTo)
  @IsOptional()
  applicableTo?: CouponApplicableTo;

  @ValidateIf(o => o.applicableTo === 'CATEGORY')
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ValidateIf(o => o.applicableTo === 'PRODUCT')
  @IsString()
  @IsOptional()
  productId?: string;

  @ValidateIf(o => o.applicableTo === 'STORE')
  @IsString()
  @IsOptional()
  storeId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

