import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TenantEntity } from '../tenants/tenant.entity';
import { UnitEntity } from '../units/unit.entity';
import { StripeService } from '../../core/stripe/stripe.service';
import { SubscriptionPlan, SubscriptionStatus, PlanConfig } from '@attrio/contracts';
import Stripe from 'stripe';

const PLANS: PlanConfig[] = [
  {
    key: SubscriptionPlan.STARTER,
    name: 'Starter',
    maxUnits: 30,
    priceMonthly: 0,
    features: [
      'Ate 30 unidades',
      'Comunicados',
      'Ocorrencias',
      'Reservas',
      'Assembleias (1/mes)',
    ],
  },
  {
    key: SubscriptionPlan.BASIC,
    name: 'Basico',
    maxUnits: 60,
    priceMonthly: 9900,
    features: [
      'Ate 60 unidades',
      'Comunicados ilimitados',
      'Ocorrencias',
      'Reservas',
      'Assembleias (3/mes)',
      'Relatorios completos',
    ],
  },
  {
    key: SubscriptionPlan.PROFESSIONAL,
    name: 'Profissional',
    maxUnits: 150,
    priceMonthly: 19900,
    features: [
      'Ate 150 unidades',
      'Comunicados ilimitados',
      'Ocorrencias',
      'Reservas',
      'Assembleias ilimitadas',
      'Relatorios completos',
      'Suporte prioritario',
    ],
  },
  {
    key: SubscriptionPlan.ENTERPRISE,
    name: 'Enterprise',
    maxUnits: 500,
    priceMonthly: 39900,
    features: [
      'Ate 500 unidades',
      'Comunicados ilimitados',
      'Ocorrencias',
      'Reservas',
      'Assembleias ilimitadas',
      'Relatorios completos',
      'Suporte dedicado',
    ],
  },
];

