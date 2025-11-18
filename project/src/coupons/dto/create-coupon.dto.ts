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

export enum CouponAssignmentType {
  EXCLUSIVE = 'EXCLUSIVE',
  ALL_ACCOUNTS = 'ALL_ACCOUNTS',
  NEW_ACCOUNTS_ONLY = 'NEW_ACCOUNTS_ONLY',
}

export enum CouponType {
  PRODUCT = 'PRODUCT',
  SHIPPING = 'SHIPPING',
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

  @IsOptional()
  @IsEnum(CouponAssignmentType)
  assignmentType?: CouponAssignmentType;

  @IsOptional()
  @IsEnum(CouponType)
  couponType?: CouponType;
}

