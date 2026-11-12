import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const prismaMock = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const jwtServiceMock = {
    signAsync: jest.fn().mockResolvedValue('test-access-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('hashes new passwords and returns a JWT without exposing the hash', async () => {
    const user = {
      id: 1,
      nome: 'Ana',
      sobrenome: 'Silva',
      email: 'ana@example.com',
      senha: '',
    };
    let createdPasswordHash = '';
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(
      ({ data }: { data: { senha: string } }) => {
        createdPasswordHash = data.senha;
        return Promise.resolve({ ...user, ...data });
      },
    );

    const result = await service.create({
      nome: 'Ana',
      sobrenome: 'Silva',
      email: 'ana@example.com',
      senha: 'senha-segura',
    });

    expect(await compare('senha-segura', createdPasswordHash)).toBe(true);
    expect(result).toEqual({
      id: 1,
      nome: 'Ana',
      sobrenome: 'Silva',
      email: 'ana@example.com',
      accessToken: 'test-access-token',
    });
  });

  it('upgrades a valid legacy plaintext password after login', async () => {
    let updatedPasswordHash = '';
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      nome: 'Ana',
      sobrenome: 'Silva',
      email: 'ana@example.com',
      senha: 'senha-antiga',
    });
    prismaMock.user.update.mockImplementation(
      ({ data }: { data: { senha: string } }) => {
        updatedPasswordHash = data.senha;
        return Promise.resolve({
          id: 1,
          nome: 'Ana',
          sobrenome: 'Silva',
          email: 'ana@example.com',
          ...data,
        });
      },
    );

    const result = await service.login({
      email: 'ana@example.com',
      senha: 'senha-antiga',
    });

    expect(await compare('senha-antiga', updatedPasswordHash)).toBe(true);
    expect(result.accessToken).toBe('test-access-token');
    expect(result).not.toHaveProperty('senha');
  });

  it('rejects an incorrect password without issuing a token', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      nome: 'Ana',
      sobrenome: 'Silva',
      email: 'ana@example.com',
      senha: 'senha-correta',
    });

    await expect(
      service.login({ email: 'ana@example.com', senha: 'senha-incorreta' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });
});
