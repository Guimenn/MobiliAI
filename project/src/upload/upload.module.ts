import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { ImageKitService } from './imagekit.service';
import { UploadController } from './upload.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [UploadController],
  providers: [UploadService, ImageKitService],
  exports: [UploadService, ImageKitService],
})
export class UploadModule {}