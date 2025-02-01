import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { GetCurrentUserId, Roles } from 'src/common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  @Roles(UserRole.ADMIN)
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.MODERATOR)
  getCurrentUser(@GetCurrentUserId() userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('update')
  @Roles(UserRole.ADMIN, UserRole.USER)
  updateUserProfile(
    @Body() dto: UpdateUserDto,
    @GetCurrentUserId() userId: string,
  ) {
    return this.usersService.updateUserProfile(dto, userId);
  }
}
