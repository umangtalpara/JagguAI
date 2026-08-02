import { Injectable } from '@nestjs/common';
import { VoiceRepository } from './voice.repository';
import { DeepgramService } from './deepgram.service';
import { KokoroService } from './kokoro.service';
import { ChatService } from '../chat/chat.service';
import { VoiceSession } from './entities/voice-session.entity';

@Injectable()
export class VoiceService {
  constructor(
    private readonly voiceRepository: VoiceRepository,
    private readonly deepgramService: DeepgramService,
    private readonly kokoroService: KokoroService,
    private readonly chatService: ChatService,
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
        responseText += chunk;
      }
    } else {
      responseText = "I'm sorry, I could not hear anything. Could you please repeat that?";
    }

    const responseAudio = await this.kokoroService.textToSpeech(responseText);

    return {
      transcribedText,
      responseText,
      audioBuffer: responseAudio,
    };
  }
}
