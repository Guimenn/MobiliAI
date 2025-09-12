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
import { User } from './user.entity';
import { Store } from './store.entity';
import { SaleItem } from './sale-item.entity';

export enum SaleStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  saleNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.PENDING,
  })
  status: SaleStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ nullable: true })
  notes: string;

  @Column()
  customerId: string;

  @ManyToOne(() => User, (user) => user.purchases)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  employeeId: string;

  @ManyToOne(() => User, (user) => user.sales)
  @JoinColumn({ name: 'employeeId' })
  employee: User;

  @Column()
  storeId: string;

  @ManyToOne(() => Store, (store) => store.sales)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.sale, { cascade: true })
  items: SaleItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
