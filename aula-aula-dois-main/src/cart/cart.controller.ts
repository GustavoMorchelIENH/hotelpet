import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  findAll(@Param('userId', ParseIntPipe) userId: number) {
    return this.cartService.findAll(userId);
  }

  @Post(':userId')
  add(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() addCartItemDto: AddCartItemDto,
  ) {
    return this.cartService.add(userId, addCartItemDto);
  }

  @Patch(':userId/:itemId')
  update(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.update(userId, itemId, updateCartItemDto);
  }

  @Delete(':userId/:itemId')
  remove(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.cartService.remove(userId, itemId);
  }

  @Delete(':userId')
  clear(@Param('userId', ParseIntPipe) userId: number) {
    return this.cartService.clear(userId);
  }
}
