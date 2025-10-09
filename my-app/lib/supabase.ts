import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Criar cliente apenas se as credenciais estiverem configuradas
const isSupabaseConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Função para fazer upload de imagem
export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured) {
    console.warn('⚠️ Supabase não configurado. Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
    // Retornar URL de placeholder para desenvolvimento
    return `https://via.placeholder.com/400x400.png?text=${encodeURIComponent(file.name)}`;
  }

  // Verificar se o bucket existe
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const productImagesBucket = buckets?.find(bucket => bucket.name === 'product-images');
    
    if (!productImagesBucket) {
      console.warn('⚠️ Bucket "product-images" não encontrado. Usando placeholder.');
      return `https://via.placeholder.com/400x400.png?text=${encodeURIComponent(file.name)}`;
    }
  } catch (error) {
    console.warn('⚠️ Erro ao verificar buckets. Usando placeholder.');
    return `https://via.placeholder.com/400x400.png?text=${encodeURIComponent(file.name)}`;
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    
    // Usar uma pasta específica que funciona com as políticas atuais
    const folderName = 'products';
    const filePath = `${folderName}/${fileName}`;

    console.log('📤 Tentando upload para:', filePath);

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Permitir sobrescrever se já existir
      });

    if (error) {
      console.error('❌ Erro ao fazer upload:', error);
      
      // Se der erro de política, tentar com nome de pasta diferente
      if (error.message.includes('policy') || error.message.includes('permission')) {
        console.log('🔄 Tentando com pasta alternativa...');
        const altFilePath = `public/${fileName}`;
        
        const { data: altData, error: altError } = await supabase.storage
          .from('product-images')
          .upload(altFilePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (altError) {
          console.error('❌ Erro na tentativa alternativa:', altError);
          return `https://via.placeholder.com/400x400.png?text=${encodeURIComponent(file.name)}`;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(altFilePath);
          
        return publicUrlData.publicUrl;
      }
      
      return `https://via.placeholder.com/400x400.png?text=${encodeURIComponent(file.name)}`;
    }

    // Obter URL pública da imagem
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    console.log('✅ Upload bem-sucedido:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Erro geral no upload:', error);
    return `https://via.placeholder.com/400x400.png?text=${encodeURIComponent(file.name)}`;
  }
}

// Função para deletar imagem
export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) {
    console.warn('⚠️ Supabase não configurado. Deletar imagem ignorado.');
    return true; // Retornar true para não quebrar o fluxo
  }

  try {
    // Extrair o caminho do arquivo da URL
    const urlParts = imageUrl.split('/product-images/');
    if (urlParts.length < 2) return false;
    
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('product-images')
      .remove([`products/${filePath}`]);

    if (error) {
      console.error('Erro ao deletar imagem:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    return false;
  }
}

// Função para fazer upload de múltiplas imagens
export async function uploadMultipleProductImages(
  files: File[],
  productId: string
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadProductImage(file, productId));
  const results = await Promise.all(uploadPromises);
  return results.filter((url): url is string => url !== null);
}

// Função alternativa que simula upload (para desenvolvimento)
export async function simulateImageUpload(file: File, productId: string): Promise<string> {
  console.log('🎭 Simulando upload de imagem:', file.name);
  
  // Gerar URL de placeholder com informações do arquivo
  const fileExt = file.name.split('.').pop();
  const fileName = `${productId}-${Date.now()}.${fileExt}`;
  
  // Criar uma URL de placeholder mais realista
  const placeholderUrl = `https://picsum.photos/400/400?random=${Date.now()}&text=${encodeURIComponent(file.name)}`;
  
  // Simular delay de upload
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('✅ Upload simulado concluído:', placeholderUrl);
  return placeholderUrl;
}
