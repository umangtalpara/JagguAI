import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'visitor_session_uuid_1234' })
  @IsString()
  @IsNotEmpty()
  visitorId!: string;

  @ApiProperty({ example: 'What are your working hours?' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
