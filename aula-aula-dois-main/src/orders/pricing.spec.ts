import { calcularSubtotalItem, calcularTotais } from './pricing';

describe('pricing', () => {
  const itens = [
    { preco: 280, diarias: 2 },
    { preco: 220, diarias: 1 },
  ];

  it('should calculate the item subtotal', () => {
    expect(calcularSubtotalItem({ preco: 0.1, diarias: 3 })).toBe(0.3);
  });

  it('should apply the PIX discount', () => {
    expect(calcularTotais(itens, 'pix')).toEqual({
      subtotal: 780,
      desconto: 39,
      total: 741,
      parcelas: 1,
      valorParcela: 741,
    });
  });

  it('should split the card payment without discount', () => {
    expect(calcularTotais(itens, 'cartao', 3)).toEqual({
      subtotal: 780,
      desconto: 0,
      total: 780,
      parcelas: 3,
      valorParcela: 260,
    });
  });
});
