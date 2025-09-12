import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ChatSession, ChatMessage, MessageRole, Product, User } from '@prisma/client';
import OpenAI from 'openai';

@Injectable()
export class ChatbotService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async createSession(userId: string, title?: string): Promise<ChatSession> {
    return this.prisma.chatSession.create({
      data: {
        title: title || 'Nova Conversa',
        userId,
      },
    });
  }

  async getSessions(userId: string): Promise<ChatSession[]> {
    return this.prisma.chatSession.findMany({
      where: { userId, isActive: true },
      include: {
        messages: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSession(sessionId: string, userId: string): Promise<ChatSession> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    return session;
  }

  async sendMessage(
    sessionId: string,
    content: string,
    userId: string,
  ): Promise<{ message: ChatMessage; response: ChatMessage }> {
    const session = await this.getSession(sessionId, userId);

    // Salvar mensagem do usuário
    const savedUserMessage = await this.prisma.chatMessage.create({
      data: {
        content,
        role: MessageRole.USER,
        sessionId,
      },
    });

    // Gerar resposta do assistente
    const assistantResponse = await this.generateResponse(session, content);

    // Salvar resposta do assistente
    const savedAssistantMessage = await this.prisma.chatMessage.create({
      data: {
        content: assistantResponse.content,
        role: MessageRole.ASSISTANT,
        sessionId,
        metadata: assistantResponse.metadata as any,
      },
    });

    // Atualizar timestamp da sessão
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return {
      message: savedUserMessage,
      response: savedAssistantMessage,
    };
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.getSession(sessionId, userId);
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  private async generateResponse(session: ChatSession, userMessage: string): Promise<{
    content: string;
    metadata?: any;
  }> {
    try {
      // Construir contexto da conversa
      const conversationHistory = (session as any).messages
        .slice(-10) // Últimas 10 mensagens
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Buscar produtos relevantes
      const relevantProducts = await this.findRelevantProducts(userMessage);

      // Construir prompt para o ChatGPT
      const systemPrompt = `Você é um assistente virtual especializado em tintas e pintura. 
      Você trabalha em uma loja de tintas e deve ajudar os clientes com:
      - Recomendações de cores e produtos
      - Dicas de pintura
      - Cálculos de quantidade de tinta
      - Sugestões de paletas harmoniosas
      - Informações sobre técnicas de pintura

      Produtos disponíveis: ${relevantProducts.map(p => `${p.name} - ${p.color} - R$ ${p.price}`).join(', ')}

      Seja amigável, profissional e útil. Sempre que possível, sugira produtos específicos da loja.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(conversationHistory ? [{ role: 'user', content: conversationHistory }] : []),
        { role: 'user', content: userMessage },
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages as any,
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

      // Extrair recomendações de produtos da resposta
      const productRecommendations = this.extractProductRecommendations(response, relevantProducts);

      return {
        content: response,
        metadata: {
          productRecommendations,
          colorSuggestions: this.extractColorSuggestions(response),
        },
      };
    } catch (error) {
      console.error('Erro ao gerar resposta do chatbot:', error);
      return {
        content: 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.',
      };
    }
  }

  private async findRelevantProducts(query: string): Promise<Product[]> {
    // Buscar produtos baseados na consulta
    const searchTerms = query.toLowerCase().split(' ');
    
    // Para o Prisma, vamos usar uma busca mais simples
    const products = await this.prisma.product.findMany({
      where: { 
        isActive: true,
        OR: searchTerms.map(term => ({
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { color: { contains: term, mode: 'insensitive' } },
            { brand: { contains: term, mode: 'insensitive' } },
          ],
        })),
      },
      take: 10,
    });

    return products;
  }

  private extractProductRecommendations(response: string, products: Product[]): string[] {
    const recommendations: string[] = [];
    
    products.forEach(product => {
      if (response.toLowerCase().includes(product.name.toLowerCase()) ||
          response.toLowerCase().includes(product.color?.toLowerCase() || '')) {
        recommendations.push(product.id);
      }
    });

    return recommendations;
  }

  private extractColorSuggestions(response: string): string[] {
    // Extrair códigos de cor hexadecimais da resposta
    const colorRegex = /#[0-9A-Fa-f]{6}/g;
    return response.match(colorRegex) || [];
  }
}