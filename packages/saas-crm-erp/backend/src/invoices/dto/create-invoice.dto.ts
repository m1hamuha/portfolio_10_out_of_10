import {
  IsNotEmpty,
  IsUUID,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { InvoiceItem } from '../invoice.entity';

export class CreateInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  customer_id!: string;

  @IsUUID()
  @IsNotEmpty()
  organization_id!: string;

  @IsArray()
  @IsNotEmpty()
  items!: InvoiceItem[];

  @IsDateString()
  @IsNotEmpty()
  due_date!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax_amount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
