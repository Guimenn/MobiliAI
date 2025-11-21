import { useAppStore } from './store';

// Configuração do ImageKit
const imagekitUrlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '';

// Verificar se o ImageKit está configurado
const isImageKitConfigured = 
  imagekitUrlEndpoint && 
  !imagekitUrlEndpoint.includes('placeholder');

/**
 * Upload de imagem de produto para o ImageKit
 * @param file - Arquivo de imagem
 * @param productId - ID do produto
 * @returns URL da imagem no ImageKit ou null em caso de erro
 */
export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  if (!isImageKitConfigured) {
    console.warn('⚠️ [ImageKit Frontend] ImageKit não configurado');
    return null;
  }

  // Sempre usar API do backend (mais seguro)
  return uploadProductImageViaAPI(file, productId);
}

/**
 * Upload de imagem via API do backend (para uso no cliente)
 */
async function uploadProductImageViaAPI(file: File, productId: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const uploadUrl = `${API_BASE_URL}/upload/product-image`;
    
    // Obter token do store (Zustand)
    const token = useAppStore.getState().token || 
      (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    if (!token) {
      console.error('❌ [ImageKit Frontend] Token não encontrado no store ou localStorage');
      throw new Error('Token não encontrado. Faça login novamente.');
    }

    const headers: HeadersInit = {};
    headers['Authorization'] = `Bearer ${token}`;
    
    // Não definir Content-Type para FormData - o navegador define automaticamente

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `Erro: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  } catch (error: any) {
    console.error('❌ [ImageKit Frontend] Erro no upload:', error.message);
    return null;
  }
}

/**
 * Upload de múltiplas imagens de produto
 */
export async function uploadMultipleProductImages(
  files: File[],
  productId: string
): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    try {
      return await uploadProductImage(file, productId);
    } catch (error) {
      console.error('❌ [ImageKit Frontend] Erro no upload:', error);
      return null;
    }
  });
  
  const results = await Promise.all(uploadPromises);
  return results.filter((url): url is string => url !== null);
}

/**
 * Deletar imagem do ImageKit
 * @param imageUrl - URL da imagem no ImageKit
 * @returns true se deletado com sucesso, false caso contrário
 */
export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  if (!isImageKitConfigured) {
    console.warn('⚠️ ImageKit não configurado. Deletar imagem ignorado.');
    return true; // Retornar true para não quebrar o fluxo
  }

  try {
    // Sempre usar API do backend
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    // Obter token do store (Zustand)
    const token = useAppStore.getState().token || 
      (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/upload/delete-image`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ imageUrl }),
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao deletar imagem do ImageKit:', error);
    return false;
  }
}

/**
 * Verificar se uma URL é do ImageKit
 */
export function isImageKitUrl(imageUrl: string): boolean {
  const isImageKit = !!(imageUrl && imageUrl.includes('imagekit.io'));
  if (isImageKit) {
    console.log('🖼️ [ImageKit Frontend] URL é do ImageKit:', imageUrl);
  }
  return isImageKit;
}

/**
 * Buscar imagens de um produto no ImageKit
 */
