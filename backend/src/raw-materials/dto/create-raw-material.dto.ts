import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateRawMaterialDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  referencePrice?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
