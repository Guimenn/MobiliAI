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

      const prompt = `Analise esta imagem e identifique as 6 cores dominantes. Você DEVE analisar a imagem e retornar cores reais.

Para cada cor, forneça:
- hex: código hexadecimal
- rgb: valores RGB
- percentage: porcentagem da cor na imagem
- position: coordenadas x,y

OBRIGATÓRIO: Retorne APENAS JSON válido, sem texto adicional:

[
  {
    "hex": "#FF5733",
    "rgb": {"r": 255, "g": 87, "b": 51},
    "percentage": 35.5,
    "position": {"x": 100, "y": 150}
  }
]

NÃO retorne array vazio. Analise a imagem e forneça cores reais.`;

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

      console.log('💬 Conteúdo da resposta:', content);

      // Verificar se a IA não conseguiu analisar a imagem
      if (content.toLowerCase().includes('unable to provide') || 
          content.toLowerCase().includes('cannot analyze') ||
          content.toLowerCase().includes('unable to analyze') ||
          content.toLowerCase().includes('i cannot') ||
          content.toLowerCase().includes('i\'m unable')) {
        console.log('⚠️ IA não conseguiu analisar a imagem, usando cores padrão');
        return this.getFallbackColors();
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
        if (Array.isArray(colors) && colors.length > 0) {
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
          console.log('⚠️ Array vazio ou inválido, tentando análise alternativa...');
          
          // Tentar com prompt mais simples
          try {
            const simplePrompt = `Identifique as cores principais desta imagem. Retorne JSON com hex, rgb, percentage e position para cada cor.`;
            
            const simpleResponse = await this.openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: simplePrompt,
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
              max_tokens: 500,
            });
            
            const simpleContent = simpleResponse.choices[0]?.message?.content;
            if (simpleContent) {
              console.log('🔄 Tentativa alternativa:', simpleContent);
              
              // Tentar extrair JSON da resposta
              const jsonMatch = simpleContent.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                const alternativeColors = JSON.parse(jsonMatch[0]);
                if (Array.isArray(alternativeColors) && alternativeColors.length > 0) {
                  console.log('✅ Análise alternativa bem-sucedida:', alternativeColors);
                  return alternativeColors;
                }
              }
            }
          } catch (altError) {
            console.log('⚠️ Análise alternativa falhou:', altError.message);
          }
          
          console.log('⚠️ Usando cores padrão como fallback final');
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
      let tolerance = 80; // Tolerância maior para capturar variações de iluminação
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

  private getFallbackColors(): any[] {
    return [
      {
        hex: '#F5F5F5',
        rgb: { r: 245, g: 245, b: 245 },
        percentage: 25.0,
        position: { x: 200, y: 150 },
        wallScore: 0.8,
        isWall: true,
        variations: [
          {
            key: '245-245-245',
            rgb: { r: 245, g: 245, b: 245 },
            count: 1000,
            wallScore: 0.8
          }
        ]
      },
      {
        hex: '#E8E8E8',
        rgb: { r: 232, g: 232, b: 232 },
        percentage: 20.0,
        position: { x: 300, y: 200 },
        wallScore: 0.7,
        isWall: true,
        variations: [
          {
            key: '232-232-232',
            rgb: { r: 232, g: 232, b: 232 },
            count: 800,
            wallScore: 0.7
          }
        ]
      },
      {
        hex: '#D3D3D3',
        rgb: { r: 211, g: 211, b: 211 },
        percentage: 15.0,
        position: { x: 150, y: 100 },
        wallScore: 0.6,
        isWall: true,
        variations: [
          {
            key: '211-211-211',
            rgb: { r: 211, g: 211, b: 211 },
            count: 600,
            wallScore: 0.6
          }
        ]
      },
      {
        hex: '#BEBEBE',
        rgb: { r: 190, g: 190, b: 190 },
        percentage: 12.0,
        position: { x: 400, y: 250 },
        wallScore: 0.5,
        isWall: false,
        variations: [
          {
            key: '190-190-190',
            rgb: { r: 190, g: 190, b: 190 },
            count: 480,
            wallScore: 0.5
          }
        ]
      },
      {
        hex: '#A9A9A9',
        rgb: { r: 169, g: 169, b: 169 },
        percentage: 10.0,
        position: { x: 350, y: 300 },
        wallScore: 0.4,
        isWall: false,
        variations: [
          {
            key: '169-169-169',
            rgb: { r: 169, g: 169, b: 169 },
            count: 400,
            wallScore: 0.4
          }
        ]
      },
      {
        hex: '#808080',
        rgb: { r: 128, g: 128, b: 128 },
        percentage: 8.0,
        position: { x: 250, y: 350 },
        wallScore: 0.3,
        isWall: false,
        variations: [
          {
            key: '128-128-128',
            rgb: { r: 128, g: 128, b: 128 },
            count: 320,
            wallScore: 0.3
          }
        ]
      }
    ];
  }

  async performDALLE3Inpainting(
    imageBuffer: Buffer,
    maskBuffer: Buffer,
    targetColor: string,
    newColor: string,
  ): Promise<Buffer> {
    try {
      console.log('🎭 DALL-E 3: Executando inpainting com máscara de parede...');
      
      // Redimensionar imagem se necessário (limite de 16KB) e converter para PNG
      const sharp = require('sharp');
      let processedImageBuffer = imageBuffer;
      
      if (imageBuffer.length > 16384) {
        console.log('📏 Imagem muito grande, redimensionando...');
        processedImageBuffer = await sharp(imageBuffer)
          .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
          .png({ quality: 80 })
          .toBuffer();
        
        console.log('📊 Tamanho original:', imageBuffer.length, 'bytes');
        console.log('📊 Tamanho redimensionado:', processedImageBuffer.length, 'bytes');
      } else {
        // Converter para PNG mesmo se não precisar redimensionar
        processedImageBuffer = await sharp(imageBuffer)
          .png()
          .toBuffer();
      }
      
      // Redimensionar máscara também
      let processedMaskBuffer = maskBuffer;
      if (maskBuffer.length > 16384) {
        console.log('📏 Máscara muito grande, redimensionando...');
        processedMaskBuffer = await sharp(maskBuffer)
          .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
          .png()
          .toBuffer();
      }
      
      // Criar prompt específico para inpainting de parede
      const prompt = this.createWallInpaintingPrompt(targetColor, newColor);
      
      console.log('📝 Prompt de inpainting:', prompt);
      
      // Salvar arquivos temporários para DALL-E
      const fs = require('fs');
      const path = require('path');
      const tempDir = path.join(process.cwd(), 'temp');
      
      const tempImagePath = path.join(tempDir, `dalle_image_${Date.now()}.png`);
      const tempMaskPath = path.join(tempDir, `dalle_mask_${Date.now()}.png`);
      
      fs.writeFileSync(tempImagePath, processedImageBuffer);
      fs.writeFileSync(tempMaskPath, processedMaskBuffer);
      
      console.log('💾 Arquivos temporários salvos para DALL-E');
      
      // Chamar DALL-E 2 inpainting (mais estável)
      const response = await this.openai.images.edit({
        image: fs.createReadStream(tempImagePath),
        mask: fs.createReadStream(tempMaskPath),
        prompt: prompt,
        n: 1,
        size: '1024x1024'
      });
      
      // Limpar arquivos temporários
      try {
        fs.unlinkSync(tempImagePath);
        fs.unlinkSync(tempMaskPath);
        console.log('🗑️ Arquivos temporários do DALL-E removidos');
      } catch (cleanupError) {
        console.warn('⚠️ Erro ao remover arquivos temporários:', cleanupError);
      }
      
      if (response.data && response.data[0]) {
        console.log('✅ DALL-E 3 Inpainting: Parede editada com sucesso');
        
        // Verificar se tem b64_json ou url
        if (response.data[0].b64_json) {
          return Buffer.from(response.data[0].b64_json, 'base64');
        } else if (response.data[0].url) {
          // Se retornar URL, fazer download da imagem
          const imageResponse = await fetch(response.data[0].url);
          const imageBuffer = await imageResponse.arrayBuffer();
          return Buffer.from(imageBuffer);
        } else {
          throw new Error('Formato de resposta inesperado do DALL-E 3');
        }
      } else {
        throw new Error('Resposta inesperada do DALL-E 3');
      }
      
    } catch (error) {
      console.error('❌ Erro no DALL-E 3 inpainting:', error);
      throw error;
    }
  }

  private createWallInpaintingPrompt(targetColor: string, newColor: string): string {
    return `Troque a cor da parede de ${targetColor} para ${newColor}. 
    Apenas mude a superfície da parede, mantenha todos os outros elementos inalterados incluindo reflexos no chão, móveis e objetos. 
    Mantenha as mesmas condições de iluminação e sombras. 
    A nova cor da parede deve ser ${newColor} e parecer natural e realista. 
    Não altere nenhum reflexo no chão ou outras superfícies. 
    Foque APENAS na parede, ignore pisos, tetos e objetos.`;
  }

  async generateWallMask(
    imageBuffer: Buffer,
    targetColor: string,
    tolerance: number = 80,
  ): Promise<Buffer> {
    try {
      console.log('🎭 Gerando máscara inteligente de parede para inpainting...');
      
      const sharp = require('sharp');
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      // Converter cor alvo para RGB
      const targetRgb = this.hexToRgb(targetColor);
      if (!targetRgb) {
        throw new Error('Cor alvo inválida');
      }
      
      // Criar máscara inteligente (imagem em escala de cinza onde branco = área a ser editada)
      const maskData = Buffer.alloc(data.length);
      
      for (let i = 0; i < data.length; i += 3) {
        const pixelIndex = i / 3;
        const x = pixelIndex % info.width;
        const y = Math.floor(pixelIndex / info.width);
        
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calcular distância da cor alvo
        const distance = Math.sqrt(
          Math.pow(r - targetRgb.r, 2) + 
          Math.pow(g - targetRgb.g, 2) + 
          Math.pow(b - targetRgb.b, 2)
        );
        
        // Calcular score de parede baseado na posição
        const wallScore = this.calculateWallScoreForMask(x, y, info.width, info.height);
        
        // Se a cor está dentro da tolerância E tem score de parede alto, marcar como área a ser editada
        const isColorMatch = distance < tolerance;
        const isWallArea = wallScore > 0.6;
        
        const maskValue = (isColorMatch && isWallArea) ? 255 : 0;
        
        maskData[i] = maskValue;     // R
        maskData[i + 1] = maskValue; // G
        maskData[i + 2] = maskValue; // B
      }
      
      // Converter máscara para PNG
      const maskBuffer = await sharp(maskData, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 3,
        },
      })
        .png()
        .toBuffer();
      
      console.log('✅ Máscara inteligente de parede gerada com sucesso');
      return maskBuffer;
      
    } catch (error) {
      console.error('❌ Erro ao gerar máscara:', error);
      throw error;
    }
  }

  private calculateWallScoreForMask(x: number, y: number, width: number, height: number): number {
    // Normalizar coordenadas (0-1)
    const normalizedX = x / width;
    const normalizedY = y / height;
    
    // Score baseado na posição (paredes geralmente estão nas laterais e topo)
    let positionScore = 0;
    
    // Paredes laterais (esquerda e direita)
    if (normalizedX < 0.2 || normalizedX > 0.8) {
      positionScore += 0.4;
    }
    
    // Parede superior
    if (normalizedY < 0.3) {
      positionScore += 0.3;
    }
    
    // Penalizar área central inferior (geralmente é chão)
    if (normalizedX > 0.3 && normalizedX < 0.7 && normalizedY > 0.7) {
      positionScore -= 0.5;
    }
    
    // Score final (0-1)
    return Math.max(0, Math.min(1, positionScore));
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