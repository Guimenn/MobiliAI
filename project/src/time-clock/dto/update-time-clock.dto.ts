import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class UpdateTimeClockDto {
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
  clockOut?: string;

  @IsString()
  @IsOptional()
  clockOutPhoto?: string;

  @IsNumber()
  @IsOptional()
  clockOutLatitude?: number;

  @IsNumber()
  @IsOptional()
  clockOutLongitude?: number;

  @IsString()
  @IsOptional()
  clockOutAddress?: string;

  @IsNumber()
  @IsOptional()
  totalHours?: number;

  @IsNumber()
  @IsOptional()
  regularHours?: number;

  @IsNumber()
  @IsOptional()
  overtimeHours?: number;

  @IsNumber()
  @IsOptional()
  lunchBreakMinutes?: number;

  @IsNumber()
  @IsOptional()
  minutesLate?: number;

  @IsEnum(['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
