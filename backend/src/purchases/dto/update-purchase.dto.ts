import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdatePurchaseDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
