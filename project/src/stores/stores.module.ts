import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';

@Module({
  providers: [StoresService],
  controllers: [StoresController],
  exports: [StoresService],
})
export class StoresModule {}
