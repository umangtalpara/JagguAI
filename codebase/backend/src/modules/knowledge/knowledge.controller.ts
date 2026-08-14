import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KnowledgeFile } from './entities/knowledge-file.entity';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('knowledge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document (PDF, DOCX, TXT, MD)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async upload(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<KnowledgeFile> {
    return this.knowledgeService.uploadDocument(req.user.id, workspaceId, file);
  }

  @Post('faq')
  @ApiOperation({ summary: 'Add a manual FAQ pair' })
  async addFaq(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateFaqDto,
  ): Promise<KnowledgeFile> {
    return this.knowledgeService.addManualFaq(req.user.id, workspaceId, dto.question, dto.answer);
  }

  @Get()
  @ApiOperation({ summary: 'List all documents / FAQs in workspace' })
  async findAll(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
  ): Promise<unknown[]> {
    const list = await this.knowledgeService.listDocuments(req.user.id, workspaceId);
    return list.map(f => {
      const fId = (f as unknown as Record<string, unknown>)['_id'];
      const fCreatedAt = (f as unknown as Record<string, unknown>)['createdAt'];
      return {
        id: String(fId || ''),
        workspaceId: f.workspaceId,
        name: f.name,
        type: f.type,
        status: f.status,
        url: f.url,
        charCount: f.charCount,
        chunkCount: f.chunkCount,
        error: f.error,
        createdAt: fCreatedAt instanceof Date ? fCreatedAt : new Date(),
      };
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document or FAQ' })
  async remove(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.knowledgeService.deleteDocument(req.user.id, workspaceId, id);
  }

  @Post(':id/reindex')
  @ApiOperation({ summary: 'Purge vectors and re-queue document processing' })
  async reindex(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.knowledgeService.reindexDocument(req.user.id, workspaceId, id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Perform vector similarity search on knowledge base' })
  async search(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
    @Request() reqObj: any,
  ): Promise<any[]> {
    const query = reqObj.query.q as string;
    const limit = reqObj.query.limit ? parseInt(reqObj.query.limit as string) : 5;
    return this.knowledgeService.searchSimilarity(req.user.id, workspaceId, query, limit);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a knowledge source (FAQ or document details)' })
  async update(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeDto,
  ): Promise<KnowledgeFile> {
    return this.knowledgeService.updateDocument(req.user.id, workspaceId, id, dto);
  }

  @Post('migrate')
  @ApiOperation({ summary: 'Migrate original MongoDB chunks to the active embeddings provider collection' })
  async migrate(
    @Request() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
  ): Promise<{ success: boolean; migratedCount: number; activeCollection: string }> {
    return this.knowledgeService.migrateWorkspace(req.user.id, workspaceId);
  }
}
