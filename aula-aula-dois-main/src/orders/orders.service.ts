import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { calcularSubtotalItem, calcularTotais } from './pricing';

type PedidoComItens = {
  id: number;
  userId: number;
  formaPagamento: string;
  parcelas: number;
  subtotal: unknown;
  desconto: unknown;
  total: unknown;
  criadoEm: Date;
  itens: {
    id: number;
    hotelId: number;
    nomeHotel: string;
    precoUnitario: unknown;
    diarias: number;
    dataEntrada: Date | null;
    subtotal: unknown;
  }[];
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, createOrderDto: CreateOrderDto) {
    const pedido = await this.prisma.$transaction(async (tx) => {
      const carrinho = await tx.cartItem.findMany({
        where: { userId },
        include: { hotel: true },
        orderBy: { id: 'asc' },
      });

      if (carrinho.length === 0) {
        throw new BadRequestException('O carrinho está vazio');
      }

      const itens = carrinho.map((item) => ({
        hotelId: item.hotelId,
        nomeHotel: item.hotel.nome,
        precoUnitario: Number(item.hotel.preco),
        diarias: item.diarias,
        dataEntrada: item.dataEntrada,
        subtotal: calcularSubtotalItem({
          preco: Number(item.hotel.preco),
          diarias: item.diarias,
        }),
      }));

      const totais = calcularTotais(
        itens.map((item) => ({
          preco: item.precoUnitario,
          diarias: item.diarias,
        })),
        createOrderDto.formaPagamento,
        createOrderDto.parcelas,
      );

      const novoPedido = await tx.order.create({
        data: {
          userId,
          formaPagamento: createOrderDto.formaPagamento,
          parcelas: totais.parcelas,
          subtotal: totais.subtotal,
          desconto: totais.desconto,
          total: totais.total,
          itens: { create: itens },
        },
        include: { itens: true },
      });

      await tx.cartItem.deleteMany({ where: { userId } });

      return novoPedido;
    });

    return this.formatar(pedido);
  }

  async findAll(userId: number) {
    const pedidos = await this.prisma.order.findMany({
      where: { userId },
      include: { itens: true },
      orderBy: { id: 'desc' },
    });

    return pedidos.map((pedido) => this.formatar(pedido));
  }

  async findOne(userId: number, orderId: number) {
    const pedido = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { itens: true },
    });

    if (!pedido) {
      throw new NotFoundException(
        `Nenhum pedido encontrado com o id ${orderId}`,
      );
    }

    return this.formatar(pedido);
  }

  // Converte os campos Decimal do Prisma em números para o front-end
  private formatar(pedido: PedidoComItens) {
    const total = Number(pedido.total);

    return {
      ...pedido,
      subtotal: Number(pedido.subtotal),
      desconto: Number(pedido.desconto),
      total,
      valorParcela: Math.round((total * 100) / pedido.parcelas) / 100,
      itens: pedido.itens.map((item) => ({
        ...item,
        precoUnitario: Number(item.precoUnitario),
        subtotal: Number(item.subtotal),
      })),
    };
  }
}
