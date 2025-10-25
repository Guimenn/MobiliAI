import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class CreateTimeClockDto {
  @IsString()
  employeeId: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
