import {
  Controller,
  Get,
  Post,
  Delete,
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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { InvitesService } from './invites.service';
import {
  CreateInviteDto,
  InviteResponseDto,
  ValidateInviteResponseDto,
  CompleteResidentRegistrationDto,
  ResidentResponseDto,
} from './dto';
import { CurrentUser, Roles, RequireTenant, Public } from '../auth';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  tenantId: string;
  role: UserRole;
}

@ApiTags('Invites')
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  // Rotas autenticadas (síndico)
  @Post()
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @ApiOperation({ summary: 'Criar convite para morador' })
  @ApiCreatedResponse({ type: InviteResponseDto })
  async create(
    @Body() dto: CreateInviteDto,
    @CurrentUser() user: RequestUser,
  ): Promise<InviteResponseDto> {
    return this.invitesService.createInvite(user.tenantId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @ApiOperation({ summary: 'Listar todos os convites do condominio' })
  @ApiOkResponse({ type: [InviteResponseDto] })
  async findAll(@CurrentUser() user: RequestUser): Promise<InviteResponseDto[]> {
    return this.invitesService.findAllByTenant(user.tenantId);
  }

  @Post(':id/resend')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @ApiOperation({ summary: 'Reenviar convite' })
  @ApiOkResponse({ type: InviteResponseDto })
  async resend(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<InviteResponseDto> {
    return this.invitesService.resendInvite(id, user.tenantId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SAAS_ADMIN, UserRole.SYNDIC)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar convite' })
  @ApiNoContentResponse({ description: 'Convite cancelado' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    return this.invitesService.cancelInvite(id, user.tenantId);
  }

  // Rotas públicas (para o morador acessar)
  @Get('validate/:token')
  @Public()
  @ApiOperation({ summary: 'Validar token de convite' })
  @ApiOkResponse({ type: ValidateInviteResponseDto })
  async validate(@Param('token') token: string): Promise<ValidateInviteResponseDto> {
    const result = await this.invitesService.validateInvite(token);

    if (!result.valid || !result.invite) {
      return { valid: false, error: result.error };
    }

    return {
      valid: true,
      invite: {
        name: result.invite.name,
        email: result.invite.email,
        phone: result.invite.phone,
        unitIdentifier: result.invite.unit?.identifier || '',
        tenantName: result.invite.tenant?.name || '',
      },
    };
  }

  @Post('complete')
  @Public()
  @ApiOperation({ summary: 'Completar cadastro de morador' })
  @ApiCreatedResponse({ type: ResidentResponseDto })
  @ApiBadRequestResponse({ description: 'Convite invalido ou dados incorretos' })
  async complete(@Body() dto: CompleteResidentRegistrationDto): Promise<ResidentResponseDto> {
    return this.invitesService.completeRegistration(dto);
  }
}
