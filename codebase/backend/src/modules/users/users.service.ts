import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async register(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.getByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = await this.usersRepository.insert({
      email: createUserDto.email,
      name: createUserDto.name,
      password: hashedPassword,
    });

    return user;
  }

  async getByEmail(email: string): Promise<User | null> {
    return this.usersRepository.getByEmail(email);
  }

  async getById(id: string): Promise<User> {
    const user = await this.usersRepository.getById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updateData: Partial<User> = {};
    if (updateUserDto.name) {
      updateData.name = updateUserDto.name;
    }
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    const user = await this.usersRepository.updateById(id, updateData);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const deleted = await this.usersRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
