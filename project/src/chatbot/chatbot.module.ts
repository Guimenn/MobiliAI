import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [ChatbotService],
  controllers: [ChatbotController],
  exports: [ChatbotService],
})
export class ChatbotModule {}
