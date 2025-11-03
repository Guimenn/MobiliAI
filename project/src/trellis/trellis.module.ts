import { Module } from '@nestjs/common';
import { TrellisService } from './trellis.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  providers: [TrellisService],
  exports: [TrellisService],
})
export class TrellisModule {}


