import {
  IsOptional,
  IsUUID,
  IsString,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsObject,
  IsEnum,
} from 'class-validator';
import { DealStage } from '../deal.entity';

export class UpdateDealDto {
  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsDateString()
  expected_close_date?: string;

  @IsOptional()
  @IsDateString()
  actual_close_date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
