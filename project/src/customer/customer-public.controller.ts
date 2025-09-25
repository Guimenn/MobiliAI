import { Controller, Post, Body } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Controller('customer/public')
export class CustomerPublicController {
  constructor(private readonly customerService: CustomerService) {}

  // ==================== REGISTRO PÚBLICO ====================

  @Post('register')
  async register(@Body() customerData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) {
    return this.customerService.register(customerData);
  }
}
