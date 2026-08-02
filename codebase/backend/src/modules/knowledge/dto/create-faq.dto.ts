import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFaqDto {
  @ApiProperty({ example: 'What is your refund policy?' })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiProperty({ example: 'We offer a 14-day money-back guarantee.' })
  @IsString()
  @IsNotEmpty()
  answer!: string;
}
