import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async insert(userData: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async getByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email, deletedAt: null }).select('+password').exec();
  }

  async getById(id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async updateById(id: string, updateData: Partial<User>): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, updateData, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.userModel
      .updateOne({ _id: id, deletedAt: null }, { deletedAt: new Date(), isActive: false })
      .exec();
    return result.modifiedCount > 0;
  }
}
