import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CaptureLeadDto {
  @ApiProperty({ example: 'visitor_session_uuid_1234' })
  @IsString()
  @IsNotEmpty()
  visitorId!: string;

  @ApiProperty({ example: 'lead@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;
}
