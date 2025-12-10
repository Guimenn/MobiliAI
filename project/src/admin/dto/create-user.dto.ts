import { IsString, IsEmail, IsEnum, IsOptional, IsUUID, MinLength, MaxLength, IsBoolean, IsObject, IsNumberString, ValidateIf, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';
import { IsStringOrNumber } from '../decorators/string-or-number.decorator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @Transform(({ value }) => {
    // Converter string vazia para undefined para que @IsOptional() funcione corretamente
    if (value === '' || value === null) {
      return undefined;
    }
    return value;
  })
  @IsOptional()
  @IsUUID()
  storeId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cpf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipCode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  workingHours?: any;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
