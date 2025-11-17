import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  create(@Body() createCouponDto: CreateCouponDto, @Request() req) {
    return this.couponsService.create(createCouponDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  findAll(@Request() req, @Query('storeId') storeId?: string) {
    return this.couponsService.findAll(req.user, storeId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  findOne(@Param('id') id: string, @Request() req) {
    return this.couponsService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  update(@Param('id') id: string, @Body() updateCouponDto: Partial<CreateCouponDto>, @Request() req) {
    return this.couponsService.update(id, updateCouponDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  remove(@Param('id') id: string, @Request() req) {
    return this.couponsService.remove(id, req.user);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  validate(@Body() validateCouponDto: ValidateCouponDto, @Request() req) {
    return this.couponsService.validate(validateCouponDto, req.user?.id);
  }
}

