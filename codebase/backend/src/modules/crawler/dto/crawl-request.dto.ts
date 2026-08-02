import { IsNotEmpty, IsUrl, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrawlRequestDto {
  @ApiProperty({ example: 'https://example.com' })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  url!: string;

  @ApiPropertyOptional({ example: 30 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxPages?: number;
}
