import { Module, forwardRef } from '@nestjs/common';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { ManagerInventoryService } from './manager-inventory.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { SalesModule } from '../sales/sales.module';
import { FinancialModule } from '../financial/financial.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ProductsModule,
    SalesModule,
    FinancialModule,
    forwardRef(() => AdminModule),
  ],
  controllers: [ManagerController],
  providers: [ManagerService, ManagerInventoryService],
  exports: [ManagerService, ManagerInventoryService],
})
export class ManagerModule {}
