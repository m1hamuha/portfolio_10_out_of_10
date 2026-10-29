import {
  IsOptional,
  IsNumber,
  Min,
  IsString,
  IsEnum,
  IsObject,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../payment.entity';

export class UpdatePaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  transaction_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
