import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicProductsService } from './public-products.service';
import { PublicSupportService } from './public-support.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicController],
  providers: [PublicProductsService, PublicSupportService],
  exports: [PublicProductsService, PublicSupportService],
})
export class PublicModule {}