/** Mapeia plano -> Stripe Price ID (configurado via env vars) */
function getPriceIds(configService: ConfigService): Record<string, string> {
  return {
    [SubscriptionPlan.BASIC]: configService.get<string>('STRIPE_PRICE_BASIC', ''),
    [SubscriptionPlan.PROFESSIONAL]: configService.get<string>('STRIPE_PRICE_PROFESSIONAL', ''),
    [SubscriptionPlan.ENTERPRISE]: configService.get<string>('STRIPE_PRICE_ENTERPRISE', ''),
  };
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly priceIds: Record<string, string>;

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {
    this.priceIds = getPriceIds(configService);
  }

  getPlans(): PlanConfig[] {
    return PLANS;
  }

  getPlanConfig(plan: SubscriptionPlan): PlanConfig {
    const config = PLANS.find((p) => p.key === plan);
    if (!config) throw new BadRequestException(`Plano ${plan} invalido`);
    return config;
  }

  async getAllTenantsSubscriptions() {
    const tenants = await this.tenantRepository.find({ order: { createdAt: 'DESC' } });

    const results = await Promise.all(
      tenants.map(async (tenant) => {
        const currentUnits = await this.unitRepository.count({ where: { tenantId: tenant.id } });
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          plan: tenant.plan,
          status: tenant.subscriptionStatus,
          maxUnits: tenant.maxUnits,
          currentUnits,
          currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() || null,
          stripeCustomerId: tenant.stripeCustomerId || null,
        };
      }),
    );

    return results;
  }

  async createCheckout(
    tenantId: string,
    plan: SubscriptionPlan,
    userEmail: string,
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<{ url: string }> {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Pagamentos nao estao configurados');
    }

    if (plan === SubscriptionPlan.STARTER) {
      throw new BadRequestException('Plano Starter e gratuito');
    }

    const priceId = this.priceIds[plan];
    if (!priceId) {
      throw new BadRequestException(`Price ID nao configurado para o plano ${plan}`);
    }

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Condominio nao encontrado');

    // Criar customer no Stripe se ainda nao existe
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripeService.createCustomer(tenant.name, userEmail, {
        tenantId: tenant.id,
      });
      customerId = customer.id;
      await this.tenantRepository.update(tenant.id, { stripeCustomerId: customerId });
    }

    const webUrl = this.configService.get<string>('WEB_URL', 'http://localhost:3000');
    const session = await this.stripeService.createCheckoutSession({
      customerId,
      priceId,
      successUrl: successUrl || `${webUrl}/dashboard/billing?success=true`,
      cancelUrl: cancelUrl || `${webUrl}/dashboard/billing?canceled=true`,
      metadata: { tenantId: tenant.id, plan },
    });

    return { url: session.url! };
  }

  async createPortalSession(tenantId: string, returnUrl?: string): Promise<{ url: string }> {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Pagamentos nao estao configurados');
    }

    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Condominio nao encontrado');

    if (!tenant.stripeCustomerId) {
      throw new BadRequestException('Condominio nao possui assinatura ativa');
    }

    const webUrl = this.configService.get<string>('WEB_URL', 'http://localhost:3000');
    const session = await this.stripeService.createPortalSession(
      tenant.stripeCustomerId,
      returnUrl || `${webUrl}/dashboard/billing`,
    );

    return { url: session.url };
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Webhook recebido: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        this.logger.log(`Evento nao tratado: ${event.type}`);
    }
  }

  async checkUnitLimit(tenantId: string): Promise<void> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) return;

    const currentUnits = await this.unitRepository.count({ where: { tenantId } });
    if (currentUnits >= tenant.maxUnits) {
      throw new ForbiddenException(
        `Limite de ${tenant.maxUnits} unidades atingido. Faca upgrade do seu plano para adicionar mais unidades.`,
      );
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const tenantId = session.metadata?.tenantId;
    const plan = session.metadata?.plan as SubscriptionPlan;

    if (!tenantId || !plan) {
      this.logger.warn('Checkout sem metadata de tenant/plan');
      return;
    }

    const planConfig = this.getPlanConfig(plan);

    await this.tenantRepository.update(tenantId, {
      plan,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      stripeSubscriptionId: session.subscription as string,
      maxUnits: planConfig.maxUnits,
    });

    this.logger.log(`Tenant ${tenantId} atualizado para plano ${plan}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!tenant) {
      this.logger.warn(`Tenant nao encontrado para subscription ${subscription.id}`);
      return;
    }

    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      trialing: SubscriptionStatus.TRIALING,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.UNPAID,
    };

    // Na API v2026, current_period_end esta nos items
    const periodEnd = subscription.items?.data?.[0]?.current_period_end;
    await this.tenantRepository.update(tenant.id, {
      subscriptionStatus: statusMap[subscription.status] || SubscriptionStatus.ACTIVE,
      ...(periodEnd ? { currentPeriodEnd: new Date(periodEnd * 1000) } : {}),
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!tenant) return;

    // Rebaixa para plano Starter
    await this.tenantRepository.update(tenant.id, {
      plan: SubscriptionPlan.STARTER,
      subscriptionStatus: SubscriptionStatus.CANCELED,
      stripeSubscriptionId: null,
      maxUnits: 30,
      currentPeriodEnd: null,
    });

    this.logger.log(`Tenant ${tenant.id} rebaixado para Starter (assinatura cancelada)`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Na API v2026, subscription esta em parent.subscription_details
    const subscriptionId = (invoice.parent?.subscription_details?.subscription as string) || null;
    if (!subscriptionId) return;

    const tenant = await this.tenantRepository.findOne({
      where: { stripeSubscriptionId: subscriptionId },
    });
    if (!tenant) return;

    await this.tenantRepository.update(tenant.id, {
      subscriptionStatus: SubscriptionStatus.PAST_DUE,
    });

    this.logger.warn(`Pagamento falhou para tenant ${tenant.id}`);
  }
}
