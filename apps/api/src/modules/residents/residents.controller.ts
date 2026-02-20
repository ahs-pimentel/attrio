import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ResidentsService } from './residents.service';
import {
  UpdateResidentDto,
  ResidentResponseDto,
  CreateEmergencyContactDto,
  CreateHouseholdMemberDto,
  CreateUnitEmployeeDto,
  CreateVehicleDto,
  CreatePetDto,
} from './dto';
import { CurrentUser, Roles, RequireTenant } from '../auth/decorators';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  tenantId: string;
  role: UserRole;
}

@ApiTags('Residents')
@ApiBearerAuth()
@Controller('residents')
@RequireTenant()
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Get()
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.DOORMAN)
  @ApiOperation({ summary: 'Listar todos os moradores do condominio' })
  @ApiOkResponse({ type: [ResidentResponseDto] })
  async findAll(@CurrentUser() user: RequestUser): Promise<ResidentResponseDto[]> {
    return this.residentsService.findAllByTenant(user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.DOORMAN, UserRole.RESIDENT)
  @ApiOperation({ summary: 'Buscar morador por ID' })
  @ApiOkResponse({ type: ResidentResponseDto })
  @ApiNotFoundResponse({ description: 'Morador nao encontrado' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ResidentResponseDto> {
    return this.residentsService.findById(id, user.tenantId);
  }

  @Get('unit/:unitId')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.DOORMAN)
  @ApiOperation({ summary: 'Listar moradores de uma unidade' })
  @ApiOkResponse({ type: [ResidentResponseDto] })
  async findByUnit(
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ResidentResponseDto[]> {
    return this.residentsService.findByUnit(unitId, user.tenantId);
  }

  @Put(':id')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.RESIDENT)
  @ApiOperation({ summary: 'Atualizar morador' })
  @ApiOkResponse({ type: ResidentResponseDto })
  @ApiNotFoundResponse({ description: 'Morador nao encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResidentDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ResidentResponseDto> {
    return this.residentsService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover morador' })
  @ApiNoContentResponse({ description: 'Morador removido' })
  @ApiNotFoundResponse({ description: 'Morador nao encontrado' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    return this.residentsService.delete(id, user.tenantId);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @ApiOperation({ summary: 'Desativar morador' })
  @ApiOkResponse({ type: ResidentResponseDto })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ResidentResponseDto> {
    return this.residentsService.deactivate(id, user.tenantId);
  }

  @Post(':id/activate')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @ApiOperation({ summary: 'Ativar morador' })
  @ApiOkResponse({ type: ResidentResponseDto })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ResidentResponseDto> {
    return this.residentsService.activate(id, user.tenantId);
  }

  // Sub-entidades - Contatos de emergência
  @Post(':id/contacts')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.RESIDENT)
  @ApiOperation({ summary: 'Adicionar contato de emergencia' })
  async addContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEmergencyContactDto,
    @CurrentUser() user: RequestUser,
  ) {
    await this.residentsService.findById(id, user.tenantId);
    return this.residentsService.addEmergencyContact(id, dto);
  }

  @Delete(':id/contacts/:contactId')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.RESIDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover contato de emergencia' })
  async removeContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.residentsService.findById(id, user.tenantId);
    return this.residentsService.removeEmergencyContact(contactId);
  }

  // Sub-entidades - Membros do domicílio
  @Post(':id/members')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.RESIDENT)
  @ApiOperation({ summary: 'Adicionar membro do domicilio' })
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateHouseholdMemberDto,
    @CurrentUser() user: RequestUser,
  ) {
    await this.residentsService.findById(id, user.tenantId);
    return this.residentsService.addHouseholdMember(id, dto);
  }

  @Delete(':id/members/:memberId')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.RESIDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover membro do domicilio' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.residentsService.findById(id, user.tenantId);
    return this.residentsService.removeHouseholdMember(memberId);
  }

  // Sub-entidades - Funcionários
  @Post(':id/employees')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.RESIDENT)
  @ApiOperation({ summary: 'Adicionar funcionario da unidade' })
  async addEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateUnitEmployeeDto,
    @CurrentUser() user: RequestUser,
  ) {
    await this.residentsService.findById(id, user.tenantId);
    return this.residentsService.addEmployee(id, dto);
  }

  @Delete(':id/employees/:employeeId')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.RESIDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover funcionario da unidade' })
  async removeEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.residentsService.findById(id, user.tenantId);
    return this.residentsService.removeEmployee(employeeId);
  }

  // Sub-entidades - Veículos
  @Post(':id/vehicles')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.RESIDENT)
  @ApiOperation({ summary: 'Adicionar veiculo' })
  async addVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateVehicleDto,
    @CurrentUser() user: RequestUser,
  ) {
    await this.residentsService.findById(id, user.tenantId);
    return this.residentsService.addVehicle(id, dto);
  }

  @Delete(':id/vehicles/:vehicleId')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.RESIDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover veiculo' })
  async removeVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.residentsService.findById(id, user.tenantId);
    return this.residentsService.removeVehicle(vehicleId);
  }

  // Sub-entidades - Pets
  @Post(':id/pets')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.RESIDENT)
  @ApiOperation({ summary: 'Adicionar pet' })
  async addPet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePetDto,
    @CurrentUser() user: RequestUser,
  ) {
    await this.residentsService.findById(id, user.tenantId);
    return this.residentsService.addPet(id, dto);
  }

  @Delete(':id/pets/:petId')
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC, UserRole.RESIDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover pet' })
  async removePet(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('petId', ParseUUIDPipe) petId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.residentsService.findById(id, user.tenantId);
    return this.residentsService.removePet(petId);
  }
}
