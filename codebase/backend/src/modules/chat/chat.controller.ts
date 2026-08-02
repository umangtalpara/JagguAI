import { Controller, Post, Sse, Body, Param, Query, MessageEvent, Get } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('chat')
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
}
