import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { WorkspacesRepository } from './workspaces.repository';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { Workspace } from './entities/workspace.entity';
import { ApiKey } from './entities/api-key.entity';
import { generateApiKey, hashApiKey, maskApiKey } from '../../common/utils/encryption.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';


@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspacesRepository: WorkspacesRepository,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createWorkspace(ownerId: string, dto: CreateWorkspaceDto): Promise<Workspace> {
    const ws = await this.workspacesRepository.insert({
      name: dto.name,
      ownerId,
      companyInfo: dto.companyInfo || '',
      branding: {
        logoUrl: dto.branding?.logoUrl || '',
        primaryColor: dto.branding?.primaryColor || '#2563eb',
        theme: dto.branding?.theme || 'light',
      },
    });

    const wsId = String((ws as any)._id || '');
    await this.auditLogsService.log(ownerId, wsId, 'WORKSPACE_CREATED', { name: ws.name });
    return ws;
  }

  async listWorkspaces(ownerId: string): Promise<Workspace[]> {
    return this.workspacesRepository.getByOwner(ownerId);
  }

  async getWorkspaceDetails(userId: string, workspaceId: string): Promise<Workspace> {
    const ws = await this.workspacesRepository.getById(workspaceId);
    if (!ws) {
      throw new NotFoundException('Workspace not found');
    }
    if (ws.ownerId.toString() !== userId) {
      throw new ForbiddenException('Not authorized to access this workspace');
    }
    return ws;
  }

  async updateWorkspace(userId: string, workspaceId: string, dto: UpdateWorkspaceDto): Promise<Workspace> {
    await this.getWorkspaceDetails(userId, workspaceId);

    const updateData: Partial<Workspace> = {};
    if (dto.name) {
      updateData.name = dto.name;
    }
    if (dto.companyInfo !== undefined) {
      updateData.companyInfo = dto.companyInfo;
    }
    if (dto.branding) {
      updateData.branding = {
        logoUrl: dto.branding.logoUrl ?? '',
        primaryColor: dto.branding.primaryColor ?? '#2563eb',
        theme: dto.branding.theme ?? 'light',
      };
    }

    const updated = await this.workspacesRepository.updateById(workspaceId, updateData);
    if (!updated) {
      throw new NotFoundException('Workspace not found');
    }

    await this.auditLogsService.log(userId, workspaceId, 'WORKSPACE_UPDATED', { updateFields: Object.keys(updateData) });
    return updated;
  }

  async deleteWorkspace(userId: string, workspaceId: string): Promise<void> {
    await this.getWorkspaceDetails(userId, workspaceId);
    await this.workspacesRepository.deleteById(workspaceId);
    await this.auditLogsService.log(userId, workspaceId, 'WORKSPACE_DELETED');
  }

  async generateWorkspaceKey(userId: string, workspaceId: string, name: string): Promise<{ apiKey: string }> {
    await this.getWorkspaceDetails(userId, workspaceId);
    
    const rawKey = generateApiKey();
    const hash = hashApiKey(rawKey);
    const masked = maskApiKey(rawKey);

    const apiKeyDoc = await this.workspacesRepository.insertKey({
      workspaceId,
      keyHash: hash,
      keyMasked: masked,
      name,
      isActive: true,
    });

    const keyId = String((apiKeyDoc as any)._id || '');
    await this.auditLogsService.log(userId, workspaceId, 'API_KEY_GENERATED', { keyId, keyName: name });

    return { apiKey: rawKey };
  }

  async listWorkspaceKeys(userId: string, workspaceId: string): Promise<ApiKey[]> {
    await this.getWorkspaceDetails(userId, workspaceId);
    return this.workspacesRepository.getKeysByWorkspace(workspaceId);
  }

  async revokeWorkspaceKey(userId: string, workspaceId: string, keyId: string): Promise<void> {
    await this.getWorkspaceDetails(userId, workspaceId);
    await this.workspacesRepository.deleteKey(keyId);
    await this.auditLogsService.log(userId, workspaceId, 'API_KEY_REVOKED', { keyId });
  }

  async validateKey(rawKey: string): Promise<Workspace | null> {
    const hash = hashApiKey(rawKey);
    const apiKeyDoc = await this.workspacesRepository.getKeyByHash(hash);
    if (!apiKeyDoc) {
      return null;
    }
    return this.workspacesRepository.getById(apiKeyDoc.workspaceId);
  }
}
