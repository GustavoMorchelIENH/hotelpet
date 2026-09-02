import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existente = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existente) {
      throw new ConflictException(
        `O email ${createUserDto.email} já está em uso`,
      );
    }

    return this.prisma.user.create({ data: createUserDto });
  }

  findAll(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Nenhum usuário encontrado com o id ${id}`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
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

    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  async remove(id: number): Promise<User> {
    await this.findOne(id);

    return this.prisma.user.delete({ where: { id } });
  }
}
