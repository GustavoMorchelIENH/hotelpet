import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: {
            cartItem: {
              findMany: jest.fn().mockResolvedValue([
                { id: 1, diarias: 2, hotel: { preco: 280 } },
                { id: 2, diarias: 1, hotel: { preco: 220 } },
              ]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate the cart total', async () => {
    const cart = await service.findAll(1);

    expect(cart.total).toBe(780);
  });
});
