import { Controller, Post, Sse, Body, Param, Query, MessageEvent, Get } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { UseGuards } from '@nestjs/common';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('chat')
@UseGuards(RateLimitGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
