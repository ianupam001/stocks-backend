import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, FeatureRequestDto, UpdateUserDto } from './dto';
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

  @Get()
  @Roles(UserRole.ADMIN)
  getAllUsers() {
    return this.usersService.findAll();
  }
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

  @Post('request-feature')
  @Roles(UserRole.ADMIN, UserRole.USER)
  requestFeature(
    @GetCurrentUserId() userId: string,
    @Body() dto: FeatureRequestDto,
  ) {
    return this.usersService.requestFeature(userId, dto);
  }

  @Get('requested-features')
  @Roles(UserRole.USER)
  getFeatures(@GetCurrentUserId() userId: string) {
    return this.usersService.getRequestedFeatures(userId);
  }

  @Get('features')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'For admin' })
  getAllFeatures() {
    return this.usersService.getAllFeatures();
  }

  @Get('feature/:featureId')
  @ApiOperation({ summary: 'For admin' })
  @Roles(UserRole.ADMIN)
  getFeature(
    @GetCurrentUserId() userId: string,
    @Param('featureId') featureId: string,
  ) {
    return this.usersService.getFeatureById(userId, featureId);
  }
}
