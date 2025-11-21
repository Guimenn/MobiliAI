import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import ImageKit from 'imagekit';

@Injectable()
export class ImageKitService {
  private imagekit: ImageKit;
  private numericToProductIdCache: Map<string, string> | null = null;
  private cacheLoadPromise: Promise<void> | null = null;
  // Cache completo: productId -> array de URLs (MUITO RÁPIDO!)
  private imagesByProductCache: Map<string, string[]> | null = null;
  private imagesCacheLoadPromise: Promise<void> | null = null;
  private imagesCacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    const urlEndpoint = this.configService.get<string>('IMAGEKIT_URL_ENDPOINT');
    const publicKey = this.configService.get<string>('IMAGEKIT_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('IMAGEKIT_PRIVATE_KEY');

    if (!urlEndpoint || !publicKey || !privateKey) {
      console.warn('⚠️ [ImageKitService] ImageKit não configurado. Configure as variáveis de ambiente IMAGEKIT_URL_ENDPOINT, IMAGEKIT_PUBLIC_KEY e IMAGEKIT_PRIVATE_KEY');
    } else {
      this.imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
      });
    }
  }

  /**
   * Upload de imagem de produto
   */
  async uploadProductImage(
    file: Express.Multer.File,
    productId: string
  ): Promise<string> {
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

    if (!this.imagekit) {
      throw new BadRequestException('ImageKit não configurado');
    }

    try {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${productId}_${timestamp}.${fileExtension}`;

      // Upload para o ImageKit
      const result = await this.imagekit.upload({
        file: file.buffer,
        fileName: fileName,
        folder: '/FotoMovel',
        useUniqueFileName: true,
        tags: [`product-${productId}`],
      });

      // Invalidar cache para forçar recarregamento
      this.invalidateCache();

      return result.url;
    } catch (error: any) {
      console.error('❌ [ImageKitService] Erro no upload:', error.message);
      throw new BadRequestException(`Erro no upload: ${error.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Upload de múltiplas imagens de produto
   */
  async uploadMultipleProductImages(
    files: Express.Multer.File[],
    productId: string
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo fornecido');
    }

    const uploadPromises = files.map(file => this.uploadProductImage(file, productId));
    return Promise.all(uploadPromises);
  }

  /**
   * Deletar imagem do ImageKit
   */
  async deleteProductImage(imageUrl: string): Promise<void> {
    if (!this.imagekit) {
      throw new BadRequestException('ImageKit não configurado');
    }

    try {
      // Extrair fileId da URL do ImageKit
      // A URL do ImageKit geralmente contém o fileId no path
      // Formato: https://ik.imagekit.io/.../filename.jpg?ik-sdk-version=...
      // Ou podemos usar a API de listagem para encontrar o fileId
      
      // Por enquanto, vamos tentar extrair da URL
      const urlParts = imageUrl.split('/');
      const fileNameWithParams = urlParts[urlParts.length - 1];
      const fileName = fileNameWithParams.split('?')[0];

      // Listar arquivos para encontrar o fileId
      const files = await this.imagekit.listFiles({
        name: fileName,
        limit: 1,
      });

      if (files.length === 0) {
        return;
      }

      const file = files[0];
      
      // Verificar se é um arquivo (não uma pasta)
      if (!('fileId' in file)) {
        return;
      }

      const fileId = file.fileId;
      
      // Deletar arquivo
      await this.imagekit.deleteFile(fileId);
      
      // Invalidar cache para forçar recarregamento
      this.imagesByProductCache = null;
      this.imagesCacheTimestamp = 0;
    } catch (error: any) {
      throw new BadRequestException(`Erro ao deletar imagem: ${error.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Verificar se uma URL é do ImageKit
   */
  isImageKitUrl(imageUrl: string): boolean {
    return imageUrl && imageUrl.includes('imagekit.io');
  }

  /**
   * Extrair número do nome do arquivo numérico
   * Exemplo: "131.png" -> "131", "28.jpg" -> "28"
   */
  private extractNumericIdFromFileName(fileName: string): string | null {
    // Padrão: número.ext (ex: 131.png, 28.jpg)
    const match = fileName.match(/^(\d+)\.(png|jpg|jpeg|webp)$/i);
    return match ? match[1] : null;
  }

  /**
   * Carregar cache do mapeamento numérico -> productId
   * Faz apenas UMA query ao banco e armazena em memória
   */
  private async loadNumericMappingCache(): Promise<void> {
    // Se já está carregando, aguardar
    if (this.cacheLoadPromise) {
      return this.cacheLoadPromise;
    }

    // Se já está carregado, retornar
    if (this.numericToProductIdCache) {
      return;
    }

    // Criar promise de carregamento
    this.cacheLoadPromise = (async () => {
      try {
        // Buscar produtos ordenados por ID (ordem estável, mesma ordem de criação)
        // Isso garante que a ordem seja consistente com a ordem das imagens numéricas
        const products = await this.prisma.product.findMany({
          orderBy: { id: 'asc' }, // Usar ID para ordem estável
          select: { id: true, createdAt: true },
        });

        // Ordenar por data de criação para manter ordem cronológica
        const sortedProducts = [...products].sort((a, b) => {
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

        // Criar mapa: número -> productId (ordem cronológica preservada)
        this.numericToProductIdCache = new Map<string, string>();
        sortedProducts.forEach((product, index) => {
          const numericId = (index + 1).toString(); // Imagens começam em 1
          this.numericToProductIdCache!.set(numericId, product.id);
        });
      } catch (error: any) {
        console.error(`❌ [ImageKitService] Erro ao carregar cache: ${error.message}`);
        this.numericToProductIdCache = new Map(); // Cache vazio em caso de erro
      } finally {
        this.cacheLoadPromise = null;
      }
    })();

    return this.cacheLoadPromise;
  }

  /**
   * Mapear nome numérico para productId usando o cache
   * MUITO MAIS RÁPIDO que fazer query para cada imagem
   */
  private async mapNumericNameToProductId(numericName: string): Promise<string | null> {
    try {
      // Garantir que o cache está carregado
      await this.loadNumericMappingCache();

      // Buscar no cache (sem query ao banco!)
      return this.numericToProductIdCache?.get(numericName) || null;
    } catch (error: any) {
      console.error(`❌ [ImageKitService] Erro ao mapear nome numérico: ${error.message}`);
      return null;
    }
  }

  /**
   * Carregar cache completo de todas as imagens mapeadas por productId
   * Busca TODAS as imagens UMA VEZ e cria mapa em memória
   */
  private async loadImagesCache(): Promise<void> {
    // Se já está carregando, aguardar
    if (this.imagesCacheLoadPromise) {
      return this.imagesCacheLoadPromise;
    }

    // Se cache é válido (não expirou), retornar
    const now = Date.now();
    if (this.imagesByProductCache && (now - this.imagesCacheTimestamp) < this.CACHE_TTL) {
      return;
    }

    // Criar promise de carregamento
    this.imagesCacheLoadPromise = (async () => {
      try {
        if (!this.imagekit) {
          this.imagesByProductCache = new Map();
          return;
        }

        // Buscar produtos do banco ordenados por criação (ordem cronológica)
        const products = await this.prisma.product.findMany({
          where: { isActive: true },
          select: {
            id: true,
            imageUrl: true,
            imageUrls: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        // Buscar TODAS as imagens UMA VEZ e ordenar por número
        const allFiles = await this.imagekit.listFiles({
          path: '/FotoMovel',
          limit: 1000,
        });

        // Ordenar imagens por número (131.png, 132.png, etc.)
        const sortedFiles = [...allFiles].sort((a, b) => {
          const fileA = a as any;
          const fileB = b as any;
          const nameA = fileA.name || fileA.filePath?.split('/').pop() || '';
          const nameB = fileB.name || fileB.filePath?.split('/').pop() || '';
          
          const numA = this.extractNumericIdFromFileName(nameA);
          const numB = this.extractNumericIdFromFileName(nameB);
          
          if (numA && numB) {
            return parseInt(numA) - parseInt(numB);
          }
          return nameA.localeCompare(nameB);
        });

        // Criar mapa: productId -> array de URLs
        this.imagesByProductCache = new Map<string, string[]>();

        // Mapear imagens numéricas para produtos na ordem de criação
        // Cada produto recebe suas imagens baseado na ordem de criação
        // IMPORTANTE: Imagens vêm em pares (par = com fundo, ímpar = sem fundo)
        // Sempre colocar a imagem COM FUNDO primeiro
        let imageIndex = 0;
        for (const product of products) {
          const productImages: string[] = [];
          
          // Cada produto tem 2 imagens: par (com fundo) e ímpar consecutivo (sem fundo)
          // Buscar o par primeiro (número par), depois o ímpar consecutivo
          if (imageIndex < sortedFiles.length) {
            const fileWithBg = sortedFiles[imageIndex];
            const fileWithoutBg = imageIndex + 1 < sortedFiles.length ? sortedFiles[imageIndex + 1] : null;
            
            // Verificar se o primeiro é par (com fundo) e o segundo é ímpar consecutivo
            const fileA = fileWithBg as any;
            const nameA = fileA.name || fileA.filePath?.split('/').pop() || '';
            const numA = this.extractNumericIdFromFileName(nameA);
            
            if (numA && parseInt(numA) % 2 === 0) {
              // Primeiro arquivo é par (com fundo) - adicionar primeiro
              productImages.push(fileA.url);
              
              // Verificar se o próximo é ímpar consecutivo (sem fundo)
              if (fileWithoutBg) {
                const fileB = fileWithoutBg as any;
                const nameB = fileB.name || fileB.filePath?.split('/').pop() || '';
                const numB = this.extractNumericIdFromFileName(nameB);
                
                if (numB && parseInt(numB) === parseInt(numA) + 1) {
                  // É o par correto - adicionar segundo
                  productImages.push(fileB.url);
                  imageIndex += 2; // Avançar 2 posições
                } else {
                  // Não é o par correto - só adicionar a primeira
                  imageIndex += 1;
                }
              } else {
                imageIndex += 1;
              }
            } else {
              // Primeiro arquivo não é par - pode ser que esteja fora de ordem
              // Adicionar mesmo assim e avançar
              productImages.push(fileA.url);
              imageIndex += 1;
            }
          }
          
          if (productImages.length > 0) {
            this.imagesByProductCache.set(product.id, productImages);
          }
        }

        // Também processar imagens que já têm productId no nome ou tags
        for (const file of sortedFiles) {
          if (!('fileId' in file)) {
            continue;
          }
          const fileObj = file as any;
          const fileName = fileObj.name || fileObj.filePath?.split('/').pop() || '';
          const imageUrl = fileObj.url;
          let productId: string | null = null;

          // MÉTODO 1: Extrair productId do nome (formato: productId_timestamp.ext)
          if (fileName.includes('_') && fileName.split('_')[0].includes('-')) {
            productId = fileName.split('_')[0];
          }

          // MÉTODO 2: Extrair das tags
          if (!productId && fileObj.tags && Array.isArray(fileObj.tags)) {
            const productTag = fileObj.tags.find((tag: string) => tag.startsWith('product-'));
            if (productTag) {
              productId = productTag.split('-')[1];
            }
          }

          // Se encontrou productId, adicionar ao cache (pode sobrescrever mapeamento numérico)
          // IMPORTANTE: Manter ordem correta - imagem com fundo (par) primeiro
          if (productId) {
            if (!this.imagesByProductCache.has(productId)) {
              this.imagesByProductCache.set(productId, []);
            }
            const existingUrls = this.imagesByProductCache.get(productId)!;
            
            // Verificar se a imagem já está no array
            if (!existingUrls.includes(imageUrl)) {
              // Extrair número do nome do arquivo para determinar ordem
              const numStr = this.extractNumericIdFromFileName(fileName);
              const isEven = numStr && parseInt(numStr) % 2 === 0; // Par = com fundo
              
              if (isEven) {
                // Imagem com fundo - adicionar no início
                existingUrls.unshift(imageUrl);
              } else {
                // Imagem sem fundo - adicionar no final
                existingUrls.push(imageUrl);
              }
            }
          }
        }
        
        // Ordenar URLs de cada produto por timestamp no nome (manter ordem)
        this.imagesByProductCache.forEach((urls, productId) => {
          const sorted = urls.sort((a, b) => {
            const getTimestamp = (url: string): number => {
              try {
                const urlParts = url.split('/');
                const fileName = urlParts[urlParts.length - 1].split('?')[0];
                const parts = fileName.split('_');
                if (parts.length >= 2) {
                  const timestamp = parseInt(parts[1]);
                  return isNaN(timestamp) ? 0 : timestamp;
                }
              } catch {
                return 0;
              }
              return 0;
            };
            
            const timestampA = getTimestamp(a);
            const timestampB = getTimestamp(b);
            return timestampA - timestampB; // Ordem crescente
          });
          
          this.imagesByProductCache.set(productId, sorted);
        });

        this.imagesCacheTimestamp = now;
      } catch (error: any) {
        console.error(`❌ [ImageKitService] Erro ao carregar cache de imagens: ${error.message}`);
        this.imagesByProductCache = new Map();
      } finally {
        this.imagesCacheLoadPromise = null;
      }
    })();

    return this.imagesCacheLoadPromise;
  }

  /**
   * Invalidar cache de imagens (forçar recarregamento)
   */
  private invalidateCache(): void {
    this.imagesByProductCache = null;
    this.imagesCacheTimestamp = 0;
    this.numericToProductIdCache = null;
  }

  /**
   * Listar imagens de um produto no ImageKit
   * USA CACHE COMPLETO - MUITO RÁPIDO!
   */
  async listProductImages(productId: string): Promise<string[]> {
    if (!this.imagekit) {
      return [];
    }

    try {
      // Carregar cache completo (se necessário)
      await this.loadImagesCache();

      // Buscar no cache (INSTANTÂNEO!)
      return this.imagesByProductCache?.get(productId) || [];
    } catch (error: any) {
      console.error(`❌ [ImageKitService] Erro ao listar imagens: ${error.message || 'Erro desconhecido'}`);
      return [];
    }
  }

  /**
   * Buscar todas as imagens na pasta /FotoMovel
   * USA CACHE COMPLETO - MUITO RÁPIDO!
   * Mapeia imagens usando URLs do banco de dados para garantir ordem correta
   */
  async listAllProductImages(): Promise<any[]> {
    if (!this.imagekit) {
      throw new BadRequestException('ImageKit não configurado');
    }

    try {
      // Buscar produtos do banco com suas URLs de imagem
      const products = await this.prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          imageUrl: true,
          imageUrls: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Criar mapa de URLs do banco -> productId
      const urlToProductIdMap = new Map<string, string>();
      products.forEach(product => {
        if (product.imageUrl) {
          urlToProductIdMap.set(product.imageUrl, product.id);
        }
        if (product.imageUrls && Array.isArray(product.imageUrls)) {
          product.imageUrls.forEach(url => {
            if (url) {
              urlToProductIdMap.set(url, product.id);
            }
          });
        }
      });

      // Buscar todas as imagens do ImageKit
      const allFiles = await this.imagekit.listFiles({
        path: '/FotoMovel',
        limit: 1000,
      });

      // Carregar cache de mapeamento numérico (fallback)
      await this.loadNumericMappingCache();

      // Converter para array de objetos com productId
      const imageFiles: any[] = [];
      
      for (const file of allFiles) {
        if (!('fileId' in file)) {
          continue;
        }
        const fileObj = file as any;
        const fileName = fileObj.name || fileObj.filePath?.split('/').pop() || '';
        const imageUrl = fileObj.url;
        let productId: string | undefined;

        // MÉTODO 1: Extrair productId do nome (formato: productId_timestamp.ext)
        if (fileName.includes('_') && fileName.split('_')[0].includes('-')) {
          productId = fileName.split('_')[0];
        }

        // MÉTODO 2: Extrair das tags
        if (!productId && fileObj.tags && Array.isArray(fileObj.tags)) {
          const productTag = fileObj.tags.find((tag: string) => tag.startsWith('product-'));
          if (productTag) {
            productId = productTag.split('-')[1];
          }
        }

        // MÉTODO 3: Mapear usando URLs do banco de dados (mais confiável)
        if (!productId) {
          // Tentar encontrar productId pela URL no banco
          for (const [dbUrl, pid] of urlToProductIdMap.entries()) {
            // Comparar URLs (pode ser Supabase ou ImageKit)
            if (dbUrl && imageUrl) {
              // Se a URL do banco contém o nome do arquivo ou vice-versa
              const dbFileName = dbUrl.split('/').pop()?.split('?')[0] || '';
              const ikFileName = imageUrl.split('/').pop()?.split('?')[0] || '';
              
              // Se os nomes são similares ou se a URL do banco é do ImageKit
              if (dbUrl.includes('imagekit.io') && dbUrl === imageUrl) {
                productId = pid;
                break;
              }
              // Se o nome numérico corresponde
              else if (dbFileName && ikFileName) {
                const dbNumeric = this.extractNumericIdFromFileName(dbFileName);
                const ikNumeric = this.extractNumericIdFromFileName(ikFileName);
                if (dbNumeric && ikNumeric && dbNumeric === ikNumeric) {
                  productId = pid;
                  break;
                }
              }
            }
          }
        }

        // MÉTODO 4: Mapear nome numérico usando cache (fallback - menos confiável)
        if (!productId) {
          const numericName = this.extractNumericIdFromFileName(fileName);
          if (numericName) {
            productId = this.numericToProductIdCache?.get(numericName) || undefined;
          }
        }

        imageFiles.push({
          fileId: fileObj.fileId,
          name: fileObj.name,
          url: fileObj.url,
          filePath: fileObj.filePath,
          tags: fileObj.tags || [],
          productId: productId,
        });
      }

      return imageFiles;
    } catch (error: any) {
      console.error('❌ [ImageKitService] Erro ao listar todas as imagens:', error);
      throw new BadRequestException(`Erro ao listar imagens: ${error.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Obter URL otimizada da imagem
   */
  getOptimizedImageUrl(
    imageUrl: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'auto' | 'webp' | 'jpg' | 'png';
    }
  ): string {
    if (!imageUrl || !this.isImageKitUrl(imageUrl)) {
      return imageUrl;
    }

    if (!options) {
      return imageUrl;
    }

    const params = new URLSearchParams();
    
    if (options.width) {
      params.append('w', options.width.toString());
    }
    
    if (options.height) {
      params.append('h', options.height.toString());
    }
    
    if (options.quality) {
      params.append('q', options.quality.toString());
    }
    
    if (options.format) {
      params.append('f', options.format);
    }

    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}${params.toString()}`;
  }

  /**
   * Upload de avatar de usuário
   */
  async uploadUserAvatar(
    file: Express.Multer.File,
    userId: string
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo fornecido');
    }

    if (!this.imagekit) {
      throw new BadRequestException('ImageKit não configurado');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não suportado. Use JPEG, PNG ou WebP');
    }

    try {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;

      const uploadResponse = await this.imagekit.upload({
        file: file.buffer,
        fileName: fileName,
        folder: '/Avatares',
        tags: [`user-${userId}`, 'avatar'],
        useUniqueFileName: false,
      });

      // Invalidar cache
      this.invalidateCache();

      return uploadResponse.url;
    } catch (error: any) {
      console.error('❌ [ImageKitService] Erro ao fazer upload de avatar:', error);
      throw new BadRequestException(`Erro ao fazer upload: ${error.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Upload de imagem de loja
   */
  async uploadStoreImage(
    file: Express.Multer.File,
    storeId: string
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo fornecido');
    }

    if (!this.imagekit) {
      throw new BadRequestException('ImageKit não configurado');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não suportado. Use JPEG, PNG ou WebP');
    }

    try {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${storeId}_${Date.now()}.${fileExt}`;

      const uploadResponse = await this.imagekit.upload({
        file: file.buffer,
        fileName: fileName,
        folder: '/Lojas',
        tags: [`store-${storeId}`, 'store'],
        useUniqueFileName: false,
      });

      // Invalidar cache
      this.invalidateCache();

      return uploadResponse.url;
    } catch (error: any) {
      console.error('❌ [ImageKitService] Erro ao fazer upload de imagem de loja:', error);
      throw new BadRequestException(`Erro ao fazer upload: ${error.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Deletar avatar de usuário
   */
  async deleteUserAvatar(imageUrl: string): Promise<boolean> {
    if (!this.imagekit) {
      return false;
    }

    try {
      const fileId = await this.findFileIdByUrl(imageUrl);
      if (!fileId) {
        return false;
      }

      await this.imagekit.deleteFile(fileId);
      
      // Invalidar cache
      this.invalidateCache();

      return true;
    } catch (error: any) {
      console.error('❌ [ImageKitService] Erro ao deletar avatar:', error);
      return false;
    }
  }

  /**
   * Deletar imagem de loja
   */
  async deleteStoreImage(imageUrl: string): Promise<boolean> {
    if (!this.imagekit) {
      return false;
    }

    try {
      const fileId = await this.findFileIdByUrl(imageUrl);
      if (!fileId) {
        return false;
      }

      await this.imagekit.deleteFile(fileId);
      
      // Invalidar cache
      this.invalidateCache();

      return true;
    } catch (error: any) {
      console.error('❌ [ImageKitService] Erro ao deletar imagem de loja:', error);
      return false;
    }
  }

  /**
   * Encontrar fileId de uma URL do ImageKit buscando pelo nome do arquivo
   */
  private async findFileIdByUrl(url: string): Promise<string | null> {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1].split('?')[0]; // Remover query params

      // Determinar a pasta baseada na URL
      let folder = '/FotoMovel'; // padrão para produtos
      if (url.includes('/Avatares/')) {
        folder = '/Avatares';
      } else if (url.includes('/Lojas/')) {
        folder = '/Lojas';
      }

      // Buscar arquivo pelo nome na pasta apropriada
      const files = await this.imagekit.listFiles({
        path: folder,
        name: fileName,
        limit: 1,
      });

      if (files && files.length > 0) {
        const file = files[0] as any;
        if (file.fileId) {
          return file.fileId;
        }
      }

      return null;
    } catch (error: any) {
      console.error('❌ [ImageKitService] Erro ao buscar fileId:', error);
      return null;
    }
  }
}

