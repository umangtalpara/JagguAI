import { ApiProperty } from '@nestjs/swagger';
import { BrandingSettings } from '../entities/workspace.entity';

export class WorkspaceResponseDto {
  @ApiProperty({ example: '60c72b2f9b1d8b23c4d5e6f7' })
  id!: string;

  @ApiProperty({ example: 'My Workspace' })
  name!: string;

  @ApiProperty({ example: '60c72b2f9b1d8b23c4d5e6f8' })
  ownerId!: string;

  @ApiProperty({ example: 'Company details...' })
  companyInfo!: string;

  @ApiProperty()
  branding!: BrandingSettings;

  @ApiProperty()
  createdAt!: Date;
}
