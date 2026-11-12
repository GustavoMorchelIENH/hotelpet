import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './entities/user.entity';

export interface PublicUser {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
}

export interface AuthenticatedUserResponse extends PublicUser {
  accessToken: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<AuthenticatedUserResponse> {
    const existente = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existente) {
      throw new ConflictException(
        `O email ${createUserDto.email} já está em uso`,
      );
    }

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        senha: await hash(createUserDto.senha, 12),
      },
    });

    return this.autenticar(user);
  }

  async login(loginDto: LoginDto): Promise<AuthenticatedUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const senhaHasheada = /^\$2[aby]\$\d{2}\$/.test(user.senha);
    const senhaValida = senhaHasheada
      ? await compare(loginDto.senha, user.senha)
      : user.senha === loginDto.senha;

    if (!senhaValida) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    if (!senhaHasheada) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { senha: await hash(loginDto.senha, 12) },
      });
    }

    return this.autenticar(user);
  }

  async findOne(id: number): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Nenhum usuário encontrado com o id ${id}`);
    }

    return this.publicUser(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<PublicUser> {
    await this.findOne(id);

    if (updateUserDto.email) {
      const existente = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existente && existente.id !== id) {
        throw new ConflictException(
          `O email ${updateUserDto.email} já está em uso`,
        );
      }
    }

    const data = { ...updateUserDto };
    if (data.senha) {
      data.senha = await hash(data.senha, 12);
    }

    const user = await this.prisma.user.update({ where: { id }, data });
    return this.publicUser(user);
  }

  async remove(id: number): Promise<PublicUser> {
    await this.findOne(id);

    const user = await this.prisma.user.delete({ where: { id } });
    return this.publicUser(user);
  }

  private async autenticar(user: User): Promise<AuthenticatedUserResponse> {
    return {
      ...this.publicUser(user),
      accessToken: await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
      }),
    };
  }

  private publicUser(user: User): PublicUser {
    return {
      id: user.id,
      nome: user.nome,
      sobrenome: user.sobrenome,
      email: user.email,
    };
  }
}
