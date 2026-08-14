import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeepgramTtsService {
  private readonly apiKey?: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DEEPGRAM_API_KEY');
  }

  async textToSpeech(text: string): Promise<Buffer> {
    if (!this.apiKey) {
      console.warn('DEEPGRAM_API_KEY not configured. Returning fallback mock audio buffer.');
      return Buffer.from('MOCK_AUDIO_PAYLOAD');
    }

    try {
      const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en', {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Deepgram Speak API returned ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Deepgram TTS failed: ${msg}. Returning fallback mock audio buffer.`);
      return Buffer.from('MOCK_AUDIO_PAYLOAD');
    }
  }
}
