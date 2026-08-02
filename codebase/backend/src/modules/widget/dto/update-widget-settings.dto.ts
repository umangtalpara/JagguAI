import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWidgetSettingsDto {
  @ApiPropertyOptional({ example: '#2563eb' })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Hello! How can I help you today?' })
  @IsString()
  @IsOptional()
  greeting?: string;

  @ApiPropertyOptional({ example: 'light' })
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiPropertyOptional({ example: 'bottom-right' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  voiceEnabled?: boolean;

  @ApiPropertyOptional({ example: ['What is your pricing?', 'How to sign up?'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  suggestedQuestions?: string[];
}
