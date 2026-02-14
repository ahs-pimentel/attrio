import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { UserRole } from '@attrio/contracts';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Nome do usuario' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Email do usuario' })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsUUID()
  @IsOptional()
  tenantId?: string | null;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  supabaseUserId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ type: String, nullable: true })
  tenantId: string | null;

  @ApiProperty({ type: 'object', nullable: true })
  tenant: { id: string; name: string; slug: string } | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
