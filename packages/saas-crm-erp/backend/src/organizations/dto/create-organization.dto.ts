import { IsString, IsOptional, IsJSON } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  stripe_customer_id?: string;

  @IsOptional()
  @IsString()
  stripe_account_id?: string;

  @IsOptional()
  @IsJSON()
  settings?: Record<string, any>;
}
