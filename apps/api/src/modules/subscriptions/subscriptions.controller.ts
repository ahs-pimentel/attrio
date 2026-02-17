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
  SubscriptionResponseDto,
  CheckoutResponseDto,
} from './dto/subscription.dto';
import { RequireTenant, Roles, CurrentUser, Public } from '../auth';
import { UserRole } from '@attrio/contracts';

interface RequestUser {
  userId: string;
  tenantId: string | null;
  role: UserRole;
  email?: string;
}

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

  @Get('subscriptions/current')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Obter assinatura atual do condominio' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async getCurrent(@CurrentUser() user: RequestUser): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.getCurrentSubscription(user.tenantId!);
  }

  @Post('subscriptions/checkout')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Criar sessao de checkout do Stripe' })
  @ApiResponse({ status: 201, type: CheckoutResponseDto })
  async createCheckout(
    @Body() dto: CreateCheckoutDto,
    @CurrentUser() user: RequestUser,
  ): Promise<CheckoutResponseDto> {
    return this.subscriptionsService.createCheckout(
      user.tenantId!,
      dto.plan,
      user.email || '',
      dto.successUrl,
      dto.cancelUrl,
    );
  }

  @Post('subscriptions/portal')
  @ApiBearerAuth()
  @RequireTenant()
  @Roles(UserRole.SAAS_ADMIN)
  @ApiOperation({ summary: 'Criar sessao do Customer Portal do Stripe' })
  @ApiResponse({ status: 201, type: CheckoutResponseDto })
  async createPortal(
    @Body() dto: CreatePortalDto,
    @CurrentUser() user: RequestUser,
  ): Promise<CheckoutResponseDto> {
    return this.subscriptionsService.createPortalSession(user.tenantId!, dto.returnUrl);
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
