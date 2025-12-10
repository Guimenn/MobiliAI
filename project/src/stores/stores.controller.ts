import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Store } from '../entities/store.entity';

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  create(@Body() createStoreDto: Partial<Store>, @Request() req) {
    return this.storesService.create(createStoreDto, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.storesService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.storesService.findOne(id, req.user);
  }

  @Get(':id/stats')
  getStoreStats(@Param('id') id: string, @Request() req) {
    return this.storesService.getStoreStats(id, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStoreDto: Partial<Store>, @Request() req) {
    return this.storesService.update(id, updateStoreDto, req.user);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string, @Request() req) {
  //   return this.storesService.remove(id, req.user);
  // }
}
