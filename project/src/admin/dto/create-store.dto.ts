import { IsString, IsEmail, IsOptional, IsUUID, MinLength, MaxLength, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateStoreDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  address: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Converter string vazia para undefined para que @IsOptional() funcione corretamente
    if (value === '' || value === null) {
      return undefined;
    }
    return value;
  })
  @IsUUID()
  managerId?: string;

  @IsOptional()
  @IsString()
  openingTime?: string;

  @IsOptional()
  @IsString()
  closingTime?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workingDays?: string[];

  @IsOptional()
  @IsString()
  lunchStart?: string;

  @IsOptional()
  @IsString()
  lunchEnd?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
