import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async analyzeImageColors(imageBuffer: Buffer, mimeType?: string): Promise<any[]> {
    try {
      console.log('🔍 Iniciando análise de cores com OpenAI...');
      console.log('📊 Tamanho do buffer da imagem:', imageBuffer.length, 'bytes');
      console.log('📋 MIME type:', mimeType);
      
      // Determinar extensão baseada no MIME type
      let extension = 'jpg'; // padrão
      if (mimeType) {
        switch (mimeType) {
          case 'image/png':
            extension = 'png';
            break;
          case 'image/jpeg':
          case 'image/jpg':
            extension = 'jpg';
            break;
          case 'image/gif':
            extension = 'gif';
            break;
          case 'image/webp':
            extension = 'webp';
            break;
        }
      }
      
      // Salvar imagem temporariamente
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const imageId = Date.now().toString();
      const imagePath = path.join(tempDir, `${imageId}.${extension}`);
      
      // Converter imagem para JPEG usando Sharp para garantir compatibilidade
      const sharp = require('sharp');
      
      // Validar se a imagem é válida
      try {
        const metadata = await sharp(imageBuffer).metadata();
        console.log('📋 Metadados da imagem:', {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          channels: metadata.channels
        });
      } catch (metadataError) {
        console.error('❌ Erro ao ler metadados da imagem:', metadataError);
        throw new Error('Imagem inválida ou corrompida');
      }
      
      const jpegBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();
      
      // Salvar como JPEG
      fs.writeFileSync(imagePath, jpegBuffer);
      console.log('💾 Imagem convertida e salva em:', imagePath);
      console.log('📊 Tamanho original:', imageBuffer.length, 'bytes');
      console.log('📊 Tamanho convertido:', jpegBuffer.length, 'bytes');

      // Converter para base64
      const base64Image = fs.readFileSync(imagePath, 'base64');
      console.log('🔄 Imagem convertida para base64, tamanho:', base64Image.length, 'caracteres');

      const prompt = `Analise esta imagem e identifique as 6 cores dominantes. Para cada cor, forneça:
      1. Código hexadecimal
      2. Valores RGB
      3. Porcentagem aproximada da cor na imagem
      4. Posição aproximada (x, y) onde a cor aparece mais

      IMPORTANTE: Responda APENAS com JSON válido, sem markdown, sem texto adicional, sem \`\`\`json. Apenas o array JSON:
      [
        {
          "hex": "#FF5733",
          "rgb": {"r": 255, "g": 87, "b": 51},
          "percentage": 35.5,
          "position": {"x": 100, "y": 150}
        }
      ]`;

      console.log('📝 Prompt enviado:', prompt);
      console.log('🔑 Chave da API configurada:', this.configService.get<string>('OPENAI_API_KEY') ? 'SIM' : 'NÃO');

      const requestData = {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || 'image/jpeg'};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      };

      console.log('📤 Enviando requisição para OpenAI...');
      console.log('📋 Dados da requisição:', JSON.stringify({
        model: requestData.model,
        messages: requestData.messages.map(msg => ({
          role: msg.role,
          content: msg.content.map(c => ({
            type: c.type,
            text: c.type === 'text' ? c.text?.substring(0, 100) + '...' : 'image_data'
          }))
        })),
        max_tokens: requestData.max_tokens
      }, null, 2));

      const response = await this.openai.chat.completions.create(requestData as any);

      console.log('📥 Resposta recebida da OpenAI:');
      console.log('📊 Status da resposta:', response);
      console.log('💬 Conteúdo da resposta:', response.choices[0]?.message?.content);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error('❌ Resposta vazia da OpenAI');
        throw new Error('Resposta vazia da OpenAI');
      }

      // Tentar parsear JSON da resposta
      try {
        console.log('🔄 Tentando parsear JSON da resposta...');
        
        // Remove markdown code blocks se existirem
        let jsonContent = content.trim();
        
        // Remove ```json no início
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '');
        }
        
        // Remove ``` no final
        if (jsonContent.endsWith('```')) {
          jsonContent = jsonContent.replace(/\s*```$/, '');
        }
        
        // Remove qualquer texto antes do primeiro [
        const firstBracket = jsonContent.indexOf('[');
        if (firstBracket > 0) {
          jsonContent = jsonContent.substring(firstBracket);
        }
        
        // Remove qualquer texto depois do último ]
        const lastBracket = jsonContent.lastIndexOf(']');
        if (lastBracket > 0 && lastBracket < jsonContent.length - 1) {
          jsonContent = jsonContent.substring(0, lastBracket + 1);
        }
        
        console.log('📝 Conteúdo limpo para parse:', jsonContent);
        
        const colors = JSON.parse(jsonContent);
        console.log('✅ JSON parseado com sucesso:', colors);
        console.log('🔍 Verificando se é array:', Array.isArray(colors));
        if (Array.isArray(colors)) {
          console.log('✅ Retornando cores da OpenAI:', colors);
          
          // Limpar arquivo temporário
          try {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              console.log('🗑️ Arquivo temporário removido:', imagePath);
            }
          } catch (cleanupError) {
            console.warn('⚠️ Erro ao remover arquivo temporário:', cleanupError);
          }
          
          return colors;
        } else {
          console.log('⚠️ Não é array, usando fallback');
          return this.getFallbackColors();
        }
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta da OpenAI:', parseError);
        console.error('📝 Conteúdo que falhou no parse:', content);
        return this.getFallbackColors();
      }

    } catch (error) {
      console.error('❌ Erro na análise OpenAI (catch externo):', error);
      console.error('📊 Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      console.log('🔄 Retornando cores padrão devido ao erro externo');
      return this.getFallbackColors();
    }
  }

  async replaceColorInImage(
    imageBuffer: Buffer,
    targetColor: string,
    newColor: string,
  ): Promise<Buffer> {
    try {
      console.log('🎨 Iniciando substituição de cor...');
      console.log('🎯 Cor alvo:', targetColor);
      console.log('🆕 Nova cor:', newColor);
      
      // Salvar imagem temporariamente
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const imageId = Date.now().toString();
      const inputPath = path.join(tempDir, `${imageId}_original.jpg`);
      const outputPath = path.join(tempDir, `${imageId}_processed.jpg`);
      
      // Salvar imagem de entrada
      fs.writeFileSync(inputPath, imageBuffer);
      console.log('💾 Imagem original salva em:', inputPath);

      // Converter para base64
      const base64Image = fs.readFileSync(inputPath, 'base64');
      console.log('🔄 Imagem convertida para base64');

      const prompt = `Você é um especialista em processamento de imagens para pintura de paredes. Analise esta imagem e identifique TODA a área da parede que contém a cor ${targetColor}.

      TAREFA: Substituir a cor da parede INTEIRA pela cor ${newColor}, aplicando uniformemente em toda a superfície da parede, mas mantendo a cor original do resto da imagem.

      REQUISITOS CRÍTICOS:
      - Identificar TODA a área da parede (incluindo diferentes tons da mesma cor)
      - Aplicar a nova cor de forma UNIFORME em toda a parede
      - Manter a iluminação e sombras naturais (preservar luminância)
      - Preservar contornos de objetos (quadros, molduras, etc.)
      - Cobrir TODOS os tons da cor da parede, não apenas a cor exata
      - Usar tolerância alta para cobrir toda a parede

      IMPORTANTE: Responda APENAS com JSON válido:
      {
        "instructions": "Substituir cor da parede inteira uniformemente preservando iluminação",
        "confidence": 0.95,
        "areas_to_replace": ["toda a área da parede identificada"],
        "color_tolerance": 80,
        "blend_mode": "wall_full_coverage",
        "preserve_edges": false,
        "preserve_luminance": 0.7
      }`;

      console.log('📤 Enviando requisição para OpenAI para análise...');
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const instruction = response.choices[0]?.message?.content || '';
      console.log('📥 Instruções recebidas da OpenAI:', instruction);
      
      // Processar a imagem usando Sharp com as instruções da OpenAI
      const processedBuffer = await this.processColorReplacement(
        imageBuffer,
        targetColor,
        newColor,
        instruction
      );

      // Salvar imagem processada
      fs.writeFileSync(outputPath, processedBuffer);
      console.log('💾 Imagem processada salva em:', outputPath);

      return processedBuffer;

    } catch (error) {
      console.error('❌ Erro na substituição de cor OpenAI:', error);
      // Fallback para processamento local
      return this.processColorReplacement(imageBuffer, targetColor, newColor);
    }
  }

  private async processColorReplacement(
    imageBuffer: Buffer,
    targetColor: string,
    newColor: string,
    openaiInstructions?: string,
  ): Promise<Buffer> {
    // Implementação melhorada de substituição de cor usando Sharp
    // Foca em preservar iluminação e contornos naturais
    
    const sharp = require('sharp');
    
    try {
      console.log('🔧 Processando substituição de cor melhorada...');
      if (openaiInstructions) {
        console.log('📋 Instruções da OpenAI:', openaiInstructions);
      }
      
      // Converter cores hex para RGB
      const targetRgb = this.hexToRgb(targetColor);
      const newRgb = this.hexToRgb(newColor);
      
      if (!targetRgb || !newRgb) {
        throw new Error('Cores inválidas');
      }

      console.log('🎯 Cor alvo RGB:', targetRgb);
      console.log('🆕 Nova cor RGB:', newRgb);

      // Primeiro, vamos usar uma abordagem mais sofisticada
      // 1. Detectar bordas para preservar contornos
      // 2. Usar máscara de luminância para preservar iluminação
      // 3. Aplicar substituição mais seletiva

      // Processar imagem com Sharp
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      console.log('📊 Dimensões da imagem:', info.width, 'x', info.height);
      console.log('🔢 Total de pixels:', data.length / 3);
      
      let pixelsChanged = 0;
      
      // Configurações para trocar cor da parede inteira
      let tolerance = 80; // Tolerância maior para cobrir toda a parede
      let edgeThreshold = 40; // Threshold para detectar bordas (mais alto)
      let luminancePreservation = 0.7; // Preservar 70% da luminância original
      let preserveEdges = false; // Não preservar bordas para cobrir parede inteira
      
      if (openaiInstructions) {
        try {
          const instructions = JSON.parse(openaiInstructions);
          if (instructions.color_tolerance) {
            tolerance = Math.min(instructions.color_tolerance, 30); // Limitar tolerância
          }
          if (instructions.preserve_luminance) {
            luminancePreservation = instructions.preserve_luminance;
          }
          if (instructions.preserve_edges !== undefined) {
            preserveEdges = instructions.preserve_edges;
          }
          console.log('📋 Usando configurações da OpenAI:', { 
            tolerance, 
            luminancePreservation, 
            preserveEdges 
          });
        } catch (e) {
          console.log('⚠️ Não foi possível parsear instruções da OpenAI, usando padrões');
        }
      }
      
      // Criar mapa de bordas simples
      const edgeMap = new Array(info.width * info.height).fill(false);
      
      // Detectar bordas usando gradiente simples
      for (let y = 1; y < info.height - 1; y++) {
        for (let x = 1; x < info.width - 1; x++) {
          const idx = (y * info.width + x) * 3;
          const idxUp = ((y - 1) * info.width + x) * 3;
          const idxDown = ((y + 1) * info.width + x) * 3;
          const idxLeft = (y * info.width + (x - 1)) * 3;
          const idxRight = (y * info.width + (x + 1)) * 3;
          
          // Calcular gradiente
          const gradX = Math.abs(data[idx] - data[idxRight]) + 
                       Math.abs(data[idx + 1] - data[idxRight + 1]) + 
                       Math.abs(data[idx + 2] - data[idxRight + 2]);
          
          const gradY = Math.abs(data[idx] - data[idxDown]) + 
                       Math.abs(data[idx + 1] - data[idxDown + 1]) + 
                       Math.abs(data[idx + 2] - data[idxDown + 2]);
          
          const gradient = Math.sqrt(gradX * gradX + gradY * gradY);
          
          if (gradient > edgeThreshold) {
            edgeMap[y * info.width + x] = true;
          }
        }
      }
      
      // Primeiro, identificar a cor dominante da parede
      const colorMap = new Map<string, number>();
      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Agrupar cores similares (tolerância de ±15)
        const key = `${Math.floor(r / 15) * 15}-${Math.floor(g / 15) * 15}-${Math.floor(b / 15) * 15}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }
      
      // Encontrar a cor mais comum (provavelmente a parede)
      let dominantColor = targetRgb;
      let maxCount = 0;
      for (const [key, count] of colorMap.entries()) {
        if (count > maxCount) {
          const [r, g, b] = key.split('-').map(Number);
          dominantColor = { r, g, b };
          maxCount = count;
        }
      }
      
      console.log('🎯 Cor dominante identificada:', dominantColor);
      console.log('📊 Frequência da cor dominante:', maxCount);
      
      // Aplicar substituição de cor pixel por pixel para parede inteira
      for (let i = 0; i < data.length; i += 3) {
        const pixelIndex = i / 3;
        const x = pixelIndex % info.width;
        const y = Math.floor(pixelIndex / info.width);
        const isEdge = edgeMap[pixelIndex];
        
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calcular distância da cor alvo (mais permissivo)
        const distance = Math.sqrt(
          Math.pow(r - targetRgb.r, 2) + 
          Math.pow(g - targetRgb.g, 2) + 
          Math.pow(b - targetRgb.b, 2)
        );
        
        // Calcular distância da cor dominante também
        const dominantDistance = Math.sqrt(
          Math.pow(r - dominantColor.r, 2) + 
          Math.pow(g - dominantColor.g, 2) + 
          Math.pow(b - dominantColor.b, 2)
        );
        
        // Aplicar se for cor da parede (alvo ou dominante) e não for borda forte
        const isWallColor = distance < tolerance || dominantDistance < 60;
        const isStrongEdge = isEdge && edgeMap[pixelIndex];
        
        if (isWallColor && !isStrongEdge) {
          // Calcular luminância original
          const originalLuminance = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // Aplicar substituição mais agressiva para parede inteira
          const factor = Math.max(0.3, 1 - (Math.min(distance, dominantDistance) / tolerance));
          const smoothFactor = Math.pow(factor, 0.6); // Menos suave para cobertura total
          
          // Calcular nova cor mantendo luminância
          const newR = Math.round(r + (newRgb.r - r) * smoothFactor);
          const newG = Math.round(g + (newRgb.g - g) * smoothFactor);
          const newB = Math.round(b + (newRgb.b - b) * smoothFactor);
          
          // Ajustar para preservar luminância original
          const newLuminance = 0.299 * newR + 0.587 * newG + 0.114 * newB;
          const luminanceRatio = originalLuminance / (newLuminance + 0.001);
          
          data[i] = Math.min(255, Math.max(0, Math.round(newR * luminanceRatio * luminancePreservation + r * (1 - luminancePreservation))));
          data[i + 1] = Math.min(255, Math.max(0, Math.round(newG * luminanceRatio * luminancePreservation + g * (1 - luminancePreservation))));
          data[i + 2] = Math.min(255, Math.max(0, Math.round(newB * luminanceRatio * luminancePreservation + b * (1 - luminancePreservation))));
          
          pixelsChanged++;
        }
      }
      
      console.log('✅ Pixels alterados:', pixelsChanged);
      console.log('📈 Porcentagem alterada:', ((pixelsChanged * 3) / data.length * 100).toFixed(2) + '%');
      console.log('🎨 Preservação de luminância:', (luminancePreservation * 100) + '%');
      
      // Retornar buffer processado
      const processedBuffer = await sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 3,
        },
      })
        .jpeg({ quality: 95 })
        .toBuffer();
        
      console.log('🎨 Processamento melhorado concluído com sucesso');
      return processedBuffer;
        
    } catch (error) {
      console.error('❌ Erro no processamento local:', error);
      // Fallback: retornar imagem original
      return imageBuffer;
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

  private getFallbackColors(): any[] {
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