import { IsString, IsNumber, IsEnum, IsBoolean, IsOptional, Min, IsDateString } from 'class-validator';

export class CreateCashFlowDto {
  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  category: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}

