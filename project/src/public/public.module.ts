import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicProductsService } from './public-products.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicController],
  providers: [PublicProductsService],
  exports: [PublicProductsService],
})
export class PublicModule {}
