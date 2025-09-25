import { IsString, IsEmail, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';

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
  @IsUUID()
  managerId?: string;
}
