import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get()
  getTest() {
    return { message: 'Test controller funcionando!' };
  }

  @Post('employees')
  createEmployee(@Body() data: any) {
    return { message: 'Test endpoint funcionando!', data };
  }
}


