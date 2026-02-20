import {
  Controller,
  Get,
  Post,
  Body,
  RawBody,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { StripeService } from '../../core/stripe/stripe.service';
import {
  CreateCheckoutDto,
  CreatePortalDto,
  PlanResponseDto,
  CheckoutResponseDto,
} from './dto/subscription.dto';
import { Roles, Public } from '../auth/decorators';
import { UserRole } from '@attrio/contracts';

@ApiTags('Assinaturas')
@Controller()
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly stripeService: StripeService,
  ) {}

  @Get('subscriptions/plans')
  @Public()
  @ApiOperation({ summary: 'Listar planos disponiveis' })
  @ApiResponse({ status: 200, type: [PlanResponseDto] })
  getPlans(): PlanResponseDto[] {
    return this.subscriptionsService.getPlans();
  }

  @Get('subscriptions/tenants')
  @ApiBearerAuth()
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Listar todos os condominios com dados de assinatura' })
  async getAllTenantsSubscriptions() {
    return this.subscriptionsService.getAllTenantsSubscriptions();
  }

  @Post('subscriptions/checkout')
  @ApiBearerAuth()
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Criar sessao de checkout do Stripe' })
  @ApiResponse({ status: 201, type: CheckoutResponseDto })
  async createCheckout(@Body() dto: CreateCheckoutDto): Promise<CheckoutResponseDto> {
    return this.subscriptionsService.createCheckout(
      dto.tenantId,
      dto.plan,
      '',
      dto.successUrl,
      dto.cancelUrl,
    );
  }

  @Post('subscriptions/portal')
  @ApiBearerAuth()
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Criar sessao do Customer Portal do Stripe' })
  @ApiResponse({ status: 201, type: CheckoutResponseDto })
  async createPortal(@Body() dto: CreatePortalDto): Promise<CheckoutResponseDto> {
    return this.subscriptionsService.createPortalSession(dto.tenantId, dto.returnUrl);
  }

  @Post('webhooks/stripe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook do Stripe' })
  async handleWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Assinatura do webhook ausente');
    }

    try {
      const event = this.stripeService.constructWebhookEvent(rawBody, signature);
      await this.subscriptionsService.handleWebhookEvent(event);
      return { received: true };
    } catch (err) {
      this.logger.error(`Erro ao processar webhook: ${err.message}`);
      throw new BadRequestException(`Webhook invalido: ${err.message}`);
    }
  }
}
