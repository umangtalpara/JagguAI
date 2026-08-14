import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'The email address of the user who forgot their password' })
  @IsEmail()
  email!: string;
}
