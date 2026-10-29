import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { Customer } from '../customers/customer.entity';
import { User } from '../users/user.entity';

export enum DealStage {
  PROSPECT = 'prospect',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

@Entity('deals')
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'uuid' })
  organization_id!: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ type: 'uuid' })
  customer_id!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assigned_user: User | null = null;

  @Column({ type: 'uuid', nullable: true })
  assigned_to: string | null = null;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value!: number;

  @Column({
    type: 'enum',
    enum: DealStage,
    default: DealStage.PROSPECT,
  })
  stage!: DealStage;

  @Column({ type: 'int', default: 0 })
  probability!: number;

  @Column({ type: 'date' })
  expected_close_date!: Date;

  @Column({ type: 'date', nullable: true })
  actual_close_date: Date | null = null;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null = null;
}
