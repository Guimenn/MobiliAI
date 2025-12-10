import { IsString, IsEmail, IsEnum, IsOptional, IsUUID, IsBoolean, MinLength, MaxLength, IsObject, IsNumber, Min, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @Transform(({ value }) => {
    // Converter string vazia para undefined para que @IsOptional() funcione corretamente
    if (value === '' || value === null) {
      return undefined;
    }
    return value;
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  salary?: number;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsOptional()
  @IsObject()
  workingHours?: any;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
