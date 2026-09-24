import { Injectable, NotFoundException } from '@nestjs/common';
import { calcularSubtotalItem } from '../orders/pricing';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    const itens = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { hotel: true },
      orderBy: { id: 'asc' },
    });

    let totalCentavos = 0;
    const itensComSubtotal = itens.map((item) => {
      const preco = Number(item.hotel.preco);
      const subtotal = calcularSubtotalItem({ preco, diarias: item.diarias });
      totalCentavos += Math.round(subtotal * 100);

      return { ...item, hotel: { ...item.hotel, preco }, subtotal };
    });

    return { itens: itensComSubtotal, total: totalCentavos / 100 };
  }

  async add(userId: number, addCartItemDto: AddCartItemDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(
        `Nenhum usuário encontrado com o id ${userId}`,
      );
    }

    const hotel = await this.prisma.hotel.findUnique({
      where: { id: addCartItemDto.hotelId },
    });
    if (!hotel) {
      throw new NotFoundException(
        `Nenhum hotel encontrado com o id ${addCartItemDto.hotelId}`,
      );
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { userId, hotelId: addCartItemDto.hotelId },
    });

    if (item) {
      return this.prisma.cartItem.update({
        where: { id: item.id },
        data: { diarias: item.diarias + addCartItemDto.diarias },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        userId,
        hotelId: addCartItemDto.hotelId,
        diarias: addCartItemDto.diarias,
      },
    });
  }

  async update(
    userId: number,
    itemId: number,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    await this.findItem(userId, itemId);

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { diarias: updateCartItemDto.diarias },
    });
  }

  async remove(userId: number, itemId: number) {
    await this.findItem(userId, itemId);

    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  clear(userId: number) {
    return this.prisma.cartItem.deleteMany({ where: { userId } });
  }

  private async findItem(userId: number, itemId: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException(`Nenhum item encontrado com o id ${itemId}`);
    }

    return item;
  }
}
