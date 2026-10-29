import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('deals')
@ApiBearerAuth('JWT-auth')
@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  @ApiResponse({ status: 201, description: 'Deal created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createDealDto: CreateDealDto) {
    return this.dealsService.create(createDealDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all deals' })
  @ApiResponse({ status: 200, description: 'Deals retrieved successfully' })
  findAll(@Query('organization_id') organizationId?: string) {
    return this.dealsService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID' })
  @ApiResponse({ status: 200, description: 'Deal retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update deal' })
  @ApiResponse({ status: 200, description: 'Deal updated successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  update(@Param('id') id: string, @Body() updateDealDto: UpdateDealDto) {
    return this.dealsService.update(id, updateDealDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete deal' })
  @ApiResponse({ status: 200, description: 'Deal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  remove(@Param('id') id: string) {
    return this.dealsService.remove(id);
  }

  @Post(':id/advance')
  @ApiOperation({ summary: 'Advance deal to next stage' })
  @ApiResponse({ status: 200, description: 'Deal stage advanced' })
  advanceStage(@Param('id') id: string) {
    return this.dealsService.advanceStage(id);
  }

  @Post(':id/close-won')
  @ApiOperation({ summary: 'Mark deal as closed won' })
  @ApiResponse({ status: 200, description: 'Deal closed as won' })
  closeWon(@Param('id') id: string) {
    return this.dealsService.closeWon(id);
  }

  @Post(':id/close-lost')
  @ApiOperation({ summary: 'Mark deal as closed lost' })
  @ApiResponse({ status: 200, description: 'Deal closed as lost' })
  closeLost(@Param('id') id: string) {
    return this.dealsService.closeLost(id);
  }
}
