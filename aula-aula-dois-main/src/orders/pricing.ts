export const FORMAS_PAGAMENTO = ['pix', 'cartao'] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const DESCONTO_PIX = 0.05;
export const MAX_PARCELAS = 6;

export interface ItemPrecificavel {
  preco: number;
  diarias: number;
}

// Os cálculos são feitos em centavos para evitar erros de ponto flutuante
function emCentavos(valor: number): number {
  return Math.round(valor * 100);
}

export function calcularSubtotalItem(item: ItemPrecificavel): number {
  return (emCentavos(item.preco) * item.diarias) / 100;
}

export function calcularTotais(
  itens: ItemPrecificavel[],
  formaPagamento: FormaPagamento,
  parcelas = 1,
) {
  let subtotal = 0;
  for (const item of itens) {
    subtotal += emCentavos(item.preco) * item.diarias;
  }

  const desconto =
    formaPagamento === 'pix' ? Math.round(subtotal * DESCONTO_PIX) : 0;
  const total = subtotal - desconto;
  const numeroParcelas = formaPagamento === 'cartao' ? parcelas : 1;

  return {
    subtotal: subtotal / 100,
    desconto: desconto / 100,
    total: total / 100,
    parcelas: numeroParcelas,
    valorParcela: Math.round(total / numeroParcelas) / 100,
  };
}
