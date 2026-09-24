import { Controller, Get, Header, Param, ParseIntPipe } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getHello(): Promise<string> {
    return this.appService.getHello();
  }

  @Get('carrinho')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getCarrinho(): string {
    return this.appService.getCarrinho();
  }

  @Get('checkout')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getCheckout(): string {
    return this.appService.getCheckout();
  }

  @Get('pedidos')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPedidos(): string {
    return this.appService.getPedidos();
  }

  @Get('pedido/:id')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPedido(@Param('id', ParseIntPipe) id: number): string {
    return this.appService.getPedido(id);
  }
}
