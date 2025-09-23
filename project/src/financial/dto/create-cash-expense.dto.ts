import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCashExpenseDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

