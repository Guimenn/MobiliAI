import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminSystemService } from './admin-system.service';
import { AdminNotificationsService } from './admin-notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { StoresModule } from '../stores/stores.module';
import { SalesModule } from '../sales/sales.module';
import { FinancialModule } from '../financial/financial.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ProductsModule,
    StoresModule,
    SalesModule,
    FinancialModule,
    UploadModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminCategoriesService, AdminSystemService, AdminNotificationsService],
  exports: [AdminService, AdminCategoriesService, AdminSystemService, AdminNotificationsService],
})
export class AdminModule {}
