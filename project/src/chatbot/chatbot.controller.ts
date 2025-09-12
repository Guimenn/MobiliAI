import { Controller, Post, Get, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('sessions')
  async createSession(@Request() req, @Body('title') title?: string) {
    return this.chatbotService.createSession(req.user.id, title);
  }

  @Get('sessions')
  async getSessions(@Request() req) {
    return this.chatbotService.getSessions(req.user.id);
  }

  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string, @Request() req) {
    return this.chatbotService.getSession(sessionId, req.user.id);
  }

  @Post('sessions/:sessionId/messages')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body('content') content: string,
    @Request() req,
  ) {
    return this.chatbotService.sendMessage(sessionId, content, req.user.id);
  }

  @Delete('sessions/:sessionId')
  async deleteSession(@Param('sessionId') sessionId: string, @Request() req) {
    await this.chatbotService.deleteSession(sessionId, req.user.id);
    return { message: 'Sessão deletada com sucesso' };
  }
}
