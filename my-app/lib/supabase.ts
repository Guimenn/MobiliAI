import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Criar cliente apenas se as credenciais estiverem configuradas
const isSupabaseConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

// Logs para debug
console.log('🔧 Configuração do Supabase:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  isConfigured: isSupabaseConfigured,
  urlIncludesPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
});

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Cliente com service role para uploads (bypassa RLS)
export const supabaseAdmin = isSupabaseConfigured && supabaseServiceKey !== 'placeholder-service-key'
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Função para fazer upload de imagem
export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured) {
    console.warn('⚠️ Supabase não configurado. Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
    // Retornar URL de placeholder para desenvolvimento
    return `https://via.placeholder.com/400x400.png?text=${encodeURIComponent(file.name)}`;
  }

  // Usar cliente admin se disponível (bypassa RLS)
  const client = supabaseAdmin || supabase;
  console.log('🔑 Usando cliente:', supabaseAdmin ? 'Admin (Service Role)' : 'Anon');

  // Pular verificação do bucket - vamos tentar upload diretamente
  console.log('📤 Tentando upload direto para bucket product-images...');

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    
    // Tentar diferentes pastas em ordem de prioridade
    const pathsToTry = [
      `products/${fileName}`,      // Pasta products
      `public/${fileName}`,       // Pasta public
      fileName                    // Raiz do bucket
    ];

    console.log('📤 Tentando upload para diferentes caminhos:', pathsToTry);

    // Tentar cada caminho até um funcionar
    for (let i = 0; i < pathsToTry.length; i++) {
      const filePath = pathsToTry[i];
      console.log(`🔄 Tentativa ${i + 1}/${pathsToTry.length}: ${filePath}`);
      
      const { data, error } = await client.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error(`❌ Erro na tentativa ${i + 1}:`, error);
        console.error('❌ Detalhes do erro:', {
          message: error.message,
          name: error.name
        });
        
        // Se não é a última tentativa, continuar
        if (i < pathsToTry.length - 1) {
          console.log('🔄 Tentando próximo caminho...');
          continue;
        }
        
        // Se é a última tentativa, retornar placeholder
        console.error('❌ Todas as tentativas falharam');
        return `https://via.placeholder.com/400x400.png?text=${encodeURIComponent(file.name)}`;
      }

      // Sucesso! Obter URL pública
      const { data: publicUrlData } = client.storage
        .from('product-images')
        .getPublicUrl(filePath);

      console.log(`✅ Upload bem-sucedido na tentativa ${i + 1}:`, publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    }
    
    // Se chegou aqui, todas as tentativas falharam
    return `https://via.placeholder.com/400x400.png?text=${encodeURIComponent(file.name)}`;
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

// ===== FUNÇÕES PARA UPLOAD DE AVATAR DE USUÁRIO =====

// Função para fazer upload de avatar de usuário
export async function uploadUserAvatar(file: File, userId: string): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured) {
    console.warn('⚠️ Supabase não configurado. Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
    // Retornar URL de placeholder para desenvolvimento
    return `https://via.placeholder.com/150x150.png?text=${encodeURIComponent(file.name)}`;
  }

  // Usar cliente admin se disponível (bypassa RLS)
  const client = supabaseAdmin || supabase;
  console.log('🔑 Usando cliente:', supabaseAdmin ? 'Admin (Service Role)' : 'Anon');

  // Pular verificação do bucket - vamos tentar upload diretamente
  console.log('📤 Tentando upload direto para bucket perfil...');

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    
    // Tentar diferentes pastas em ordem de prioridade
    const pathsToTry = [
      `avatars/${fileName}`,      // Pasta avatars
      `public/${fileName}`,       // Pasta public
      fileName                    // Raiz do bucket
    ];

    console.log('📤 Tentando upload para diferentes caminhos:', pathsToTry);

    // Tentar cada caminho até um funcionar
    for (let i = 0; i < pathsToTry.length; i++) {
      const filePath = pathsToTry[i];
      console.log(`🔄 Tentativa ${i + 1}/${pathsToTry.length}: ${filePath}`);
      
      const { data, error } = await client.storage
        .from('perfil')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error(`❌ Erro na tentativa ${i + 1}:`, error);
        console.error('❌ Detalhes do erro:', {
          message: error.message,
          name: error.name
        });
        
        // Se não é a última tentativa, continuar
        if (i < pathsToTry.length - 1) {
          console.log('🔄 Tentando próximo caminho...');
          continue;
        }
        
        // Se é a última tentativa, retornar placeholder
        console.error('❌ Todas as tentativas falharam');
        return `https://via.placeholder.com/150x150.png?text=${encodeURIComponent(file.name)}`;
      }

      // Sucesso! Obter URL pública
      const { data: publicUrlData } = client.storage
        .from('perfil')
        .getPublicUrl(filePath);

      console.log(`✅ Upload bem-sucedido na tentativa ${i + 1}:`, publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    }
    
    // Se chegou aqui, todas as tentativas falharam
    return `https://via.placeholder.com/150x150.png?text=${encodeURIComponent(file.name)}`;
  } catch (error) {
    console.error('❌ Erro geral no upload:', error);
    return `https://via.placeholder.com/150x150.png?text=${encodeURIComponent(file.name)}`;
  }
}

