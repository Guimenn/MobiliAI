import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('furniture_analyses')
export class FurnitureAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  imageUrl: string;

  @Column({ type: 'json' })
  detectedSpaces: {
    type: string;
    area: number;
    position: { x: number; y: number; width: number; height: number };
    confidence: number;
    suggestedFurniture: string[];
  }[];

  @Column({ type: 'json', nullable: true })
  suggestedFurniture: {
    name: string;
    category: string;
    confidence: number;
    reason: string;
  }[];

  @Column({ type: 'json', nullable: true })
  recommendedProducts: {
    productId: string;
    confidence: number;
    reason: string;
  }[];

  @Column({ nullable: true })
  processedImageUrl: string;

  @Column({ default: false })
  isProcessed: boolean;

  @Column()
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
