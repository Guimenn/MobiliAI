import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeInventoryService } from './employee-inventory.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    PrismaModule,
    ProductsModule,
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeInventoryService],
  exports: [EmployeeService, EmployeeInventoryService],
})
export class EmployeeModule {}
