import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePurchaseItemDto {
  @IsOptional()
  @IsString()
  rawMaterialId?: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  unit: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}
