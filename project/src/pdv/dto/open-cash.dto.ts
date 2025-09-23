import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenCashDto {
  @IsNumber()
  @Min(0)
  openingAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

