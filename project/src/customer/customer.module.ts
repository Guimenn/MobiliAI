import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerPublicController } from './customer-public.controller';
import { CustomerService } from './customer.service';
import { CustomerProductsService } from './customer-products.service';
import { CustomerCartService } from './customer-cart.service';
import { CustomerFavoritesService } from './customer-favorites.service';
import { CustomerOrdersService } from './customer-orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    PrismaModule,
    ProductsModule,
    SalesModule,
  ],
  controllers: [CustomerController, CustomerPublicController],
  providers: [
    CustomerService,
    CustomerProductsService,
    CustomerCartService,
    CustomerFavoritesService,
    CustomerOrdersService,
  ],
  exports: [
    CustomerService,
    CustomerProductsService,
    CustomerCartService,
    CustomerFavoritesService,
    CustomerOrdersService,
  ],
})
export class CustomerModule {}
