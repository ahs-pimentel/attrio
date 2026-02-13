import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class ValidateOtpDto {
  @ApiProperty({ description: 'Codigo OTP de 6 digitos', example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}

export class OtpResponseDto {
  @ApiProperty({ description: 'Codigo OTP' })
  otp: string;

  @ApiProperty({ description: 'Data/hora de geracao' })
  generatedAt: Date;

  @ApiProperty({ description: 'Data/hora de expiracao' })
  expiresAt: Date;

  @ApiProperty({ description: 'Segundos restantes ate expirar' })
  remainingSeconds: number;
}

export class OtpValidationResultDto {
  @ApiProperty({ description: 'Se o OTP e valido' })
  valid: boolean;

  @ApiPropertyOptional({ description: 'ID da assembleia (se valido)' })
  assemblyId?: string;
}
