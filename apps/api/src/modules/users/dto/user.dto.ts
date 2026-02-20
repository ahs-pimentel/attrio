import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, IsArray, MaxLength, ValidateIf } from 'class-validator';
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
  @ValidateIf((o, v) => v !== null && v !== undefined)
  @IsUUID()
  @IsOptional()
  tenantId?: string | null;

  @ApiPropertyOptional({ type: [String], description: 'Lista de tenant IDs para associar ao usuario' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tenantIds?: string[];
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

  @ApiPropertyOptional({ type: [Object] })
  tenants: { id: string; name: string; slug: string }[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
