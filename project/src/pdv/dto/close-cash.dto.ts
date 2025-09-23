import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseCashDto {
  @IsNumber()
  @Min(0)
  closingAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

