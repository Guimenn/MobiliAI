import { IsString, IsDateString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';

export enum MedicalCertificateType {
  MEDICAL = 'MEDICAL',
  DENTAL = 'DENTAL',
  PSYCHOLOGICAL = 'PSYCHOLOGICAL',
  OTHER = 'OTHER',
}

export enum MedicalCertificateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CreateMedicalCertificateDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsEnum(MedicalCertificateType)
  @IsNotEmpty()
  type: MedicalCertificateType;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  doctorName: string;

  @IsString()
  @IsNotEmpty()
  doctorCrm: string;

  @IsString()
  @IsNotEmpty()
  clinicName: string;

  @IsEnum(MedicalCertificateStatus)
  @IsOptional()
  status?: MedicalCertificateStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}



