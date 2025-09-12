import { Controller, Post, Get, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('analyze-colors')
  @UseInterceptors(FileInterceptor('image'))
  async analyzeColors(@UploadedFile() file: Express.Multer.File, @Request() req) {
    console.log('🎯 AIController: Recebida requisição de análise de cores');
    console.log('📁 Arquivo recebido:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : 'NENHUM');
    console.log('👤 Usuário:', req.user ? {
      id: req.user.id,
      email: req.user.email
    } : 'NENHUM');

    if (!file) {
      console.error('❌ AIController: Nenhum arquivo enviado');
      throw new Error('Imagem é obrigatória');
    }

    console.log('🔄 AIController: Chamando AI service...');
    const result = await this.aiService.analyzeImageColors(file.buffer, req.user.id);
    console.log('✅ AIController: Análise concluída, retornando resultado');
    return result;
  }

  @Post('replace-color')
  @UseInterceptors(FileInterceptor('image'))
  async replaceColor(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    console.log('🎨 AIController: Recebida requisição de troca de cor');
    console.log('📁 Arquivo recebido:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : 'NENHUM');
    console.log('👤 Usuário:', req.user ? {
      id: req.user.id,
      email: req.user.email
    } : 'NENHUM');

    if (!file) {
      console.error('❌ AIController: Nenhum arquivo enviado');
      throw new Error('Imagem é obrigatória');
    }

    const { targetColor, newColor } = req.body;
    console.log('🎯 Cores recebidas:', { targetColor, newColor });
    
    if (!targetColor || !newColor) {
      console.error('❌ AIController: Cores não fornecidas');
      throw new Error('targetColor e newColor são obrigatórios');
    }

    console.log('🔄 AIController: Chamando AI service para troca de cor...');
    const result = await this.aiService.replaceColorInImage(
      file.buffer,
      targetColor,
      newColor,
      req.user.id,
    );
    
    console.log('✅ AIController: Troca de cor concluída');
    console.log('📊 Resultado:', {
      hasProcessedImage: !!result.processedImageUrl,
      processedImageUrl: result.processedImageUrl
    });
    
    return result;
  }

  @Get('analysis/:id')
  async getColorAnalysis(@Param('id') id: string) {
    return this.aiService.getColorAnalysis(id);
  }

  @Get('my-analyses')
  async getUserColorAnalyses(@Request() req) {
    return this.aiService.getUserColorAnalyses(req.user.id);
  }
}
