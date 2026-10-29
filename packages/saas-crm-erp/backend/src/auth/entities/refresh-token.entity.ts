import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: false })
  token!: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  user_id!: string;

  @Column({ type: 'boolean', default: false })
  is_revoked!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at?: Date;

  @Column({ type: 'timestamp', nullable: false })
  expires_at!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