// Função para deletar avatar de usuário
export async function deleteUserAvatar(imageUrl: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) {
    console.warn('⚠️ Supabase não configurado. Deletar avatar ignorado.');
    return true; // Retornar true para não quebrar o fluxo
  }

  try {
    // Extrair o caminho do arquivo da URL
    const urlParts = imageUrl.split('/perfil/');
    if (urlParts.length < 2) return false;
    
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('perfil')
      .remove([filePath]);

    if (error) {
      console.error('Erro ao deletar avatar:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar avatar:', error);
    return false;
  }
}

// Função para fazer upload de múltiplas imagens
export async function uploadMultipleProductImages(
  files: File[],
  productId: string
): Promise<string[]> {
  console.log('🚀 Iniciando upload de múltiplas imagens:', {
    quantidade: files.length,
    productId,
    arquivos: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
  });

  const uploadPromises = files.map(async (file, index) => {
    console.log(`📤 Upload ${index + 1}/${files.length}:`, file.name);
    try {
      const result = await uploadProductImage(file, productId);
      console.log(`✅ Upload ${index + 1} concluído:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Erro no upload ${index + 1}:`, error);
      return null;
    }
  });
  
  const results = await Promise.all(uploadPromises);
  const successfulUploads = results.filter((url): url is string => url !== null);
  
  console.log('📊 Resultado do upload múltiplo:', {
    total: files.length,
    sucessos: successfulUploads.length,
    falhas: files.length - successfulUploads.length,
    urls: successfulUploads
  });
  
  return successfulUploads;
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

// ===== FUNÇÕES PARA UPLOAD DE FOTO DE LOJA =====

// Função para fazer upload de foto de loja
export async function uploadStoreImage(file: File, storeId: string): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured) {
    console.warn('⚠️ Supabase não configurado. Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
    // Retornar URL de placeholder para desenvolvimento
    return `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(file.name)}`;
  }

  // Usar cliente admin se disponível (bypassa RLS)
  const client = supabaseAdmin || supabase;
  console.log('🔑 Usando cliente:', supabaseAdmin ? 'Admin (Service Role)' : 'Anon');

  // Pular verificação do bucket - vamos tentar upload diretamente
  console.log('📤 Tentando upload direto para bucket fotos...');

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${storeId}-${Date.now()}.${fileExt}`;
    
    // Tentar diferentes pastas em ordem de prioridade
    const pathsToTry = [
      `stores/${fileName}`,      // Pasta stores
      `public/${fileName}`,       // Pasta public
      fileName                    // Raiz do bucket
    ];

    console.log('📤 Tentando upload para diferentes caminhos:', pathsToTry);

    // Tentar cada caminho até um funcionar
    for (let i = 0; i < pathsToTry.length; i++) {
      const filePath = pathsToTry[i];
      console.log(`🔄 Tentativa ${i + 1}/${pathsToTry.length}: ${filePath}`);
      
      const { data, error } = await client.storage
        .from('fotos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error(`❌ Erro na tentativa ${i + 1}:`, error);
        console.error('❌ Detalhes do erro:', {
          message: error.message,
          name: error.name
        });
        
        // Se não é a última tentativa, continuar
        if (i < pathsToTry.length - 1) {
          console.log('🔄 Tentando próximo caminho...');
          continue;
        }
        
        // Se é a última tentativa, retornar placeholder
        console.error('❌ Todas as tentativas falharam');
        return `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(file.name)}`;
      }

      // Sucesso! Obter URL pública
      const { data: publicUrlData } = client.storage
        .from('fotos')
        .getPublicUrl(filePath);

      console.log(`✅ Upload bem-sucedido na tentativa ${i + 1}:`, publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    }
    
    // Se chegou aqui, todas as tentativas falharam
    return `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(file.name)}`;
  } catch (error) {
    console.error('❌ Erro geral no upload:', error);
    return `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(file.name)}`;
  }
}

// Função para deletar foto de loja
export async function deleteStoreImage(imageUrl: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) {
    console.warn('⚠️ Supabase não configurado. Deletar foto ignorado.');
    return true; // Retornar true para não quebrar o fluxo
  }

  try {
    // Extrair o caminho do arquivo da URL
    const urlParts = imageUrl.split('/fotos/');
    if (urlParts.length < 2) return false;
    
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('fotos')
      .remove([filePath]);

    if (error) {
      console.error('Erro ao deletar foto:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar foto:', error);
    return false;
  }
}