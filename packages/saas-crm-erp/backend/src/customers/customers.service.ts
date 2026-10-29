import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async findAll(organizationId: string): Promise<Customer[]> {
    return this.customersRepository.find({
      where: { organization_id: organizationId },
      relations: ['assigned_user'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({
      where: { id, organization_id: organizationId },
      relations: ['organization', 'assigned_user'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async create(
    createCustomerDto: CreateCustomerDto,
    organizationId: string,
  ): Promise<Customer> {
    const customer = this.customersRepository.create({
      ...createCustomerDto,
      organization_id: organizationId,
    });

    this.logger.log(
      `Customer created in organization ${organizationId}: ${customer.id}`,
    );

    return this.customersRepository.save(customer);
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    organizationId: string,
  ): Promise<Customer> {
    const customer = await this.findOne(id, organizationId);

    if (customer.organization_id !== organizationId) {
      throw new ForbiddenException(
        'You do not have permission to update this customer',
      );
    }

    Object.assign(customer, updateCustomerDto);

    this.logger.log(`Customer ${id} updated in organization ${organizationId}`);

    return this.customersRepository.save(customer);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const customer = await this.findOne(id, organizationId);

    if (customer.organization_id !== organizationId) {
      throw new ForbiddenException(
        'You do not have permission to delete this customer',
      );
    }

    const result = await this.customersRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    this.logger.log(
      `Customer ${id} deleted from organization ${organizationId}`,
    );
  }
}
