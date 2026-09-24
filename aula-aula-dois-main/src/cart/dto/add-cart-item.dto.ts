import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class AddCartItemDto {
  @IsInt()
  @Min(1)
  hotelId!: number;

  @IsInt()
  @Min(1)
  diarias!: number;

  @IsOptional()
  @IsDateString()
  dataEntrada?: string;
}
