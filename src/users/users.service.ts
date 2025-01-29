// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const user = this.prisma.user.create({
        data: {
          ...createUserDto,
          roles: createUserDto.roles || [Roles.USER],
        },
      });
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('User with this phone number already exists');
      }
      throw error;
    }
  }

  async updateRefreshToken(id: string, refreshToken: string) {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }
}
