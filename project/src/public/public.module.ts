import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicProductsService } from './public-products.service';
import { PublicSupportService } from './public-support.service';
import { AdminSystemService } from '../admin/admin-system.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, UploadModule, AIModule],
  controllers: [PublicController],
  providers: [PublicProductsService, PublicSupportService, AdminSystemService],
  exports: [PublicProductsService, PublicSupportService],
})
export class PublicModule {}

