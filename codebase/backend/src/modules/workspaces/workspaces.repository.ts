import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workspace, WorkspaceDocument } from './entities/workspace.entity';
import { ApiKey, ApiKeyDocument } from './entities/api-key.entity';

@Injectable()
export class WorkspacesRepository {
  constructor(
    @InjectModel(Workspace.name) private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(ApiKey.name) private readonly apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  async insert(data: Partial<Workspace>): Promise<WorkspaceDocument> {
    const ws = new this.workspaceModel(data);
    return ws.save();
  }

  async getById(id: string): Promise<WorkspaceDocument | null> {
    return this.workspaceModel.findById(id).exec();
  }

  async getByOwner(ownerId: string): Promise<WorkspaceDocument[]> {
    return this.workspaceModel.find({ ownerId }).exec();
  }

  async updateById(id: string, updateData: Partial<Workspace>): Promise<WorkspaceDocument | null> {
    return this.workspaceModel
      .findOneAndUpdate({ _id: id }, updateData, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.workspaceModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async insertKey(data: Partial<ApiKey>): Promise<ApiKeyDocument> {
    const key = new this.apiKeyModel(data);
    return key.save();
  }

  async getKeysByWorkspace(workspaceId: string): Promise<ApiKeyDocument[]> {
    return this.apiKeyModel.find({ workspaceId }).exec();
  }

  async getKeyByHash(hash: string): Promise<ApiKeyDocument | null> {
    return this.apiKeyModel.findOne({ keyHash: hash, isActive: true }).exec();
  }

  async deleteKey(id: string): Promise<boolean> {
    const result = await this.apiKeyModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }
}
