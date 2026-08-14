import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VoiceService } from './voice.service';
import { VoiceController } from './voice.controller';
import { VoiceRepository } from './voice.repository';
import { VoiceSession, VoiceSessionSchema } from './entities/voice-session.entity';
import { ChatModule } from '../chat/chat.module';
import { DeepgramService } from './deepgram.service';
import { KokoroService } from './kokoro.service';
import { DeepgramTtsService } from './deepgram-tts.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: VoiceSession.name, schema: VoiceSessionSchema }]),
    ChatModule,
  ],
  controllers: [VoiceController],
  providers: [VoiceService, VoiceRepository, DeepgramService, KokoroService, DeepgramTtsService],
  exports: [VoiceService],
})
export class VoiceModule {}
