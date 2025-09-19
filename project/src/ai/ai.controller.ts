import { Controller, Post, Get, Param, UseGuards, Request, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AIService } from './ai.service';
import { ReplicateService } from './replicate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly replicateService: ReplicateService
  ) { }

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

    // Validar formato da imagem
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      console.error('❌ AIController: Formato de imagem não suportado:', file.mimetype);
      throw new Error(`Formato de imagem não suportado. Formatos aceitos: ${allowedMimeTypes.join(', ')}`);
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('❌ AIController: Arquivo muito grande:', file.size, 'bytes');
      throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
    }

    // Validar se o buffer não está vazio
    if (!file.buffer || file.buffer.length === 0) {
      console.error('❌ AIController: Buffer da imagem vazio');
      throw new Error('Imagem inválida ou corrompida');
    }

    console.log('✅ AIController: Validações passaram - formato:', file.mimetype, 'tamanho:', file.size, 'bytes');
    console.log('🔄 AIController: Chamando AI service...');
    const result = await this.aiService.analyzeImageColors(file.buffer, req.user.id, file.mimetype);
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

    // Validar formato da imagem
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      console.error('❌ AIController: Formato de imagem não suportado:', file.mimetype);
      throw new Error(`Formato de imagem não suportado. Formatos aceitos: ${allowedMimeTypes.join(', ')}`);
    }

    const { targetColor, newColor, tolerance, useDALLE3 } = req.body;
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
      tolerance ? parseInt(tolerance) : 80,
      useDALLE3 === 'true' || useDALLE3 === true,
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

  // Novas rotas baseadas na lógica do projeto testando-nanobanana
  @Post('process-url')
  async processImageWithUrl(
    @Body() body: { prompt: string; imageUrl: string; outputFormat?: string },
    @Request() req
  ) {
    console.log('🚀 AIController: Processando imagem com URL');
    console.log('📝 Prompt:', body.prompt);
    console.log('🖼️ URL:', body.imageUrl);
    console.log('👤 Usuário:', req.user.id);

    if (!body.prompt || !body.imageUrl) {
      throw new Error('Prompt e URL da imagem são obrigatórios');
    }

    const result = await this.replicateService.processImageWithUrl(
      body.prompt,
      body.imageUrl,
      body.outputFormat || 'jpg'
    );

    if (result.success) {
      return {
        success: true,
        imageUrl: result.imageUrl,
        localFile: result.localFile,
        message: 'Imagem processada com sucesso!'
      };
    } else {
      throw new Error(result.error || 'Erro ao processar imagem');
    }
  }

  @Post('process-upload')
  @UseInterceptors(FileInterceptor('image'))
  async processImageWithUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { prompt: string; outputFormat?: string },
    @Request() req
  ) {
    console.log('🚀 AIController: Processando upload de imagem');
    console.log('📁 Arquivo:', file ? {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    } : 'NENHUM');
    console.log('📝 Prompt:', body.prompt);
    console.log('👤 Usuário:', req.user.id);

    if (!file) {
      throw new Error('Nenhuma imagem foi enviada');
    }

    if (!body.prompt) {
      throw new Error('Prompt é obrigatório');
    }

    // Validar formato da imagem
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Formato de imagem não suportado. Formatos aceitos: ${allowedMimeTypes.join(', ')}`);
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
    }

    const result = await this.replicateService.processImageWithPrompt(
      body.prompt,
      file.buffer,
      body.outputFormat || 'jpg',
      file.originalname
    );

    if (result.success) {
      return {
        success: true,
        imageUrl: result.imageUrl,
        localFile: result.localFile,
        message: 'Imagem processada com sucesso!'
      };
    } else {
      throw new Error(result.error || 'Erro ao processar imagem');
    }
  }
}
