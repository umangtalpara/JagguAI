import { Controller, Get, Body, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  async getProfile(@Request() req: RequestWithUser): Promise<UserResponseDto> {
    const user = await this.usersService.getById(req.user.id);
    const userId = (user as unknown as Record<string, unknown>)['_id'];
    const userCreatedAt = (user as unknown as Record<string, unknown>)['createdAt'];
    return {
      id: String(userId || ''),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: userCreatedAt instanceof Date ? userCreatedAt : new Date(),
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  async updateProfile(@Request() req: RequestWithUser, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.updateProfile(req.user.id, updateUserDto);
    const userId = (user as unknown as Record<string, unknown>)['_id'];
    const userCreatedAt = (user as unknown as Record<string, unknown>)['createdAt'];
    return {
      id: String(userId || ''),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: userCreatedAt instanceof Date ? userCreatedAt : new Date(),
    };
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete user account (soft delete)' })
  async remove(@Request() req: RequestWithUser): Promise<{ success: boolean }> {
    await this.usersService.deleteUser(req.user.id);
    return { success: true };
  }
}
