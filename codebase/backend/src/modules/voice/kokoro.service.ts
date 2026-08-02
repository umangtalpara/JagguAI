import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KokoroService {
  private readonly baseUrl?: string;
  private readonly voice: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('KOKORO_BASE_URL');
    this.voice = this.configService.get<string>('KOKORO_VOICE') || 'af_bella';
  }

  async textToSpeech(text: string): Promise<Buffer> {
    if (!this.baseUrl) {
      console.warn('KOKORO_BASE_URL not configured. Returning fallback mock audio buffer.');
      return Buffer.from('MOCK_AUDIO_PAYLOAD');
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'kokoro',
          input: text,
          voice: this.voice,
          response_format: 'mp3',
        }),
      });

      if (!response.ok) {
        throw new Error(`Kokoro API returned ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Kokoro TTS failed: ${msg}. Returning fallback mock audio buffer.`);
      return Buffer.from('MOCK_AUDIO_PAYLOAD');
    }
  }
}
