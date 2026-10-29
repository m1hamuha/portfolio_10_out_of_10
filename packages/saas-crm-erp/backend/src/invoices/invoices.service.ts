import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const {
      items,
      discount_amount = 0,
      tax_amount = 0,
      ...invoiceData
    } = createInvoiceDto;

    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    // Calculate total
    const total_amount = subtotal + tax_amount - discount_amount;

    // Generate invoice number (you might want to make this more sophisticated)
    const invoice_number = `INV-${Date.now()}`;

    const invoice = this.invoicesRepository.create({
      ...invoiceData,
      invoice_number,
      items,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      issued_date: new Date(),
      status: InvoiceStatus.DRAFT,
    });

    return this.invoicesRepository.save(invoice);
  }

  async findAll(organizationId?: string): Promise<Invoice[]> {
    const where = organizationId ? { organization_id: organizationId } : {};
    return this.invoicesRepository.find({
      where,
      relations: ['organization', 'customer', 'payments'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id },
      relations: ['organization', 'customer', 'payments'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async update(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id);

    const { items, discount_amount, tax_amount, ...updateData } =
      updateInvoiceDto;

    // Recalculate totals if items or amounts changed
    let subtotal = invoice.subtotal;
    let total_amount = invoice.total_amount;

    if (items) {
      subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = tax_amount ?? invoice.tax_amount;
      const discount = discount_amount ?? invoice.discount_amount;
      total_amount = subtotal + tax - discount;
    } else if (discount_amount !== undefined || tax_amount !== undefined) {
      const tax = tax_amount ?? invoice.tax_amount;
      const discount = discount_amount ?? invoice.discount_amount;
      total_amount = invoice.subtotal + tax - discount;
    }

    await this.invoicesRepository.update(id, {
      ...updateData,
      ...(items && { items, subtotal }),
      ...(discount_amount !== undefined && { discount_amount }),
      ...(tax_amount !== undefined && { tax_amount }),
      ...(total_amount !== invoice.total_amount && { total_amount }),
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.invoicesRepository.softDelete(id);
  }

  // Additional business logic methods
  async markAsSent(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = InvoiceStatus.SENT;
    return this.invoicesRepository.save(invoice);
  }

  async markAsPaid(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.status = InvoiceStatus.PAID;
    return this.invoicesRepository.save(invoice);
  }
}
