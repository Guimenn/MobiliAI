const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🪣 CRIAÇÃO DO BUCKET: product-images');
console.log('===================================');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  try {
    console.log('🔗 Conectando ao Supabase...');
    console.log(`URL: ${supabaseUrl}`);
    console.log('');

    // Verificar se bucket já existe
    console.log('🔍 Verificando se bucket já existe...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError.message);
      return;
    }

    const existingBucket = buckets.find(b => b.name === 'product-images');
    
    if (existingBucket) {
      console.log('✅ Bucket "product-images" já existe!');
      console.log(`   Tipo: ${existingBucket.public ? 'Público' : 'Privado'}`);
      console.log('');
      return;
    }

    // Criar bucket
    console.log('🪣 Criando bucket "product-images"...');
    const { data, error } = await supabase.storage.createBucket('product-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      console.error('❌ Erro ao criar bucket:', error.message);
      
      // Verificar se é erro de permissão
      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        console.log('');
        console.log('⚠️  ERRO DE PERMISSÃO:');
        console.log('   A chave anônima não tem permissão para criar buckets.');
        console.log('   Você precisa criar o bucket manualmente no painel do Supabase:');
        console.log('');
        console.log('📝 PASSOS MANUAIS:');
        console.log('1. Acesse: https://supabase.com/dashboard/project/duvgptwzoodyyjbdhepa');
        console.log('2. Vá em "Storage" no menu lateral');
        console.log('3. Clique em "Create a new bucket"');
        console.log('4. Nome: product-images');
        console.log('5. Marque "Public bucket"');
        console.log('6. Clique em "Create bucket"');
        console.log('');
        console.log('🔧 CONFIGURAÇÕES RECOMENDADAS:');
        console.log('- Tipos de arquivo: image/jpeg, image/jpg, image/png, image/webp');
        console.log('- Tamanho máximo: 5MB');
        console.log('- Público: Sim');
      }
      return;
    }

    console.log('✅ Bucket criado com sucesso!');
    console.log(`   ID: ${data.name}`);
    console.log('');

    // Testar upload
    console.log('📤 Testando upload no novo bucket...');
    const testContent = Buffer.from('Teste de upload - ' + new Date().toISOString());
    const testFileName = `test-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError.message);
      return;
    }

    console.log('✅ Teste de upload realizado com sucesso!');
    console.log(`   Arquivo: ${uploadData.path}`);

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(testFileName);

    console.log('✅ URL pública gerada:');
    console.log(`   ${publicUrlData.publicUrl}`);

    // Limpar arquivo de teste
    await supabase.storage
      .from('product-images')
      .remove([testFileName]);

    console.log('');
    console.log('🎉 BUCKET CRIADO E TESTADO COM SUCESSO!');
    console.log('   Agora você pode fazer upload de imagens de produtos.');

  } catch (error) {
    console.error('❌ ERRO GERAL:', error.message);
  }
}

createBucket();