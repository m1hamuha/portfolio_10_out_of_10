import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private stripeService: StripeService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // Create Stripe payment intent
    const paymentIntent = await this.stripeService.createPaymentIntent(
      createPaymentDto.amount,
      'usd', // Default currency, can be made configurable
      {
        invoice_id: createPaymentDto.invoice_id,
        organization_id: createPaymentDto.organization_id,
      },
    );

    const payment = this.paymentsRepository.create({
      ...createPaymentDto,
      transaction_id: paymentIntent.id,
      status: PaymentStatus.PENDING,
      metadata: {
        ...createPaymentDto.metadata,
        stripe_payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
      },
    });

    return this.paymentsRepository.save(payment);
  }

  async findAll(organizationId?: string): Promise<Payment[]> {
    const where = organizationId ? { organization_id: organizationId } : {};
    return this.paymentsRepository.find({
      where,
      relations: ['organization', 'invoice'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: ['organization', 'invoice'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    await this.paymentsRepository.update(id, updatePaymentDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.paymentsRepository.softDelete(id);
  }

  async markAsCompleted(id: string): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.status = PaymentStatus.COMPLETED;
    payment.processed_at = new Date();
    return this.paymentsRepository.save(payment);
  }

  async markAsFailed(id: string, reason?: string): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.status = PaymentStatus.FAILED;
    if (reason) {
      payment.notes =
        (payment.notes ? payment.notes + '; ' : '') + `Failed: ${reason}`;
    }
    return this.paymentsRepository.save(payment);
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return this.paymentsRepository.findOne({
      where: { transaction_id: transactionId },
    });
  }

  // Business logic: check if payment amount matches invoice balance
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validatePaymentAmount(_invoiceId: string, _amount: number): boolean {
    // This would need to calculate remaining balance on invoice
    // For now, return true - implement when invoice service is available
    return true;
  }
}
