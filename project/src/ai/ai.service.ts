import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ColorAnalysis, Product, User, FurnitureAnalysis, ProductCategory } from '@prisma/client';
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

  async analyzeImageColors(imageBuffer: Buffer, userId?: string, mimeType?: string): Promise<ColorAnalysis> {
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
      const detectedColors = await this.openaiService.analyzeImageColors(imageBuffer, mimeType);
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
          suggestedColors: suggestedPalettes as any,
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
    tolerance: number = 80,
    useDALLE3: boolean = true,
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

      // Primeiro, analisar as cores para obter as variações
      console.log('🔍 Analisando cores para obter variações...');
      const tempAnalysis = await this.analyzeImageColors(imageBuffer, userId);
      
      // Encontrar a cor selecionada e suas variações
      const detectedColors = tempAnalysis.detectedColors as any[];
      const selectedColorData = detectedColors.find(
        color => color.hex.toLowerCase() === targetColor.toLowerCase()
      );
      
      let colorVariations = null;
      if (selectedColorData && (selectedColorData as any).variations) {
        colorVariations = (selectedColorData as any).variations;
        console.log('📊 Variações encontradas:', colorVariations.length);
      } else {
        console.log('⚠️ Variações não encontradas, usando método padrão');
      }

      // Escolher método baseado na preferência do usuário
      if (useDALLE3) {
        // Tentar usar DALL-E 3 inpainting primeiro
        try {
          console.log('🎭 Tentando usar DALL-E 3 inpainting...');
          
          // Gerar máscara de parede
          const wallMask = await this.openaiService.generateWallMask(
            imageBuffer,
            targetColor,
            tolerance
          );
          
          // Salvar máscara temporariamente para debug
          const maskPath = path.join(tempDir, `${imageId}_mask.png`);
          fs.writeFileSync(maskPath, wallMask);
          console.log('💾 Máscara salva em:', maskPath);
          
          // Usar DALL-E 3 inpainting
          const processedBuffer = await this.openaiService.performDALLE3Inpainting(
            imageBuffer,
            wallMask,
            targetColor,
            newColor
          );
          
          // Salvar resultado do DALL-E 3
          fs.writeFileSync(processedImagePath, processedBuffer);
          console.log('✅ DALL-E 3 inpainting concluído com sucesso');
          
        } catch (dalleError) {
          console.log('⚠️ DALL-E 3 inpainting falhou, usando método tradicional:', dalleError.message);
          
          // Fallback para algoritmo tradicional
          console.log('🎨 Aplicando substituição inteligente de cores...');
          console.log('🎯 Tolerância configurada:', tolerance);
          await this.replaceColor(
            originalImagePath,
            processedImagePath,
            targetColor,
            newColor,
            colorVariations,
            tolerance
          );
        }
      } else {
        // Usar método tradicional diretamente
        console.log('🎨 Usando método tradicional de substituição de cores...');
        console.log('🎯 Tolerância configurada:', tolerance);
        await this.replaceColor(
          originalImagePath,
          processedImagePath,
          targetColor,
          newColor,
          colorVariations,
          tolerance
        );
      }

      console.log('💾 Imagem processada salva em:', processedImagePath);

      // Criar URL HTTP para a imagem processada
      const processedImageUrl = `http://localhost:3001/temp/${imageId}_processed.jpg`;
      console.log('🌐 URL da imagem processada:', processedImageUrl);
      
      // Atualizar análise com URL da imagem processada
      await this.prisma.colorAnalysis.update({
        where: { id: tempAnalysis.id },
        data: {
          processedImageUrl: processedImageUrl,
        },
      });

      console.log('✅ Troca de cor concluída com sucesso');
      console.log('📊 Resultado final:', {
        analysisId: tempAnalysis.id,
        processedImageUrl: processedImageUrl,
        targetColor: targetColor,
        newColor: newColor,
        variationsUsed: colorVariations?.length || 0
      });

      return {
        processedImageUrl: processedImageUrl,
        analysis: tempAnalysis,
      };
    } catch (error) {
      console.error('❌ Erro ao processar imagem:', error);
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

  // Novas funcionalidades para análise de móveis
  async analyzeFurnitureSpaces(imageBuffer: Buffer, userId?: string, mimeType?: string): Promise<FurnitureAnalysis> {
    try {
      console.log('🪑 AIService: Iniciando análise de espaços para móveis...');
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

      console.log('🔄 AIService: Chamando OpenAI service para análise de espaços...');
      // Usar OpenAI para análise de espaços
      const detectedSpaces = await this.openaiService.analyzeFurnitureSpaces(imageBuffer, mimeType);
      console.log('✅ AIService: OpenAI retornou espaços:', detectedSpaces);
      
      // Gerar sugestões de móveis
      const suggestedFurniture = this.generateFurnitureSuggestions(detectedSpaces);
      
      // Recomendar produtos baseados nos espaços
      const recommendedProducts = await this.recommendFurnitureProducts(detectedSpaces);

      // Salvar análise no banco
      const savedAnalysis = await this.prisma.furnitureAnalysis.create({
        data: {
          imageUrl: imagePath,
          detectedSpaces: detectedSpaces as any,
          suggestedFurniture: suggestedFurniture as any,
          recommendedProducts: recommendedProducts as any,
          userId,
          isProcessed: true,
        },
      });

      return savedAnalysis;
    } catch (error) {
      throw new Error(`Erro ao analisar espaços: ${error.message}`);
    }
  }

  async addFurnitureToSpace(
    imageBuffer: Buffer,
    space: any,
    furniture: string,
    userId?: string,
  ): Promise<{ processedImageUrl: string; analysis: FurnitureAnalysis }> {
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

      // Primeiro, analisar os espaços
      console.log('🔍 Analisando espaços para adicionar móvel...');
      const tempAnalysis = await this.analyzeFurnitureSpaces(imageBuffer, userId);
      
      // Usar OpenAI para adicionar móvel ao espaço
      const processedBuffer = await this.openaiService.addFurnitureToImage(
        imageBuffer,
        space,
        furniture
      );
      
      // Salvar resultado
      fs.writeFileSync(processedImagePath, processedBuffer);
      console.log('✅ Móvel adicionado com sucesso');

      // Criar URL HTTP para a imagem processada
      const processedImageUrl = `http://localhost:3001/temp/${imageId}_processed.jpg`;
      console.log('🌐 URL da imagem processada:', processedImageUrl);
      
      // Atualizar análise com URL da imagem processada
      await this.prisma.furnitureAnalysis.update({
        where: { id: tempAnalysis.id },
        data: {
          processedImageUrl: processedImageUrl,
        },
      });

      console.log('✅ Adição de móvel concluída com sucesso');
      console.log('📊 Resultado final:', {
        analysisId: tempAnalysis.id,
        processedImageUrl: processedImageUrl,
        space: space.type,
        furniture: furniture
      });

      return {
        processedImageUrl: processedImageUrl,
        analysis: tempAnalysis,
      };
    } catch (error) {
      console.error('❌ Erro ao adicionar móvel:', error);
      throw new Error(`Erro ao adicionar móvel: ${error.message}`);
    }
  }

  async getFurnitureAnalysis(id: string): Promise<FurnitureAnalysis> {
    const analysis = await this.prisma.furnitureAnalysis.findUnique({ where: { id } });
    if (!analysis) {
      throw new NotFoundException('Análise de móveis não encontrada');
    }
    return analysis;
  }

  async getUserFurnitureAnalyses(userId: string): Promise<FurnitureAnalysis[]> {
    return this.prisma.furnitureAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private generateFurnitureSuggestions(detectedSpaces: any[]): any[] {
    // Gerar sugestões de móveis baseadas nos espaços detectados
    const suggestions = [];
    
    for (const space of detectedSpaces) {
      switch (space.type.toLowerCase()) {
        case 'sala':
          suggestions.push({
            name: 'Sofá 3 Lugares',
            category: 'sofa',
            confidence: 0.9,
            reason: 'Ideal para sala de estar'
          });
          suggestions.push({
            name: 'Mesa de Centro',
            category: 'mesa',
            confidence: 0.8,
            reason: 'Complementa o sofá'
          });
          break;
        case 'quarto':
          suggestions.push({
            name: 'Cama King Size',
            category: 'cama',
            confidence: 0.95,
            reason: 'Cama principal para o quarto'
          });
          suggestions.push({
            name: 'Guarda-roupa',
            category: 'armario',
            confidence: 0.9,
            reason: 'Armazenamento essencial'
          });
          break;
        case 'cozinha':
          suggestions.push({
            name: 'Mesa de Jantar',
            category: 'mesa',
            confidence: 0.85,
            reason: 'Mesa para refeições'
          });
          suggestions.push({
            name: 'Cadeiras de Jantar',
            category: 'cadeira',
            confidence: 0.8,
            reason: 'Cadeiras para a mesa'
          });
          break;
        default:
          suggestions.push({
            name: 'Poltrona',
            category: 'cadeira',
            confidence: 0.7,
            reason: 'Móvel versátil para qualquer ambiente'
          });
      }
    }
    
    return suggestions;
  }

  private async recommendFurnitureProducts(detectedSpaces: any[]): Promise<any[]> {
    // Buscar produtos de móveis
    const products = await this.prisma.product.findMany({
      where: { 
        isActive: true,
        category: {
          in: ['SOFA', 'MESA', 'CADEIRA', 'ARMARIO', 'CAMA', 'DECORACAO', 'ILUMINACAO'] as ProductCategory[]
        }
      },
      take: 5,
    });

    return products.map(product => ({
      productId: product.id,
      confidence: Math.random() * 0.5 + 0.5, // Simulação
      reason: `Móvel ideal para ${product.category.toLowerCase()}`,
    }));
  }

  private async extractColorsFromImage(imagePath: string): Promise<any[]> {
    try {
      // Usar Sharp para extrair cores dominantes da imagem
      const image = sharp(imagePath);
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
      
      const colorMap = new Map<string, { count: number; r: number; g: number; b: number; pixels: Array<{r: number, g: number, b: number, x: number, y: number}> }>();
      const totalPixels = info.width * info.height;
      
      // Amostrar pixels (a cada 5 pixels para melhor precisão)
      for (let i = 0; i < data.length; i += 15) { // 15 = 5 pixels * 3 channels (RGB)
        const pixelIndex = i / 3;
        const x = pixelIndex % info.width;
        const y = Math.floor(pixelIndex / info.width);
        
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Agrupar cores similares com tolerância menor para melhor agrupamento
        const key = `${Math.floor(r / 15) * 15}-${Math.floor(g / 15) * 15}-${Math.floor(b / 15) * 15}`;
        
        if (colorMap.has(key)) {
          const existing = colorMap.get(key)!;
          existing.count++;
          existing.r = (existing.r + r) / 2;
          existing.g = (existing.g + g) / 2;
          existing.b = (existing.b + b) / 2;
          existing.pixels.push({ r, g, b, x, y });
        } else {
          colorMap.set(key, { 
            count: 1, 
            r, g, b, 
            pixels: [{ r, g, b, x, y }] 
          });
        }
      }
      
      // Agrupar cores similares usando clustering
      const colorGroups = this.groupSimilarColors(Array.from(colorMap.entries()));
      
      // Converter para array e ordenar por frequência, priorizando cores de parede
      const colors = colorGroups
        .map((group) => {
          const totalCount = group.reduce((sum, [, value]) => sum + value.count, 0);
          const avgR = Math.round(group.reduce((sum, [, value]) => sum + value.r, 0) / group.length);
          const avgG = Math.round(group.reduce((sum, [, value]) => sum + value.g, 0) / group.length);
          const avgB = Math.round(group.reduce((sum, [, value]) => sum + value.b, 0) / group.length);
          
          // Analisar posição dos pixels para determinar se é parede
          const allPixels = group.flatMap(([, value]) => value.pixels);
          const wallScore = this.calculateWallScore(allPixels, info.width, info.height);
          
          return {
            hex: this.rgbToHex(avgR, avgG, avgB),
            rgb: { r: avgR, g: avgG, b: avgB },
            percentage: (totalCount / (totalPixels / 5)) * 100,
            position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
            wallScore: wallScore, // Score de probabilidade de ser parede (0-1)
            isWall: wallScore > 0.6, // Considera parede se score > 60%
            // Armazenar todas as variações da cor para troca inteligente
            variations: group.map(([key, value]) => ({
              key,
              rgb: { r: Math.round(value.r), g: Math.round(value.g), b: Math.round(value.b) },
              count: value.count,
              wallScore: wallScore
            }))
          };
        })
        .sort((a, b) => {
          // Priorizar cores de parede primeiro, depois por frequência
          if (a.isWall && !b.isWall) return -1;
          if (!a.isWall && b.isWall) return 1;
          return b.percentage - a.percentage;
        })
        .slice(0, 6); // Top 6 cores
      
      return colors;
    } catch (error) {
      console.error('Erro ao extrair cores:', error);
      // Fallback para cores simuladas se houver erro
      return [
        {
          hex: '#FF5733',
          rgb: { r: 255, g: 87, b: 51 },
          percentage: 35.5,
          position: { x: 100, y: 150 },
          wallScore: 0.8,
          isWall: true,
          variations: [{ key: '255-87-51', rgb: { r: 255, g: 87, b: 51 }, count: 1000, wallScore: 0.8 }]
        },
        {
          hex: '#33FF57',
          rgb: { r: 51, g: 255, b: 87 },
          percentage: 28.2,
          position: { x: 300, y: 200 },
          wallScore: 0.3,
          isWall: false,
          variations: [{ key: '51-255-87', rgb: { r: 51, g: 255, b: 87 }, count: 800, wallScore: 0.3 }]
        },
        {
          hex: '#3357FF',
          rgb: { r: 51, g: 87, b: 255 },
          percentage: 20.1,
          position: { x: 500, y: 100 },
          wallScore: 0.7,
          isWall: true,
          variations: [{ key: '51-87-255', rgb: { r: 51, g: 87, b: 255 }, count: 600, wallScore: 0.7 }]
        },
        {
          hex: '#FFFF33',
          rgb: { r: 255, g: 255, b: 51 },
          percentage: 16.2,
          position: { x: 200, y: 300 },
          wallScore: 0.2,
          isWall: false,
          variations: [{ key: '255-255-51', rgb: { r: 255, g: 255, b: 51 }, count: 500, wallScore: 0.2 }]
        },
      ];
    }
  }

  private calculateWallScore(pixels: Array<{x: number, y: number, r: number, g: number, b: number}>, width: number, height: number): number {
    if (pixels.length === 0) return 0;
    
    let wallScore = 0;
    const totalPixels = pixels.length;
    
    // 1. Análise de posição - paredes geralmente estão nas laterais e topo
    const topPixels = pixels.filter(p => p.y < height * 0.3).length;
    const sidePixels = pixels.filter(p => p.x < width * 0.2 || p.x > width * 0.8).length;
    const centerPixels = pixels.filter(p => p.x > width * 0.3 && p.x < width * 0.7 && p.y > height * 0.4).length;
    
    // Paredes tendem a estar no topo e laterais, não no centro inferior
    wallScore += (topPixels / totalPixels) * 0.4; // 40% do score vem da posição superior
    wallScore += (sidePixels / totalPixels) * 0.3; // 30% do score vem das laterais
    wallScore -= (centerPixels / totalPixels) * 0.2; // Penalizar pixels no centro inferior (chão)
    
    // 2. Análise de cor - paredes tendem a ter cores mais uniformes
    const avgR = pixels.reduce((sum, p) => sum + p.r, 0) / totalPixels;
    const avgG = pixels.reduce((sum, p) => sum + p.g, 0) / totalPixels;
    const avgB = pixels.reduce((sum, p) => sum + p.b, 0) / totalPixels;
    
    // Calcular variância da cor
    const variance = pixels.reduce((sum, p) => {
      const distance = Math.sqrt(
        Math.pow(p.r - avgR, 2) + 
        Math.pow(p.g - avgG, 2) + 
        Math.pow(p.b - avgB, 2)
      );
      return sum + distance;
    }, 0) / totalPixels;
    
    // Cores mais uniformes (menor variância) são mais prováveis de serem paredes
    const uniformityScore = Math.max(0, 1 - (variance / 100)); // Normalizar variância
    wallScore += uniformityScore * 0.3; // 30% do score vem da uniformidade da cor
    
    // 3. Análise de brilho - reflexos tendem a ser mais brilhantes
    const avgBrightness = (avgR + avgG + avgB) / 3;
    const brightnessScore = avgBrightness < 200 ? 0.1 : 0; // Penalizar cores muito brilhantes (reflexos)
    wallScore += brightnessScore;
    
    return Math.max(0, Math.min(1, wallScore)); // Garantir que o score esteja entre 0 e 1
  }

  private groupSimilarColors(colorEntries: Array<[string, any]>): Array<Array<[string, any]>> {
    const groups: Array<Array<[string, any]>> = [];
    const used = new Set<string>();
    
    for (const [key, value] of colorEntries) {
      if (used.has(key)) continue;
      
      const group: Array<[string, any]> = [[key, value]];
      used.add(key);
      
      // Encontrar cores similares com múltiplas estratégias
      for (const [otherKey, otherValue] of colorEntries) {
        if (used.has(otherKey)) continue;
        
        // 1. Distância euclidiana padrão
        const euclideanDistance = Math.sqrt(
          Math.pow(value.r - otherValue.r, 2) +
          Math.pow(value.g - otherValue.g, 2) +
          Math.pow(value.b - otherValue.b, 2)
        );
        
        // 2. Distância de brilho (para capturar variações de iluminação)
        const brightnessDistance = Math.abs(
          (value.r + value.g + value.b) / 3 - (otherValue.r + otherValue.g + otherValue.b) / 3
        );
        
        // 3. Distância de saturação (para capturar variações de intensidade)
        const saturation1 = Math.max(value.r, value.g, value.b) - Math.min(value.r, value.g, value.b);
        const saturation2 = Math.max(otherValue.r, otherValue.g, otherValue.b) - Math.min(otherValue.r, otherValue.g, otherValue.b);
        const saturationDistance = Math.abs(saturation1 - saturation2);
        
        // 4. Distância de matiz (para capturar variações de cor)
        const hue1 = this.rgbToHue(value.r, value.g, value.b);
        const hue2 = this.rgbToHue(otherValue.r, otherValue.g, otherValue.b);
        const hueDistance = Math.min(Math.abs(hue1 - hue2), 360 - Math.abs(hue1 - hue2));
        
        // Critérios mais flexíveis para agrupar cores similares
        const isSimilar = 
          euclideanDistance < 80 || // Tolerância maior para distância euclidiana
          (euclideanDistance < 120 && brightnessDistance < 40) || // Cores próximas com brilho similar
          (euclideanDistance < 100 && saturationDistance < 30) || // Cores próximas com saturação similar
          (euclideanDistance < 90 && hueDistance < 20); // Cores próximas com matiz similar
        
        if (isSimilar) {
          group.push([otherKey, otherValue]);
          used.add(otherKey);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }

  private rgbToHue(r: number, g: number, b: number): number {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    if (diff === 0) return 0;
    
    let hue = 0;
    if (max === r) {
      hue = ((g - b) / diff) % 6;
    } else if (max === g) {
      hue = (b - r) / diff + 2;
    } else {
      hue = (r - g) / diff + 4;
    }
    
    return Math.round(hue * 60);
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
      reason: `Cor similar à ${product.colorName || 'cor do produto'}`,
    }));
  }

  private async replaceColor(
    inputPath: string,
    outputPath: string,
    targetColor: string,
    newColor: string,
    colorVariations?: any[],
    tolerance: number = 80,
  ): Promise<void> {
    try {
      // Converter cores hex para RGB
      const targetRgb = this.hexToRgb(targetColor);
      const newRgb = this.hexToRgb(newColor);
      
      if (!targetRgb || !newRgb) {
        throw new Error('Cores inválidas');
      }

      console.log('🎯 Iniciando substituição inteligente de cores...');
      console.log('🎨 Cor alvo:', targetColor, targetRgb);
      console.log('🆕 Nova cor:', newColor, newRgb);
      console.log('📊 Variações disponíveis:', colorVariations?.length || 0);

      // Processar imagem com Sharp
      const image = sharp(inputPath);
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
      
      let pixelsChanged = 0;
      const totalPixels = data.length / 3;
      
      // Aplicar substituição de cor pixel por pixel com algoritmo inteligente
      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        let shouldReplace = false;
        let replacementFactor = 0;
        
        if (colorVariations && colorVariations.length > 0) {
          // Usar variações agrupadas para substituição mais inteligente
          for (const variation of colorVariations) {
            // VERIFICAÇÃO CRÍTICA: Só substituir se for cor de parede
            if (variation.wallScore < 0.5) {
              continue; // Pular cores que não são de parede (reflexos, chão, etc.)
            }
            
            const euclideanDistance = Math.sqrt(
              Math.pow(r - variation.rgb.r, 2) + 
              Math.pow(g - variation.rgb.g, 2) + 
              Math.pow(b - variation.rgb.b, 2)
            );
            
            // Calcular distância de brilho
            const brightnessDistance = Math.abs(
              (r + g + b) / 3 - (variation.rgb.r + variation.rgb.g + variation.rgb.b) / 3
            );
            
            // Calcular distância de matiz
            const hue1 = this.rgbToHue(r, g, b);
            const hue2 = this.rgbToHue(variation.rgb.r, variation.rgb.g, variation.rgb.b);
            const hueDistance = Math.min(Math.abs(hue1 - hue2), 360 - Math.abs(hue1 - hue2));
            
            // Critérios mais flexíveis para substituição usando tolerância configurável
            const baseTolerance = tolerance;
            const isMatch = 
              euclideanDistance < baseTolerance || // Tolerância configurável para distância euclidiana
              (euclideanDistance < baseTolerance * 1.5 && brightnessDistance < baseTolerance * 0.5) || // Cores próximas com brilho similar
              (euclideanDistance < baseTolerance * 1.2 && hueDistance < baseTolerance * 0.3); // Cores próximas com matiz similar
            
            if (isMatch) {
              shouldReplace = true;
              // Usar o melhor fator de substituição baseado na menor distância
              const factor = Math.max(
                1 - (euclideanDistance / baseTolerance),
                1 - (brightnessDistance / (baseTolerance * 0.5)),
                1 - (hueDistance / (baseTolerance * 0.3))
              );
              replacementFactor = Math.max(replacementFactor, Math.min(1, factor));
              break;
            }
          }
        } else {
          // Fallback para método original com tolerância maior
          const euclideanDistance = Math.sqrt(
            Math.pow(r - targetRgb.r, 2) + 
            Math.pow(g - targetRgb.g, 2) + 
            Math.pow(b - targetRgb.b, 2)
          );
          
          const brightnessDistance = Math.abs(
            (r + g + b) / 3 - (targetRgb.r + targetRgb.g + targetRgb.b) / 3
          );
          
          if (euclideanDistance < tolerance || (euclideanDistance < tolerance * 1.5 && brightnessDistance < tolerance * 0.5)) {
            shouldReplace = true;
            replacementFactor = Math.max(
              1 - (euclideanDistance / tolerance),
              1 - (brightnessDistance / (tolerance * 0.5))
            );
          }
        }
        
        if (shouldReplace) {
          // Aplicar substituição com transição suave e preservação de brilho
          const originalBrightness = (r + g + b) / 3;
          const newBrightness = (newRgb.r + newRgb.g + newRgb.b) / 3;
          const brightnessRatio = originalBrightness / newBrightness;
          
          // Ajustar a nova cor para manter o brilho original
          const adjustedNewR = Math.min(255, Math.max(0, newRgb.r * brightnessRatio));
          const adjustedNewG = Math.min(255, Math.max(0, newRgb.g * brightnessRatio));
          const adjustedNewB = Math.min(255, Math.max(0, newRgb.b * brightnessRatio));
          
          data[i] = Math.round(r + (adjustedNewR - r) * replacementFactor);
          data[i + 1] = Math.round(g + (adjustedNewG - g) * replacementFactor);
          data[i + 2] = Math.round(b + (adjustedNewB - b) * replacementFactor);
          
          pixelsChanged++;
        }
      }
      
      console.log(`✅ Substituição concluída: ${pixelsChanged} pixels alterados de ${totalPixels} total`);
      console.log(`📊 Taxa de substituição: ${((pixelsChanged / totalPixels) * 100).toFixed(2)}%`);
      
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
      console.error('❌ Erro na substituição de cores:', error);
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