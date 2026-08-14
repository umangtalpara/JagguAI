import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'The password reset token' })
  @IsString()
  token!: string;

  @ApiProperty({ description: 'The new password' })
  @IsString()
  @MinLength(6)
  password!: string;
}
