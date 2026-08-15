import { Controller, Post, Param, Body, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { VoiceService } from './voice.service';

@ApiTags('voice')
@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('workspaces/:workspaceId/process')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Process recorded voice input and return audio stream response' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        visitorId: {
          type: 'string',
        },
      },
    },
  })
  async processVoice(
    @Param('workspaceId') workspaceId: string,
    @Body('visitorId') visitorId: string,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ): Promise<void> {
    const { transcribedText, responseText, audioBuffer } = await this.voiceService.processVoice(
      workspaceId,
      visitorId,
      file.buffer,
      file.mimetype,
    );

    res.setHeader('Access-Control-Expose-Headers', 'X-Transcribed-Text, X-Response-Text');
    res.setHeader('X-Transcribed-Text', encodeURIComponent(transcribedText));
    res.setHeader('X-Response-Text', encodeURIComponent(responseText));
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  }
}
