import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { FORMAS_PAGAMENTO, MAX_PARCELAS } from '../pricing';
import type { FormaPagamento } from '../pricing';

export class CreateOrderDto {
  @IsIn(FORMAS_PAGAMENTO)
  formaPagamento!: FormaPagamento;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PARCELAS)
  parcelas?: number;
}
