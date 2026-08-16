import { Controller, Post, Sse, Body, Param, Query, MessageEvent, Get, Res } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { UseGuards } from '@nestjs/common';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('chat')
@UseGuards(RateLimitGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  @Post('stream')
  @ApiOperation({ summary: 'Public API Key Chat Stream via POST' })
  async postStream(
    @Body() dto: { apiKey: string; visitorId?: string; message: string },
    @Res() res: Response,
  ): Promise<void> {
    if (!dto.apiKey || !dto.message) {
      res.status(400).json({ statusCode: 400, message: 'apiKey and message are required' });
      return;
    }

    const workspace = await this.workspacesService.validateKey(dto.apiKey);
    if (!workspace) {
      res.status(404).json({ statusCode: 404, message: 'Invalid API Key' });
      return;
    }

    const workspaceId = String((workspace as any)._id || (workspace as any).id);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const generator = this.chatService.streamResponse(workspaceId, dto.visitorId || 'vis_anon', dto.message);
      for await (const chunk of generator) {
        if (chunk.startsWith('[METADATA]:')) {
          try {
            const meta = JSON.parse(chunk.substring(11).trim());
            res.write(`data: ${JSON.stringify({ sources: meta.sources || [] })}\n\n`);
          } catch (e) {}
        } else {
          res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
        }
      }
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message || 'Stream error' })}\n\n`);
      res.end();
    }
  }

  @Post('workspaces/:workspaceId/history')
  @ApiOperation({ summary: 'Get conversation history for visitor' })
  async getHistory(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: { visitorId: string },
  ): Promise<unknown[]> {
    return this.chatService.getMessages(workspaceId, dto.visitorId);
  }

  @Sse('workspaces/:workspaceId/stream')
  @ApiOperation({ summary: 'Stream assistant responses using SSE' })
  stream(
    @Param('workspaceId') workspaceId: string,
    @Query('visitorId') visitorId: string,
    @Query('content') content: string,
  ): Observable<MessageEvent> {
    const generator = this.chatService.streamResponse(workspaceId, visitorId, content);

    return new Observable<MessageEvent>(subscriber => {
      let isDone = false;
      (async () => {
        try {
          for await (const chunk of generator) {
            if (isDone) {
              break;
            }
            subscriber.next({ data: chunk } as MessageEvent);
          }
          subscriber.complete();
        } catch (err: unknown) {
          subscriber.error(err);
        }
      })();

      return () => {
        isDone = true;
      };
    });
  }

  @Get('workspaces/:workspaceId/conversations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all chat conversations in workspace' })
  async listConvos(
    @Param('workspaceId') workspaceId: string,
  ): Promise<any[]> {
    return this.chatService.listConversations(workspaceId);
  }

  @Get('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all messages of a conversation' })
  async getConvoMessages(
    @Param('conversationId') conversationId: string,
  ): Promise<any[]> {
    return this.chatService.getMessagesByConversationId(conversationId);
  }
}
