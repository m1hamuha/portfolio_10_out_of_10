import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal, DealStage } from './deal.entity';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private dealsRepository: Repository<Deal>,
  ) {}

  async create(createDealDto: CreateDealDto): Promise<Deal> {
    const deal = this.dealsRepository.create({
      ...createDealDto,
      stage: createDealDto.stage || DealStage.PROSPECT,
      probability: createDealDto.probability || 0,
    });

    return this.dealsRepository.save(deal);
  }

  async findAll(organizationId?: string): Promise<Deal[]> {
    const where = organizationId ? { organization_id: organizationId } : {};
    return this.dealsRepository.find({
      where,
      relations: ['organization', 'customer', 'assigned_user'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Deal> {
    const deal = await this.dealsRepository.findOne({
      where: { id },
      relations: ['organization', 'customer', 'assigned_user'],
    });
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }
    return deal;
  }

  async update(id: string, updateDealDto: UpdateDealDto): Promise<Deal> {
    await this.dealsRepository.update(id, updateDealDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.dealsRepository.softDelete(id);
  }

  // Business logic methods
  async advanceStage(id: string): Promise<Deal> {
    const deal = await this.findOne(id);
    const stages = Object.values(DealStage);
    const currentIndex = stages.indexOf(deal.stage);

    if (currentIndex < stages.length - 1) {
      deal.stage = stages[currentIndex + 1] as DealStage;
      if (
        deal.stage === DealStage.CLOSED_WON ||
        deal.stage === DealStage.CLOSED_LOST
      ) {
        deal.actual_close_date = new Date();
      }
    }

    return this.dealsRepository.save(deal);
  }

  async closeWon(id: string): Promise<Deal> {
    const deal = await this.findOne(id);
    deal.stage = DealStage.CLOSED_WON;
    deal.actual_close_date = new Date();
    deal.probability = 100;
    return this.dealsRepository.save(deal);
  }

  async closeLost(id: string): Promise<Deal> {
    const deal = await this.findOne(id);
    deal.stage = DealStage.CLOSED_LOST;
    deal.actual_close_date = new Date();
    deal.probability = 0;
    return this.dealsRepository.save(deal);
  }
}
