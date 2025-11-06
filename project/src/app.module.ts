import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { StoresModule } from './stores/stores.module';
import { SalesModule } from './sales/sales.module';
import { AIModule } from './ai/ai.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PdvModule } from './pdv/pdv.module';
import { FinancialModule } from './financial/financial.module';
import { AdminModule } from './admin/admin.module';
import { ManagerModule } from './manager/manager.module';
import { EmployeeModule } from './employee/employee.module';
import { CustomerModule } from './customer/customer.module';
import { UploadModule } from './upload/upload.module';
import { TimeClockModule } from './time-clock/time-clock.module';
import { TimeClockService } from './time-clock/time-clock.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { TrellisModule } from './trellis/trellis.module';
import { PublicModule } from './public/public.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentModule } from './payment/payment.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    AuthModule,
    UsersModule,
    ProductsModule,
    StoresModule,
    SalesModule,
    AIModule,
    ChatbotModule,
    SuppliersModule,
    PdvModule,
    FinancialModule,
    AdminModule,
    ManagerModule,
    EmployeeModule,
    CustomerModule,
    UploadModule,
    TimeClockModule,
    DashboardModule,
    TrellisModule,
    PublicModule,
    NotificationsModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService, TimeClockService],
})
export class AppModule {}