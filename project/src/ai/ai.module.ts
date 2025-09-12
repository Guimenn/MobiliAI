import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { OpenAIService } from './openai.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
  ],
  providers: [AIService, OpenAIService],
  controllers: [AIController],
  exports: [AIService, OpenAIService],
})
export class AIModule {}
