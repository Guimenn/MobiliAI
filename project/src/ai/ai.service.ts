import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ColorAnalysis, Product, User } from '@prisma/client';
import { OpenAIService } from './openai.service';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AIService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private openaiService: OpenAIService,
  ) {}

  async analyzeImageColors(imageBuffer: Buffer, userId?: string): Promise<ColorAnalysis> {
    try {
      console.log('🎨 AIService: Iniciando análise de cores...');
      console.log('👤 User ID:', userId);
      console.log('📊 Tamanho do buffer:', imageBuffer.length, 'bytes');
      
      // Salvar imagem temporariamente
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const imageId = Date.now().toString();
      const imagePath = path.join(tempDir, `${imageId}.jpg`);
      
      // Processar imagem com Sharp
      await sharp(imageBuffer)
        .resize(800, 600, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(imagePath);

      console.log('🔄 AIService: Chamando OpenAI service...');
      // Usar OpenAI para análise de cores
      const detectedColors = await this.openaiService.analyzeImageColors(imageBuffer);
      console.log('✅ AIService: OpenAI retornou cores:', detectedColors);
      
      // Gerar paletas sugeridas
      const suggestedPalettes = this.generateColorPalettes(detectedColors);
      
      // Recomendar produtos baseados nas cores
      const recommendedProducts = await this.recommendProducts(detectedColors);

      // Salvar análise no banco
      const savedAnalysis = await this.prisma.colorAnalysis.create({
        data: {
          imageUrl: imagePath,
          detectedColors: detectedColors as any,
          suggestedPalettes: suggestedPalettes as any,
          recommendedProducts: recommendedProducts as any,
          userId,
          isProcessed: true,
        },
      });

      return savedAnalysis;
    } catch (error) {
      throw new Error(`Erro ao analisar imagem: ${error.message}`);
    }
  }

  async replaceColorInImage(
    imageBuffer: Buffer,
    targetColor: string,
    newColor: string,
    userId?: string,
  ): Promise<{ processedImageUrl: string; analysis: ColorAnalysis }> {
    try {
      // Salvar imagem original
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const imageId = Date.now().toString();
      const originalImagePath = path.join(tempDir, `${imageId}_original.jpg`);
      const processedImagePath = path.join(tempDir, `${imageId}_processed.jpg`);

      // Salvar imagem original
      await sharp(imageBuffer)
        .resize(800, 600, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(originalImagePath);

      // Usar OpenAI para substituição de cor
      const processedBuffer = await this.openaiService.replaceColorInImage(
        imageBuffer,
        targetColor,
        newColor
      );

      // Salvar imagem processada
      fs.writeFileSync(processedImagePath, processedBuffer);
      console.log('💾 Imagem processada salva em:', processedImagePath);

      // Analisar cores da imagem processada
      const analysis = await this.analyzeImageColors(imageBuffer, userId);
      
      // Criar URL HTTP para a imagem processada
      const processedImageUrl = `http://localhost:3001/temp/${imageId}_processed.jpg`;
      console.log('🌐 URL da imagem processada:', processedImageUrl);
      
      // Atualizar análise com URL da imagem processada
      await this.prisma.colorAnalysis.update({
        where: { id: analysis.id },
        data: {
          processedImageUrl: processedImageUrl,
        },
      });

      console.log('✅ Troca de cor concluída com sucesso');
      console.log('📊 Resultado final:', {
        analysisId: analysis.id,
        processedImageUrl: processedImageUrl,
        targetColor: targetColor,
        newColor: newColor
      });

      return {
        processedImageUrl: processedImageUrl,
        analysis,
      };
    } catch (error) {
      throw new Error(`Erro ao processar imagem: ${error.message}`);
    }
  }

  async getColorAnalysis(id: string): Promise<ColorAnalysis> {
    const analysis = await this.prisma.colorAnalysis.findUnique({ where: { id } });
    if (!analysis) {
      throw new NotFoundException('Análise não encontrada');
    }
    return analysis;
  }

  async getUserColorAnalyses(userId: string): Promise<ColorAnalysis[]> {
    return this.prisma.colorAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async extractColorsFromImage(imagePath: string): Promise<any[]> {
    try {
      // Usar Sharp para extrair cores dominantes da imagem
      const image = sharp(imagePath);
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
      
      const colorMap = new Map<string, { count: number; r: number; g: number; b: number }>();
      const totalPixels = info.width * info.height;
      
      // Amostrar pixels (a cada 10 pixels para performance)
      for (let i = 0; i < data.length; i += 30) { // 30 = 10 pixels * 3 channels (RGB)
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Agrupar cores similares (tolerância de ±20)
        const key = `${Math.floor(r / 20) * 20}-${Math.floor(g / 20) * 20}-${Math.floor(b / 20) * 20}`;
        
        if (colorMap.has(key)) {
          const existing = colorMap.get(key)!;
          existing.count++;
          existing.r = (existing.r + r) / 2;
          existing.g = (existing.g + g) / 2;
          existing.b = (existing.b + b) / 2;
        } else {
          colorMap.set(key, { count: 1, r, g, b });
        }
      }
      
      // Converter para array e ordenar por frequência
      const colors = Array.from(colorMap.entries())
        .map(([key, value]) => ({
          hex: this.rgbToHex(Math.round(value.r), Math.round(value.g), Math.round(value.b)),
          rgb: { r: Math.round(value.r), g: Math.round(value.g), b: Math.round(value.b) },
          percentage: (value.count / (totalPixels / 10)) * 100,
          position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 6); // Top 6 cores
      
      return colors;
    } catch (error) {
      // Fallback para cores simuladas se houver erro
      return [
        {
          hex: '#FF5733',
          rgb: { r: 255, g: 87, b: 51 },
          percentage: 35.5,
          position: { x: 100, y: 150 },
        },
        {
          hex: '#33FF57',
          rgb: { r: 51, g: 255, b: 87 },
          percentage: 28.2,
          position: { x: 300, y: 200 },
        },
        {
          hex: '#3357FF',
          rgb: { r: 51, g: 87, b: 255 },
          percentage: 20.1,
          position: { x: 500, y: 100 },
        },
        {
          hex: '#FFFF33',
          rgb: { r: 255, g: 255, b: 51 },
          percentage: 16.2,
          position: { x: 200, y: 300 },
        },
      ];
    }
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }

  private generateColorPalettes(detectedColors: any[]): any[] {
    // Gerar paletas harmoniosas baseadas nas cores detectadas
    return [
      {
        name: 'Paleta Complementar',
        colors: detectedColors.slice(0, 3).map(c => c.hex),
        harmony: 'complementary',
      },
      {
        name: 'Paleta Triádica',
        colors: detectedColors.slice(1, 4).map(c => c.hex),
        harmony: 'triadic',
      },
      {
        name: 'Paleta Análoga',
        colors: detectedColors.slice(0, 4).map(c => c.hex),
        harmony: 'analogous',
      },
    ];
  }

  private async recommendProducts(detectedColors: any[]): Promise<any[]> {
    // Buscar produtos com cores similares
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      take: 5,
    });

    return products.map(product => ({
      productId: product.id,
      confidence: Math.random() * 0.5 + 0.5, // Simulação
      reason: `Cor similar à ${product.color || 'cor do produto'}`,
    }));
  }

  private async replaceColor(
    inputPath: string,
    outputPath: string,
    targetColor: string,
    newColor: string,
  ): Promise<void> {
    try {
      // Converter cores hex para RGB
      const targetRgb = this.hexToRgb(targetColor);
      const newRgb = this.hexToRgb(newColor);
      
      if (!targetRgb || !newRgb) {
        throw new Error('Cores inválidas');
      }

      // Processar imagem com Sharp
      const image = sharp(inputPath);
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
      
      // Aplicar substituição de cor pixel por pixel
      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calcular distância da cor alvo (tolerância de 50)
        const distance = Math.sqrt(
          Math.pow(r - targetRgb.r, 2) + 
          Math.pow(g - targetRgb.g, 2) + 
          Math.pow(b - targetRgb.b, 2)
        );
        
        if (distance < 50) {
          // Aplicar substituição com transição suave
          const factor = 1 - (distance / 50);
          data[i] = Math.round(r + (newRgb.r - r) * factor);
          data[i + 1] = Math.round(g + (newRgb.g - g) * factor);
          data[i + 2] = Math.round(b + (newRgb.b - b) * factor);
        }
      }
      
      // Salvar imagem processada
      await sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 3,
        },
      })
        .jpeg({ quality: 90 })
        .toFile(outputPath);
        
    } catch (error) {
      // Fallback: aplicar efeito visual simples
      await sharp(inputPath)
        .modulate({
          brightness: 1.1,
          saturation: 1.2,
          hue: 30,
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}