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

@Entity('color_analyses')
export class ColorAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  imageUrl: string;

  @Column({ type: 'json' })
  detectedColors: {
    hex: string;
    rgb: { r: number; g: number; b: number };
    percentage: number;
    position: { x: number; y: number };
  }[];

  @Column({ type: 'json', nullable: true })
  suggestedPalettes: {
    name: string;
    colors: string[];
    harmony: string;
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
