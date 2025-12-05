import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentExpirationCronService } from './payment-expiration-cron.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentExpirationCronService],
  exports: [PaymentService],
})
export class PaymentModule {}

