import { IsString, IsNotEmpty } from 'class-validator';

export class RedeemCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'Código do cupom é obrigatório' })
  code: string;
}




