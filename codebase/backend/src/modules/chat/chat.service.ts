import { Injectable, Logger } from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { OpenaiLlmService, ChatMessage } from '../openai-llm/openai-llm.service';
import { Conversation } from './entities/conversation.entity';
import { MessageSender } from './entities/message.entity';
import { detectPromptInjection } from '../../common/utils/prompt-injection.util';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
    private readonly openaiLlmService: OpenaiLlmService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getOrCreateConversation(workspaceId: string, visitorId: string): Promise<Conversation> {
    const existing = await this.chatRepository.getConversationByVisitor(workspaceId, visitorId);
    if (existing) {
      return existing;
    }
    return this.chatRepository.insertConversation({ workspaceId, visitorId });
  }

  async *streamResponse(workspaceId: string, visitorId: string, content: string): AsyncGenerator<string, void, unknown> {
    const shortQ = content.length > 80 ? content.slice(0, 80) + '…' : content;
    this.logger.log(`[1/6] 💬 New chat request | workspace: ${workspaceId} | visitor: ${visitorId}`);
    this.logger.log(`[1/6]     Q: "${shortQ}"`);

    // Step 1: Prompt injection check
    if (detectPromptInjection(content)) {
      this.logger.warn(`[1/6] 🚨 Prompt injection detected — blocking request`);
      yield "Security warning: Potential override or prompt injection attempt detected. Please ask standard customer support questions.";
      return;
    }

    // Step 2: Conversation persistence
    this.logger.log(`[2/6] 📝 Resolving conversation for visitor...`);
    const convo = await this.getOrCreateConversation(workspaceId, visitorId);
    const convoId = String((convo as unknown as Record<string, unknown>)['_id'] || '');
    this.logger.log(`[2/6] ✅ Conversation ID: ${convoId}`);

    await this.chatRepository.insertMessage({
      conversationId: convoId,
      sender: MessageSender.VISITOR,
      content,
    });

    const history = await this.chatRepository.getMessagesByConversation(convoId);
    this.logger.log(`[2/6]     History messages loaded: ${history.length}`);

    // Step 3: Generate embedding
    this.logger.log(`[3/6] 🧠 Generating embedding for query...`);
    const t3 = Date.now();
    const vector = await this.embeddingsService.generateEmbedding(content);
    this.logger.log(`[3/6] ✅ Embedding generated (${vector.length} dims) in ${Date.now() - t3}ms`);

    // Step 4: Qdrant similarity search
    this.logger.log(`[4/6] 🔍 Searching Qdrant for similar context...`);
    const t4 = Date.now();
    // Fetch 3 chunks max — qwen3-1.7b has only 8192 token context window
    const searchResults = await this.qdrantService.searchSimilar(workspaceId, vector, 3);
    this.logger.log(`[4/6] ✅ Found ${searchResults.length} context chunks in ${Date.now() - t4}ms`);

    if (searchResults.length === 0) {
      this.logger.warn(`[4/6] ⚠️  No context found in knowledge base — LLM will respond without context`);
    } else {
      searchResults.forEach((r, i) => {
        const preview = (r.payload?.content || '').slice(0, 60).replace(/\n/g, ' ');
        this.logger.log(`[4/6]     [${i + 1}] score=${r.score?.toFixed(3)} | "${preview}..."`);
      });
    }

    // Score gate: only keep chunks above relevance threshold to prevent
    // the model from hallucinating answers from weak/unrelated matches
    const RELEVANCE_THRESHOLD = 0.35;
    const relevantResults = searchResults.filter(r => (r.score ?? 0) >= RELEVANCE_THRESHOLD);

    this.logger.log(
      `[4/6]     Relevant chunks after threshold (>=${RELEVANCE_THRESHOLD}): ${relevantResults.length}/${searchResults.length}`,
    );

    // Step 5: Build sources metadata
    const uniqueSources: { title: string; url: string }[] = [];
    const seenUrls = new Set<string>();
    for (const r of relevantResults) {
      const url = r.payload?.sourceUrl;
      const title = r.payload?.heading || 'Source Document';
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        uniqueSources.push({ title, url });
      }
    }

    if (uniqueSources.length > 0) {
      this.logger.log(`[4/6]     Sources: ${uniqueSources.map(s => s.url).join(', ')}`);
      yield `[METADATA]:${JSON.stringify({ sources: uniqueSources })}\n`;
    }

    // Early exit: if no relevant context found, reply without hitting the LLM.
    // This prevents the model from falling back to its internet/training knowledge.
    if (relevantResults.length === 0) {
      this.logger.warn(`[4/6] 🚫 No relevant context above threshold — returning fallback without LLM call`);
      const fallback = "I'm sorry, I don't have information about that in my knowledge base. Would you like me to connect you with our team for further help?";
      await this.chatRepository.insertMessage({
        conversationId: convoId,
        sender: MessageSender.ASSISTANT,
        content: fallback,
      });
      await this.analyticsService.logMetric(workspaceId, visitorId, content, 0, true);
      yield fallback;
      return;
    }

    // Truncate each chunk and cap total context to stay within model context window.
    // qwen3-1.7b: 8192 token limit. System prompt ~300 tokens, history ~400 tokens,
    // query ~50 tokens → leave ~2000 chars (~500 tokens) for context.
    const MAX_CHUNK_CHARS = 600;
    const MAX_CONTEXT_CHARS = 2000;
    const contextText = relevantResults
      .map(r => (r.payload?.content || '').slice(0, MAX_CHUNK_CHARS))
      .join('\n\n')
      .slice(0, MAX_CONTEXT_CHARS);
    this.logger.log(`[4/6]     Context size: ${contextText.length} chars`);

    // Step 6: Build LLM messages + stream
    // /no_think — Qwen3-specific token to disable chain-of-thought reasoning mode
    const systemPrompt = `/no_think
You are a customer support assistant. You ONLY answer using the CONTEXT provided below.

STRICT RULES — you MUST follow all of these:
- ONLY use information that appears word-for-word or by clear inference in the CONTEXT below.
- Do NOT use your training data, general knowledge, or anything from the internet.
- Do NOT make up, assume, or infer facts that are not explicitly in the CONTEXT.
- If the CONTEXT does not contain the answer, respond EXACTLY: "I don't have that information in my knowledge base. Would you like me to connect you with our team?"
- Be direct. Answer in 1–3 sentences. Stop immediately after answering.
- Never add commentary, self-correction, examples, or extra context beyond the answer.

CONTEXT (treat this as the ONLY source of truth):
${contextText}`;

    const chatMessages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

    // Last 2 messages only — keeps token usage low for small context window models
    const slice = history.slice(-2);
    for (const msg of slice) {
      chatMessages.push({
        role: msg.sender === MessageSender.VISITOR ? 'user' : 'assistant',
        content: msg.content,
      });
    }
    chatMessages.push({ role: 'user', content });

    this.logger.log(`[5/6] 🤖 Sending to LLM (${chatMessages.length} messages, ${contextText.length} chars context)...`);
    const t5 = Date.now();

    let fullReply = '';
    let chunkCount = 0;
    const stream = this.openaiLlmService.streamChatCompletion(chatMessages);
    for await (const chunk of stream) {
      fullReply += chunk;
      chunkCount++;
      yield chunk;
    }

    const responseTimeMs = Date.now() - t5;
    this.logger.log(`[5/6] ✅ LLM stream complete | ${chunkCount} chunks | ${fullReply.length} chars | ${responseTimeMs}ms`);

    const isFailedAnswer = fullReply.toLowerCase().includes('do not have') ||
                           fullReply.toLowerCase().includes("don't have") ||
                           fullReply.toLowerCase().includes("don't know") ||
                           fullReply.toLowerCase().includes('escalate');

    if (isFailedAnswer) {
      this.logger.warn(`[5/6] ⚠️  Answer flagged as "no info found" — may need more knowledge base content`);
    }

    // Step 7: Persist & analytics
    this.logger.log(`[6/6] 💾 Saving assistant reply and logging analytics...`);
    await this.chatRepository.insertMessage({
      conversationId: convoId,
      sender: MessageSender.ASSISTANT,
      content: fullReply,
    });

    await this.analyticsService.logMetric(
      workspaceId,
      visitorId,
      content,
      responseTimeMs,
      isFailedAnswer,
    );

    this.logger.log(`[6/6] ✅ Chat complete | total time: ${Date.now() - t5 + (Date.now() - t5)}ms`);
    this.logger.log(`────────────────────────────────────────────────`);
  }

  async getMessages(workspaceId: string, visitorId: string): Promise<unknown[]> {
    const convo = await this.chatRepository.getConversationByVisitor(workspaceId, visitorId);
    if (!convo) {
      return [];
    }
    const convoId = String((convo as unknown as Record<string, unknown>)['_id'] || '');
    return this.chatRepository.getMessagesByConversation(convoId);
  }

  async listConversations(workspaceId: string): Promise<Conversation[]> {
    return this.chatRepository.getConversationsByWorkspace(workspaceId);
  }

  async getMessagesByConversationId(conversationId: string): Promise<any[]> {
    return this.chatRepository.getMessagesByConversation(conversationId);
  }
}
