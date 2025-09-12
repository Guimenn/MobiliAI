import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { SaleItem } from './sale-item.entity';

export enum ProductCategory {
  TINTA = 'tinta',
  PINCEL = 'pincel',
  ROLO = 'rolo',
  FITA = 'fita',
  KIT = 'kit',
  OUTROS = 'outros',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.TINTA,
  })
  category: ProductCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: 0 })
  minStock: number;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  colorCode: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  size: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  storeId: string;

  @ManyToOne(() => Store, (store) => store.products)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.product)
  saleItems: SaleItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
