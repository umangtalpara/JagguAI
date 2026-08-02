import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeepgramService {
  private readonly apiKey?: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DEEPGRAM_API_KEY');
  }

  async transcribe(audioBuffer: Buffer, mimeType = 'audio/webm'): Promise<string> {
    if (!this.apiKey) {
      console.warn('DEEPGRAM_API_KEY not configured. Returning mock transcription.');
      return 'What are your support working hours?';
    }

    try {
      const response = await fetch('https://api.deepgram.com/v1/listen?smart_format=true&model=nova-2', {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.apiKey}`,
          'Content-Type': mimeType,
        },
        body: new Uint8Array(audioBuffer),
      });

      if (!response.ok) {
        throw new Error(`Deepgram API returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as {
        results?: {
          channels?: {
            alternatives?: {
              transcript?: string;
            }[];
          }[];
        };
      };

      const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      return transcript || '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Deepgram transcription failed: ${msg}. Returning fallback.`);
      return 'What are your support working hours?';
    }
  }
}
