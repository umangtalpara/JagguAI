import { Injectable } from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { OpenaiLlmService, ChatMessage } from '../openai-llm/openai-llm.service';
import { Conversation } from './entities/conversation.entity';
import { MessageSender } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
    private readonly openaiLlmService: OpenaiLlmService,
  ) {}

  async getOrCreateConversation(workspaceId: string, visitorId: string): Promise<Conversation> {
    const existing = await this.chatRepository.getConversationByVisitor(workspaceId, visitorId);
    if (existing) {
      return existing;
    }
    return this.chatRepository.insertConversation({ workspaceId, visitorId });
  }

  async *streamResponse(workspaceId: string, visitorId: string, content: string): AsyncGenerator<string, void, unknown> {
    const convo = await this.getOrCreateConversation(workspaceId, visitorId);
    const convoId = String((convo as unknown as Record<string, unknown>)['_id'] || '');

    await this.chatRepository.insertMessage({
      conversationId: convoId,
      sender: MessageSender.VISITOR,
      content,
    });

    const history = await this.chatRepository.getMessagesByConversation(convoId);

    const vector = await this.embeddingsService.generateEmbedding(content);
    const searchResults = await this.qdrantService.searchSimilar(workspaceId, vector, 4);

    const contextText = searchResults.map(r => r.payload.content).join('\n\n');

    const systemPrompt = `You are a helpful and polite AI Customer Support Assistant.
Answer visitor questions using only the context provided below. If the answer cannot be found in the context, politely state that you do not have that information and offer to escalate to a human. Do not make up facts or links.

---
CONTEXT:
${contextText}
---`;

    const chatMessages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

    const slice = history.slice(-6);
    for (const msg of slice) {
      chatMessages.push({
        role: msg.sender === MessageSender.VISITOR ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    chatMessages.push({ role: 'user', content });

    let fullReply = '';
    const stream = this.openaiLlmService.streamChatCompletion(chatMessages);
    for await (const chunk of stream) {
      fullReply += chunk;
      yield chunk;
    }

    await this.chatRepository.insertMessage({
      conversationId: convoId,
      sender: MessageSender.ASSISTANT,
      content: fullReply,
    });
  }

  async getMessages(workspaceId: string, visitorId: string): Promise<unknown[]> {
    const convo = await this.chatRepository.getConversationByVisitor(workspaceId, visitorId);
    if (!convo) {
      return [];
    }
    const convoId = String((convo as unknown as Record<string, unknown>)['_id'] || '');
    return this.chatRepository.getMessagesByConversation(convoId);
  }
}
