import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiCreatedResponse({ type: WorkspaceResponseDto })
  async create(
    @Request() req: RequestWithUser,
    @Body() dto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const ws = await this.workspacesService.createWorkspace(req.user.id, dto);
    const wsId = (ws as unknown as Record<string, unknown>)['_id'];
    const wsCreatedAt = (ws as unknown as Record<string, unknown>)['createdAt'];
    return {
      id: String(wsId || ''),
      name: ws.name,
      ownerId: ws.ownerId,
      companyInfo: ws.companyInfo,
      branding: ws.branding,
      createdAt: wsCreatedAt instanceof Date ? wsCreatedAt : new Date(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all workspaces owned by the user' })
  @ApiOkResponse({ type: [WorkspaceResponseDto] })
  async findAll(@Request() req: RequestWithUser): Promise<WorkspaceResponseDto[]> {
    const list = await this.workspacesService.listWorkspaces(req.user.id);
    return list.map(ws => {
      const wsId = (ws as unknown as Record<string, unknown>)['_id'];
      const wsCreatedAt = (ws as unknown as Record<string, unknown>)['createdAt'];
      return {
        id: String(wsId || ''),
        name: ws.name,
        ownerId: ws.ownerId,
        companyInfo: ws.companyInfo,
        branding: ws.branding,
        createdAt: wsCreatedAt instanceof Date ? wsCreatedAt : new Date(),
      };
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details' })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  async findOne(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<WorkspaceResponseDto> {
    const ws = await this.workspacesService.getWorkspaceDetails(req.user.id, id);
    const wsId = (ws as unknown as Record<string, unknown>)['_id'];
    const wsCreatedAt = (ws as unknown as Record<string, unknown>)['createdAt'];
    return {
      id: String(wsId || ''),
      name: ws.name,
      ownerId: ws.ownerId,
      companyInfo: ws.companyInfo,
      branding: ws.branding,
      createdAt: wsCreatedAt instanceof Date ? wsCreatedAt : new Date(),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace configurations' })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const ws = await this.workspacesService.updateWorkspace(req.user.id, id, dto);
    const wsId = (ws as unknown as Record<string, unknown>)['_id'];
    const wsCreatedAt = (ws as unknown as Record<string, unknown>)['createdAt'];
    return {
      id: String(wsId || ''),
      name: ws.name,
      ownerId: ws.ownerId,
      companyInfo: ws.companyInfo,
      branding: ws.branding,
      createdAt: wsCreatedAt instanceof Date ? wsCreatedAt : new Date(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workspace' })
  async remove(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.workspacesService.deleteWorkspace(req.user.id, id);
  }

  // API Key Endpoints
  @Post(':id/api-keys')
  @ApiOperation({ summary: 'Generate a new API Key for workspace' })
  async generateKey(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: CreateApiKeyDto,
  ): Promise<{ apiKey: string }> {
    return this.workspacesService.generateWorkspaceKey(req.user.id, id, dto.name);
  }

  @Get(':id/api-keys')
  @ApiOperation({ summary: 'List API Keys for workspace' })
  async listKeys(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<unknown[]> {
    const keys = await this.workspacesService.listWorkspaceKeys(req.user.id, id);
    return keys.map(k => {
      const kId = (k as unknown as Record<string, unknown>)['_id'];
      const kCreatedAt = (k as unknown as Record<string, unknown>)['createdAt'];
      const plainKey = (k as unknown as Record<string, unknown>)['keyPlain'] || (k as unknown as Record<string, unknown>)['apiKey'] || k.keyMasked;
      return {
        id: String(kId || ''),
        workspaceId: k.workspaceId,
        name: k.name,
        apiKey: String(plainKey),
        keyPlain: String(plainKey),
        keyMasked: k.keyMasked,
        isActive: k.isActive,
        createdAt: kCreatedAt instanceof Date ? kCreatedAt : new Date(),
      };
    });
  }

  @Delete(':id/api-keys/:keyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API Key' })
  async revokeKey(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('keyId') keyId: string,
  ): Promise<void> {
    await this.workspacesService.revokeWorkspaceKey(req.user.id, id, keyId);
  }
}
