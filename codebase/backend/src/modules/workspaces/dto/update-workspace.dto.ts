import { IsString, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BrandingSettingsDto } from './create-workspace.dto';

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ example: 'Updated Workspace Name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated company FAQ context...' })
  @IsString()
  @IsOptional()
  companyInfo?: string;

  @ApiPropertyOptional({ type: BrandingSettingsDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BrandingSettingsDto)
  branding?: BrandingSettingsDto;
}
