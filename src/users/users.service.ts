// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from '@prisma/client';
import { CustomForbiddenException } from 'src/common/execeptions';
import { UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async findById(id: string) {
    try {
      return this.prisma.user.findUnique({ where: { id } });
    } catch (error) {
      throw new CustomForbiddenException('No user found with this user id');
    }
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const user = this.prisma.user.create({
        data: {
          ...createUserDto,
          roles: createUserDto.roles || [UserRole.USER],
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

  async updateUserProfile(dto: UpdateUserDto, userId: string) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new NotFoundException('No user found');
      }
      const response = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          ...dto,
        },
      });
      return response;
    } catch (error) {
      console.error(error);
      throw new CustomForbiddenException('Error while updating user');
    }
  }

  async updateRefreshToken(id: string, refreshToken: string) {
    const rtHash = await bcrypt.hash(refreshToken, 10);
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken: rtHash },
    });
  }

  async updateTotpSecret(id: string, secret: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('No user found');
      }
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          totpSecret: secret,
        },
      });
    } catch (error) {
      console.error(error);
      throw new CustomForbiddenException('Error while updating user');
    }
  }

  async enableTwoFA(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFAEnabled: true },
    });
  }

  async findByIp(ip: string) {
    return this.prisma.user.findFirst({ where: { currentIp: ip } });
  }

  async updateSession(userId: string, ip: string, sessionId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { currentIp: ip, currentSessionId: sessionId },
    });
  }
}
