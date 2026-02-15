import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsDateString,
  MaxLength,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResidentStatus, ResidentType, PetType, RelationshipType } from '@attrio/contracts';

// Sub-DTOs para criação
export class CreateEmergencyContactDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '11988888888' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isWhatsApp: boolean;
}

export class CreateHouseholdMemberDto {
  @ApiProperty({ example: 'Pedro Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'pedro@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  document?: string;

  @ApiProperty({ enum: RelationshipType })
  @IsEnum(RelationshipType)
  relationship: RelationshipType;
}

export class CreateUnitEmployeeDto {
  @ApiProperty({ example: 'Ana Souza' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: '987654321' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  document?: string;
}

export class CreateVehicleDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  brand: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model: string;

  @ApiProperty({ example: 'Prata' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  color: string;

  @ApiProperty({ example: 'ABC1234' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  plate: string;
}

export class CreatePetDto {
  @ApiProperty({ example: 'Rex' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: PetType })
  @IsEnum(PetType)
  type: PetType;

  @ApiPropertyOptional({ example: 'Labrador' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  breed?: string;

  @ApiPropertyOptional({ example: 'Caramelo' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  color?: string;
}

// DTO completo para onboarding (formulário do morador)
export class CompleteResidentRegistrationDto {
  @ApiProperty({ description: 'Token do convite' })
  @IsString()
  @IsNotEmpty()
  inviteToken: string;

  @ApiProperty({ enum: ResidentType })
  @IsEnum(ResidentType)
  type: ResidentType;

  @ApiProperty({ example: 'João da Silva Santos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiPropertyOptional({ description: 'Email atualizado (se diferente do convite)' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone atualizado (se diferente do convite)' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  rg?: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @IsString()
  @IsOptional()
  @MaxLength(14)
  cpf?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  moveInDate?: string;

  // Dados do proprietário/imobiliária (quando inquilino)
  @ApiPropertyOptional({ example: 'Imobiliária XYZ' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  landlordName?: string;

  @ApiPropertyOptional({ example: '1133334444' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  landlordPhone?: string;

  @ApiPropertyOptional({ example: 'contato@imobiliaria.com' })
  @IsEmail()
  @IsOptional()
  landlordEmail?: string;

  // Contatos de emergência
  @ApiPropertyOptional({ type: [CreateEmergencyContactDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmergencyContactDto)
  @IsOptional()
  emergencyContacts?: CreateEmergencyContactDto[];

  // Membros do domicílio
  @ApiPropertyOptional({ type: [CreateHouseholdMemberDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHouseholdMemberDto)
  @IsOptional()
  householdMembers?: CreateHouseholdMemberDto[];

  // Funcionários
  @ApiPropertyOptional({ type: [CreateUnitEmployeeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUnitEmployeeDto)
  @IsOptional()
  employees?: CreateUnitEmployeeDto[];

  // Veículos
  @ApiPropertyOptional({ type: [CreateVehicleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVehicleDto)
  @IsOptional()
  vehicles?: CreateVehicleDto[];

  // Pets
  @ApiPropertyOptional({ type: [CreatePetDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePetDto)
  @IsOptional()
  pets?: CreatePetDto[];

  // Autorização LGPD
  @ApiProperty({ description: 'Consentimento para uso de dados' })
  @IsBoolean()
  dataConsent: boolean;

  // Dados para criação de conta
  @ApiProperty({ description: 'Senha para acesso ao portal' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

// DTO para atualização de morador
export class UpdateResidentDto {
  @ApiPropertyOptional({ enum: ResidentType })
  @IsEnum(ResidentType)
  @IsOptional()
  type?: ResidentType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  rg?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(14)
  cpf?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  moveInDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  landlordName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  landlordPhone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  landlordEmail?: string;

  @ApiPropertyOptional({ enum: ResidentStatus })
  @IsEnum(ResidentStatus)
  @IsOptional()
  status?: ResidentStatus;
}

// Response DTOs
export class EmergencyContactResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  isWhatsApp: boolean;
}

export class HouseholdMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  document?: string | null;

  @ApiProperty({ enum: RelationshipType })
  relationship: RelationshipType;
}

export class UnitEmployeeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  document?: string | null;
}

export class VehicleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  plate: string;
}

export class PetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: PetType })
  type: PetType;

  @ApiPropertyOptional({ nullable: true })
  breed?: string | null;

  @ApiPropertyOptional({ nullable: true })
  color?: string | null;
}

export class ResidentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  unitId: string;

  @ApiPropertyOptional({ nullable: true })
  userId?: string | null;

  @ApiProperty({ enum: ResidentType })
  type: ResidentType;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  rg?: string | null;

  @ApiPropertyOptional({ nullable: true })
  cpf?: string | null;

  @ApiPropertyOptional({ nullable: true })
  moveInDate?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  landlordName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  landlordPhone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  landlordEmail?: string | null;

  @ApiProperty()
  dataConsent: boolean;

  @ApiPropertyOptional({ nullable: true })
  dataConsentAt?: Date | null;

  @ApiProperty({ enum: ResidentStatus })
  status: ResidentStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [EmergencyContactResponseDto] })
  emergencyContacts?: EmergencyContactResponseDto[];

  @ApiPropertyOptional({ type: [HouseholdMemberResponseDto] })
  householdMembers?: HouseholdMemberResponseDto[];

  @ApiPropertyOptional({ type: [UnitEmployeeResponseDto] })
  employees?: UnitEmployeeResponseDto[];

  @ApiPropertyOptional({ type: [VehicleResponseDto] })
  vehicles?: VehicleResponseDto[];

  @ApiPropertyOptional({ type: [PetResponseDto] })
  pets?: PetResponseDto[];
}
