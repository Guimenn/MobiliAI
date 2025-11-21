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

// Função para fazer upload de imagem - Agora usa ImageKit
export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  // Importar dinamicamente para evitar problemas de SSR
  const { uploadProductImage: uploadToImageKit } = await import('./imagekit');
  return uploadToImageKit(file, productId);
}

// Função para deletar imagem - Agora usa ImageKit
export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  const { deleteProductImage: deleteFromImageKit } = await import('./imagekit');
  return deleteFromImageKit(imageUrl);
}

// ===== FUNÇÕES PARA UPLOAD DE AVATAR DE USUÁRIO =====
// Agora usa ImageKit ao invés de Supabase

// Função para fazer upload de avatar de usuário
export async function uploadUserAvatar(file: File, userId: string): Promise<string | null> {
  const { uploadUserAvatar: uploadToImageKit } = await import('./imagekit');
  return uploadToImageKit(file, userId);
}

// Função para deletar avatar de usuário
export async function deleteUserAvatar(imageUrl: string): Promise<boolean> {
  const { deleteUserAvatar: deleteFromImageKit } = await import('./imagekit');
  return deleteFromImageKit(imageUrl);
}

// Função para fazer upload de múltiplas imagens - Agora usa ImageKit
export async function uploadMultipleProductImages(
  files: File[],
  productId: string
): Promise<string[]> {
  const { uploadMultipleProductImages: uploadMultipleToImageKit } = await import('./imagekit');
  return uploadMultipleToImageKit(files, productId);
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
// Agora usa ImageKit ao invés de Supabase

// Função para fazer upload de foto de loja
export async function uploadStoreImage(file: File, storeId: string): Promise<string | null> {
  const { uploadStoreImage: uploadToImageKit } = await import('./imagekit');
  return uploadToImageKit(file, storeId);
}

// Função para deletar foto de loja
export async function deleteStoreImage(imageUrl: string): Promise<boolean> {
  const { deleteStoreImage: deleteFromImageKit } = await import('./imagekit');
  return deleteFromImageKit(imageUrl);
}