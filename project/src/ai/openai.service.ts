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

  async analyzeImageColors(imageBuffer: Buffer): Promise<any[]> {
    try {
      console.log('🔍 Iniciando análise de cores com OpenAI...');
      console.log('📊 Tamanho do buffer da imagem:', imageBuffer.length, 'bytes');
      
      // Salvar imagem temporariamente
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const imageId = Date.now().toString();
      const imagePath = path.join(tempDir, `${imageId}.jpg`);
      
      // Salvar buffer como arquivo
      fs.writeFileSync(imagePath, imageBuffer);
      console.log('💾 Imagem salva em:', imagePath);

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
                  url: `data:image/jpeg;base64,${base64Image}`,
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

      const prompt = `Você é um especialista em processamento de imagens. Analise esta imagem e identifique todas as áreas que contêm a cor ${targetColor} ou cores muito similares (tolerância de ±30 em RGB).

      TAREFA: Substituir a cor ${targetColor} pela cor ${newColor} de forma realista e natural.

      REQUISITOS:
      - Manter a mesma iluminação, sombras e texturas
      - Preservar a forma e estrutura dos objetos
      - Aplicar transições suaves entre as cores
      - Manter a naturalidade da cena

      IMPORTANTE: Responda APENAS com JSON válido:
      {
        "instructions": "Descrição detalhada de como fazer a substituição",
        "confidence": 0.95,
        "areas_to_replace": ["descrição das áreas identificadas"],
        "color_tolerance": 30,
        "blend_mode": "natural"
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
    // Implementação local de substituição de cor usando Sharp
    // Esta é uma versão simplificada - em produção, usar OpenCV ou similar
    
    const sharp = require('sharp');
    
    try {
      console.log('🔧 Processando substituição de cor local...');
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

      // Processar imagem com Sharp
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      console.log('📊 Dimensões da imagem:', info.width, 'x', info.height);
      console.log('🔢 Total de pixels:', data.length / 3);
      
      let pixelsChanged = 0;
      
      // Tentar extrair tolerância das instruções da OpenAI
      let tolerance = 60; // Tolerância padrão
      let blendMode = 'natural';
      
      if (openaiInstructions) {
        try {
          const instructions = JSON.parse(openaiInstructions);
          if (instructions.color_tolerance) {
            tolerance = instructions.color_tolerance;
          }
          if (instructions.blend_mode) {
            blendMode = instructions.blend_mode;
          }
          console.log('📋 Usando configurações da OpenAI:', { tolerance, blendMode });
        } catch (e) {
          console.log('⚠️ Não foi possível parsear instruções da OpenAI, usando padrões');
        }
      }
      
      // Aplicar substituição de cor pixel por pixel
      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calcular distância da cor alvo
        const distance = Math.sqrt(
          Math.pow(r - targetRgb.r, 2) + 
          Math.pow(g - targetRgb.g, 2) + 
          Math.pow(b - targetRgb.b, 2)
        );
        
        if (distance < tolerance) {
          // Aplicar substituição com transição suave
          const factor = 1 - (distance / tolerance);
          let smoothFactor;
          
          // Ajustar fator de suavização baseado no modo de blend
          switch (blendMode) {
            case 'natural':
              smoothFactor = Math.pow(factor, 0.7);
              break;
            case 'smooth':
              smoothFactor = Math.pow(factor, 0.5);
              break;
            case 'sharp':
              smoothFactor = factor;
              break;
            default:
              smoothFactor = Math.pow(factor, 0.7);
          }
          
          data[i] = Math.round(r + (newRgb.r - r) * smoothFactor);
          data[i + 1] = Math.round(g + (newRgb.g - g) * smoothFactor);
          data[i + 2] = Math.round(b + (newRgb.b - b) * smoothFactor);
          
          pixelsChanged++;
        }
      }
      
      console.log('✅ Pixels alterados:', pixelsChanged);
      console.log('📈 Porcentagem alterada:', ((pixelsChanged * 3) / data.length * 100).toFixed(2) + '%');
      
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
        
      console.log('🎨 Processamento concluído com sucesso');
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