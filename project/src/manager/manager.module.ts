import { Module } from '@nestjs/common';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { ManagerInventoryService } from './manager-inventory.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { SalesModule } from '../sales/sales.module';
import { FinancialModule } from '../financial/financial.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ProductsModule,
    SalesModule,
    FinancialModule,
  ],
  controllers: [ManagerController],
  providers: [ManagerService, ManagerInventoryService],
  exports: [ManagerService, ManagerInventoryService],
})
export class ManagerModule {}
