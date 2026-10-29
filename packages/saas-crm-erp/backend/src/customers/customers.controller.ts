import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createCustomerDto: CreateCustomerDto, @Req() req: Request) {
    const organizationId = (req as any).user?.org_id;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context missing from JWT');
    }
    return this.customersService.create(createCustomerDto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers for the current organization' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  findAll(@Req() req: Request) {
    const organizationId = (req as any).user?.org_id;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context missing from JWT');
    }
    return this.customersService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    const organizationId = (req as any).user?.org_id;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context missing from JWT');
    }
    return this.customersService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Req() req: Request,
  ) {
    const organizationId = (req as any).user?.org_id;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context missing from JWT');
    }
    return this.customersService.update(id, updateCustomerDto, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  remove(@Param('id') id: string, @Req() req: Request) {
    const organizationId = (req as any).user?.org_id;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context missing from JWT');
    }
    return this.customersService.remove(id, organizationId);
  }
}
