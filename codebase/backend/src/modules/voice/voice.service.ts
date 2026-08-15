import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VoiceRepository } from './voice.repository';
import { DeepgramService } from './deepgram.service';
import { KokoroService } from './kokoro.service';
import { DeepgramTtsService } from './deepgram-tts.service';
import { ChatService } from '../chat/chat.service';
import { VoiceSession } from './entities/voice-session.entity';

@Injectable()
export class VoiceService {
  constructor(
    private readonly voiceRepository: VoiceRepository,
    private readonly deepgramService: DeepgramService,
    private readonly kokoroService: KokoroService,
    private readonly deepgramTtsService: DeepgramTtsService,
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
  ) {}

  async getOrCreateSession(workspaceId: string, visitorId: string): Promise<VoiceSession> {
    const existing = await this.voiceRepository.getSessionByVisitor(workspaceId, visitorId);
    if (existing) {
      return existing;
    }
    return this.voiceRepository.insertSession({ workspaceId, visitorId });
  }

  async processVoice(
    workspaceId: string,
    visitorId: string,
    audioBuffer: Buffer,
    mimeType?: string,
  ): Promise<{ transcribedText: string; responseText: string; audioBuffer: Buffer }> {
    await this.getOrCreateSession(workspaceId, visitorId);

    const transcribedText = await this.deepgramService.transcribe(audioBuffer, mimeType);

    let responseText = '';
    if (transcribedText.trim().length > 0) {
      const stream = this.chatService.streamResponse(workspaceId, visitorId, transcribedText);
      for await (const chunk of stream) {
        if (chunk.startsWith('[METADATA]:')) {
          continue;
        }
        responseText += chunk;
      }
    } else {
      responseText = "I'm sorry, I could not hear anything. Could you please repeat that?";
    }

    // Clean markdown formatting so TTS sounds natural and doesn't vocalize symbols
    const cleanTtsText = responseText
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .trim();

    const hasDeepgram = !!this.configService.get<string>('DEEPGRAM_API_KEY');
    const responseAudio = hasDeepgram
      ? await this.deepgramTtsService.textToSpeech(cleanTtsText || responseText)
      : await this.kokoroService.textToSpeech(cleanTtsText || responseText);

    return {
      transcribedText,
      responseText,
      audioBuffer: responseAudio,
    };
  }
}
