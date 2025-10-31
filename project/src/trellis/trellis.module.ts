import { Module } from '@nestjs/common';
import { TrellisService } from './trellis.service';

@Module({
  providers: [TrellisService],
  exports: [TrellisService],
})
export class TrellisModule {}


