import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';
import { DealStage } from '../deal.entity';

export class CreateDealDto {
  @IsUUID()
  @IsNotEmpty()
  customer_id!: string;

  @IsUUID()
  @IsNotEmpty()
  organization_id!: string;

  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsDateString()
  @IsNotEmpty()
  expected_close_date!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
