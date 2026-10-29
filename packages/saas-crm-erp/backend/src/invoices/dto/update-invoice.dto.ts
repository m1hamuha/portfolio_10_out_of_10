import {
  IsOptional,
  IsArray,
  IsDateString,
  IsString,
  IsNumber,
  Min,
  IsObject,
  IsEnum,
} from 'class-validator';
import { InvoiceItem, InvoiceStatus } from '../invoice.entity';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsArray()
  items?: InvoiceItem[];

  @IsOptional()
  @IsDateString()
  due_date?: string;

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
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
