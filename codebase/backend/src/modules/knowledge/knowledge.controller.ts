import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateFaqDto } from './dto/create-faq.dto';
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
}
