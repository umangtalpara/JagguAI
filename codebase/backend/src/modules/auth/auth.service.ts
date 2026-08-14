import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    return this.usersService.register(registerDto);
  }

  async login(loginDto: LoginDto): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.usersService.getByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userId = (user as unknown as Record<string, unknown>)['_id'];
    const payload: JwtPayload = { 
      sub: String(userId || ''), 
      email: user.email, 
      role: user.role 
    };
    
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { user, accessToken, refreshToken };
  }

  async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;
      const user = await this.usersService.getById(payload.sub);
      
      const userId = (user as unknown as Record<string, unknown>)['_id'];
      const newPayload: JwtPayload = { 
        sub: String(userId || ''), 
        email: user.email, 
        role: user.role 
      };
      
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
      const refreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      return { accessToken, refreshToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private readonly resetTokens = new Map<string, string>();

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.getByEmail(email);
    if (!user) {
      // Return success anyway to avoid user enumeration
      return;
    }

    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();
    this.resetTokens.set(token, email);

    console.log(`[MOCK EMAIL] Password reset token for ${email}: ${token}`);
    console.log(`[MOCK EMAIL] Reset link: http://localhost:3000/auth/reset-password?token=${token}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const email = this.resetTokens.get(token);
    if (!email) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    const user = await this.usersService.getByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = String((user as any)._id || '');
    await this.usersService.updateProfile(userId, { password: newPassword });
    this.resetTokens.delete(token);
  }
}
