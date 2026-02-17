import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
      this.logger.log('Stripe SDK inicializado');
    } else {
      this.logger.warn('STRIPE_SECRET_KEY nao configurada - funcionalidades de pagamento desabilitadas');
    }
  }

  get isConfigured(): boolean {
    return this.stripe !== null;
  }

  private getClient(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe nao configurado. Defina STRIPE_SECRET_KEY.');
    }
    return this.stripe;
  }

  async createCustomer(name: string, email: string, metadata?: Record<string, string>): Promise<Stripe.Customer> {
    return this.getClient().customers.create({
      name,
      email,
      metadata,
    });
  }

  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    return this.getClient().checkout.sessions.create({
      customer: params.customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      subscription_data: {
        metadata: params.metadata,
      },
    });
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    return this.getClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  constructWebhookEvent(body: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET nao configurado');
    }
    return this.getClient().webhooks.constructEvent(body, signature, webhookSecret);
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.getClient().subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.getClient().subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
}
