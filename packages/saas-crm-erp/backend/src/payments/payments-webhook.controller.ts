import {
  Controller,
  Post,
  Headers,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';

@ApiTags('payments-webhooks')
@Controller('payments/webhook')
export class PaymentsWebhookController {
  constructor(
    private paymentsService: PaymentsService,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Stripe webhook endpoint for payment events' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const endpointSecret = this.configService.get<string>(
      'stripe.webhookSecret',
      '',
    );

    try {
      const rawBody = (req as any).rawBody || req.body;
      const event = this.stripeService.constructEvent(
        rawBody,
        signature,
        endpointSecret,
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      throw new BadRequestException('Webhook signature verification failed');
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    const payment = await this.paymentsService.findByTransactionId(
      paymentIntent.id,
    );
    if (payment) {
      await this.paymentsService.markAsCompleted(payment.id);
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.paymentsService.findByTransactionId(
      paymentIntent.id,
    );
    if (payment) {
      const failureReason =
        paymentIntent.last_payment_error?.message || 'Payment failed';
      await this.paymentsService.markAsFailed(payment.id, failureReason);
    }
  }
}
