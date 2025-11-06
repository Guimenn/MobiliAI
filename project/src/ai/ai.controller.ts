import { Controller, Post, Get, Param, UseGuards, Request, UseInterceptors, UploadedFile, UploadedFiles, Body } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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

  // Novas rotas para análise de móveis
  @Post('analyze-furniture')
  @UseInterceptors(FileInterceptor('image'))
  async analyzeFurniture(@UploadedFile() file: Express.Multer.File, @Request() req) {
    console.log('🪑 AIController: Recebida requisição de análise de móveis');
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
    const result = await this.aiService.analyzeFurnitureSpaces(file.buffer, req.user.id, file.mimetype);
    console.log('✅ AIController: Análise concluída, retornando resultado');
    return result;
  }

  @Post('add-furniture')
  @UseInterceptors(FileInterceptor('image'))
  async addFurniture(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    console.log('🪑 AIController: Recebida requisição de adição de móvel');
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

    const { space, furniture } = req.body;
    console.log('🪑 Dados recebidos:', { space, furniture });
    
    if (!space || !furniture) {
      console.error('❌ AIController: Dados não fornecidos');
      throw new Error('space e furniture são obrigatórios');
    }

    console.log('🔄 AIController: Chamando AI service para adicionar móvel...');
    const result = await this.aiService.addFurnitureToSpace(
      file.buffer,
      JSON.parse(space),
      furniture,
      req.user.id,
    );

    console.log('✅ AIController: Adição de móvel concluída');
    console.log('📊 Resultado:', {
      hasProcessedImage: !!result.processedImageUrl,
      processedImageUrl: result.processedImageUrl
    });

    return result;
  }

  @Get('furniture-analysis/:id')
  async getFurnitureAnalysis(@Param('id') id: string) {
    return this.aiService.getFurnitureAnalysis(id);
  }

  @Get('my-furniture-analyses')
  async getUserFurnitureAnalyses(@Request() req) {
    return this.aiService.getUserFurnitureAnalyses(req.user.id);
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
  @UseInterceptors(FilesInterceptor('images', 10)) // Aceita até 10 imagens
  async processImageWithUpload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { prompt: string; outputFormat?: string },
    @Request() req
  ) {
    console.log('🚀 AIController: Processando upload de imagens');
    console.log('📁 Arquivos recebidos:', files ? files.length : 0);
    console.log('📝 Prompt:', body.prompt);
    console.log('👤 Usuário:', req.user.id);

    if (!files || files.length === 0) {
      throw new Error('Nenhuma imagem foi enviada');
    }

    // Validar formato das imagens
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`Formato de imagem não suportado: ${file.originalname}. Formatos aceitos: ${allowedMimeTypes.join(', ')}`);
      }
      
      // Validar tamanho do arquivo (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error(`Arquivo muito grande: ${file.originalname}. Tamanho máximo: 10MB`);
      }
    }

    // Primeira imagem é o ambiente, as demais são produtos
    const environmentImage = files[0];
    const productImages = files.slice(1);

    console.log(`🖼️  Imagem do ambiente: ${environmentImage.originalname}`);
    console.log(`📦 Imagens de produtos: ${productImages.length}`);

    // Se não houver produtos, usar o método antigo
    if (productImages.length === 0) {
      const result = await this.replicateService.processImageWithPrompt(
        body.prompt || 'Adicione os produtos na imagem de forma realista',
        environmentImage.buffer,
        body.outputFormat || 'jpg',
        environmentImage.originalname
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

    // Usar método com múltiplas imagens
    const productBuffers = productImages.map(img => img.buffer);
    const result = await this.replicateService.processImageWithMultipleImages(
      body.prompt || 'Adicione os produtos mostrados nas imagens na foto do ambiente de forma realista e natural, mantendo o ambiente original intacto',
      environmentImage.buffer,
      productBuffers,
      body.outputFormat || 'jpg',
      environmentImage.originalname
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
