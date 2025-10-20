import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.extractSupabaseUrl();
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY') || 'your-anon-key';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  private extractSupabaseUrl(): string {
    // Primeiro tenta pegar a URL diretamente do .env
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    if (supabaseUrl) {
      return supabaseUrl;
    }

    // Se não tiver, extrai da DATABASE_URL
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL ou SUPABASE_URL não configurada');
    }

    // Extrair URL do Supabase da DATABASE_URL
    // Formato: postgresql://postgres.PROJECT_ID:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
    const match = databaseUrl.match(/postgres\.([^:]+).*@([^:]+)/);
    if (!match) {
      throw new Error('Não foi possível extrair a URL do Supabase');
    }

    const projectId = match[1];
    return `https://${projectId}.supabase.co`;
  }

  async uploadProductImage(file: Express.Multer.File, productId: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo fornecido');
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não suportado. Use JPEG, PNG ou WebP');
    }

    // Validar tamanho (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo muito grande. Máximo 5MB');
    }

    try {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${productId}_${timestamp}.${fileExtension}`;

      // Upload para o bucket product-images
      const { data, error } = await this.supabase.storage
        .from('product-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        throw new BadRequestException(`Erro no upload: ${error.message}`);
      }

      // Obter URL pública da imagem
      const { data: publicUrlData } = this.supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      throw new BadRequestException(`Erro no upload: ${error.message}`);
    }
  }

  async uploadMultipleProductImages(files: Express.Multer.File[], productId: string): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo fornecido');
    }

    const uploadPromises = files.map(file => this.uploadProductImage(file, productId));
    return Promise.all(uploadPromises);
  }

  async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      // Extrair nome do arquivo da URL
      const fileName = imageUrl.split('/').pop();
      if (!fileName) {
        throw new BadRequestException('URL de imagem inválida');
      }

      const { error } = await this.supabase.storage
        .from('product-images')
        .remove([fileName]);

      if (error) {
        throw new BadRequestException(`Erro ao deletar imagem: ${error.message}`);
      }
    } catch (error) {
      throw new BadRequestException(`Erro ao deletar imagem: ${error.message}`);
    }
  }
}