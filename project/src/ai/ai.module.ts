import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { OpenAIService } from './openai.service';
import { ReplicateService } from './replicate.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
  ],
  providers: [AIService, OpenAIService, ReplicateService],
  controllers: [AIController],
  exports: [AIService, OpenAIService, ReplicateService],
})
export class AIModule {}