export async function getProductImagesFromImageKit(productId: string): Promise<string[]> {
  if (!isImageKitConfigured) {
    console.warn('⚠️ [ImageKit Frontend] ImageKit não configurado');
    return [];
  }

  try {
    // Usar endpoint público (não requer autenticação)
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const url = `${API_BASE_URL}/public/product-images/${productId}`;
    
    console.log('🔍 [ImageKit Frontend] Buscando imagens do produto:', productId);
    console.log('🔍 [ImageKit Frontend] URL pública:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ [ImageKit Frontend] Erro ao buscar imagens:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    console.log('✅ [ImageKit Frontend] Imagens encontradas:', data.imageUrls?.length || 0);
    return data.imageUrls || [];
  } catch (error: any) {
    console.error('❌ [ImageKit Frontend] Erro ao buscar imagens:', error);
    return [];
  }
}

/**
 * Buscar todas as imagens do ImageKit
 */
export async function getAllImagesFromImageKit(): Promise<any[]> {
  if (!isImageKitConfigured) {
    console.warn('⚠️ [ImageKit Frontend] ImageKit não configurado');
    return [];
  }

  try {
    // Usar endpoint público (não requer autenticação)
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const url = `${API_BASE_URL}/public/all-images`;
    
    console.log('🔍 [ImageKit Frontend] Buscando todas as imagens do ImageKit');
    console.log('🔍 [ImageKit Frontend] URL pública:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ [ImageKit Frontend] Erro ao buscar imagens:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    console.log('✅ [ImageKit Frontend] Total de imagens encontradas:', data.images?.length || 0);
    return data.images || [];
  } catch (error: any) {
    console.error('❌ [ImageKit Frontend] Erro ao buscar imagens:', error);
    return [];
  }
}

/**
 * Buscar todas as imagens do ImageKit e mapear por productId
 * Retorna um Map com productId -> array de URLs do ImageKit
 */
export async function getAllImageKitImagesByProduct(): Promise<Map<string, string[]>> {
  if (!isImageKitConfigured) {
    console.warn('⚠️ [ImageKit Frontend] ImageKit não configurado');
    return new Map();
  }

  try {
    console.log('🔍 [ImageKit Frontend] Buscando todas as imagens do ImageKit para mapear por produto...');
    const allImages = await getAllImagesFromImageKit();
    
    // Criar um Map: productId -> array de URLs
    const imagesByProduct = new Map<string, string[]>();
    
    allImages.forEach((image: any) => {
      let productId: string | null = null;
      
      // PRIORIDADE 1: Usar productId direto se vier no objeto (backend já mapeou)
      if (image.productId) {
        productId = image.productId;
      }
      // PRIORIDADE 2: Extrair productId do nome do arquivo (formato: productId_timestamp.ext)
      else if (image.name) {
        const nameParts = image.name.split('_');
        if (nameParts.length > 0) {
          const potentialId = nameParts[0];
          // Verificar se parece um UUID (contém hífens)
          if (potentialId.includes('-') && potentialId.length > 30) {
            productId = potentialId;
          }
        }
      }
      // PRIORIDADE 3: Tentar das tags (formato: product-{productId})
      else if (image.tags && Array.isArray(image.tags)) {
        const productTag = image.tags.find((tag: string) => tag.startsWith('product-'));
        if (productTag) {
          productId = productTag.replace('product-', '');
        }
      }
      
      if (productId) {
        if (!imagesByProduct.has(productId)) {
          imagesByProduct.set(productId, []);
        }
        imagesByProduct.get(productId)?.push(image.url);
      }
    });
    
    // Ordenar imagens de cada produto garantindo que imagem COM FUNDO (número par) venha primeiro
    imagesByProduct.forEach((urls, productId) => {
      const sorted = urls.sort((a, b) => {
        // Extrair número do nome do arquivo na URL
        const getImageNumber = (url: string): number => {
          try {
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1].split('?')[0];
            // Tentar extrair número do nome (formato: 2.png, 3.png, etc. ou productId_timestamp.ext)
            const numericMatch = fileName.match(/^(\d+)\./);
            if (numericMatch) {
              return parseInt(numericMatch[1]);
            }
            // Se não for numérico, tentar extrair timestamp para ordenação
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
        
        const numA = getImageNumber(a);
        const numB = getImageNumber(b);
        
        // Se ambos têm números válidos
        if (numA > 0 && numB > 0) {
          // Números pares (com fundo) devem vir antes dos ímpares consecutivos
          const isEvenA = numA % 2 === 0;
          const isEvenB = numB % 2 === 0;
          
          // Se A é par e B é ímpar consecutivo, A vem primeiro
          if (isEvenA && !isEvenB && numB === numA + 1) {
            return -1;
          }
          // Se B é par e A é ímpar consecutivo, B vem primeiro
          if (isEvenB && !isEvenA && numA === numB + 1) {
            return 1;
          }
          // Caso contrário, ordenar por número
          return numA - numB;
        }
        
        // Fallback: ordenar por timestamp ou manter ordem original
        return 0;
      });
      
      imagesByProduct.set(productId, sorted);
    });
    
    console.log(`✅ [ImageKit Frontend] Mapeadas imagens para ${imagesByProduct.size} produtos`);
    if (imagesByProduct.size > 0) {
      const firstProductId = Array.from(imagesByProduct.keys())[0];
      console.log(`📸 [ImageKit Frontend] Exemplo: produto ${firstProductId} tem ${imagesByProduct.get(firstProductId)?.length} imagem(ns)`);
    }
    return imagesByProduct;
  } catch (error: any) {
    console.error('❌ [ImageKit Frontend] Erro ao mapear imagens:', error);
    return new Map();
  }
}

/**
 * Normalizar URL de imagem - prioriza ImageKit quando disponível
 * Se a URL for do Supabase mas existir no ImageKit, retorna a do ImageKit
 */
export async function normalizeImageUrl(
  imageUrl: string | undefined,
  productId?: string,
  imageKitMap?: Map<string, string[]>
): Promise<string | undefined> {
  if (!imageUrl) {
    return undefined;
  }

  // Se já é do ImageKit, retornar direto
  if (isImageKitUrl(imageUrl)) {
    return imageUrl;
  }

  // Se é do Supabase e temos productId, tentar buscar no ImageKit
  if (imageUrl.includes('supabase.co') && productId) {
    let imageKitUrls: string[] = [];
    
    // Se temos o map, usar ele (mais eficiente)
    if (imageKitMap && imageKitMap.has(productId)) {
      imageKitUrls = imageKitMap.get(productId) || [];
    } else {
      // Caso contrário, buscar individualmente
      imageKitUrls = await getProductImagesFromImageKit(productId);
    }
    
    if (imageKitUrls.length > 0) {
      console.log(`✅ [ImageKit Frontend] Produto ${productId}: usando ImageKit (${imageKitUrls[0]}) em vez de Supabase`);
      return imageKitUrls[0];
    }
    
    console.log(`⚠️ [ImageKit Frontend] Produto ${productId}: não encontrado no ImageKit, usando Supabase`);
  }

  return imageUrl;
}

/**
 * Obter URL otimizada da imagem do ImageKit
 * @param imageUrl - URL original da imagem
 * @param options - Opções de transformação (width, height, quality, etc)
 * @returns URL otimizada
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  }
): string {
  console.log('🖼️ [ImageKit Frontend] Obtendo URL otimizada para:', imageUrl);
  
  if (!imageUrl || !isImageKitUrl(imageUrl)) {
    console.log('🖼️ [ImageKit Frontend] URL não é do ImageKit, retornando original');
    return imageUrl;
  }

  if (!options) {
    console.log('🖼️ [ImageKit Frontend] Sem opções de otimização, retornando URL original');
    return imageUrl;
  }

  console.log('🖼️ [ImageKit Frontend] Aplicando otimizações:', options);

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
  const optimizedUrl = `${imageUrl}${separator}${params.toString()}`;
  console.log('✅ [ImageKit Frontend] URL otimizada:', optimizedUrl);
  
  return optimizedUrl;
}

/**
 * Upload de avatar de usuário para o ImageKit
 */
export async function uploadUserAvatar(file: File, userId: string): Promise<string | null> {
  if (!isImageKitConfigured) {
    console.warn('⚠️ [ImageKit Frontend] ImageKit não configurado');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const uploadUrl = `${API_BASE_URL}/upload/user-avatar`;
    
    const token = useAppStore.getState().token || 
      (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `Erro: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  } catch (error: any) {
    console.error('❌ [ImageKit Frontend] Erro no upload de avatar:', error.message);
    return null;
  }
}

/**
 * Upload de imagem de loja para o ImageKit
 */
export async function uploadStoreImage(file: File, storeId: string): Promise<string | null> {
  if (!isImageKitConfigured) {
    console.warn('⚠️ [ImageKit Frontend] ImageKit não configurado');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('storeId', storeId);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const uploadUrl = `${API_BASE_URL}/upload/store-image`;
    
    const token = useAppStore.getState().token || 
      (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `Erro: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  } catch (error: any) {
    console.error('❌ [ImageKit Frontend] Erro no upload de imagem de loja:', error.message);
    return null;
  }
}

/**
 * Deletar avatar de usuário do ImageKit
 */
export async function deleteUserAvatar(imageUrl: string): Promise<boolean> {
  if (!isImageKitConfigured) {
    console.warn('⚠️ ImageKit não configurado. Deletar avatar ignorado.');
    return true;
  }

  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    const token = useAppStore.getState().token || 
      (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/upload/user-avatar`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ imageUrl }),
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao deletar avatar do ImageKit:', error);
    return false;
  }
}

/**
 * Deletar imagem de loja do ImageKit
 */
export async function deleteStoreImage(imageUrl: string): Promise<boolean> {
  if (!isImageKitConfigured) {
    console.warn('⚠️ ImageKit não configurado. Deletar imagem de loja ignorado.');
    return true;
  }

  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    const token = useAppStore.getState().token || 
      (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/upload/store-image`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ imageUrl }),
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao deletar imagem de loja do ImageKit:', error);
    return false;
  }
}

