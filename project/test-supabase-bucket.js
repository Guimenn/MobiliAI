const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 TESTE: Verificação do Bucket Supabase');
console.log('=======================================');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas');
  console.log('');
  console.log('📝 Configure no arquivo .env:');
  console.log('SUPABASE_URL=https://seu-projeto.supabase.co');
  console.log('SUPABASE_ANON_KEY=sua-chave-anonima');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBucket() {
  try {
    console.log('🔗 Conectando ao Supabase...');
    console.log(`URL: ${supabaseUrl}`);
    console.log('');

    // Testar listagem de buckets
    console.log('📂 Verificando buckets disponíveis...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
      return;
    }

    console.log('✅ Buckets encontrados:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
    console.log('');

    // Verificar se bucket product-images existe
    const productImagesBucket = buckets.find(b => b.name === 'product-images');
    
    if (!productImagesBucket) {
      console.log('⚠️  Bucket "product-images" não encontrado!');
      console.log('');
      console.log('📝 Para criar o bucket:');
      console.log('1. Acesse o painel do Supabase');
      console.log('2. Vá em Storage');
      console.log('3. Crie um bucket chamado "product-images"');
      console.log('4. Configure como público');
      return;
    }

    console.log('✅ Bucket "product-images" encontrado!');
    console.log(`   Tipo: ${productImagesBucket.public ? 'Público' : 'Privado'}`);
    console.log('');

    // Testar listagem de arquivos no bucket
    console.log('📁 Verificando arquivos no bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('product-images')
      .list('', { limit: 10 });

    if (filesError) {
      console.error('❌ Erro ao listar arquivos:', filesError.message);
      return;
    }

    console.log(`✅ Encontrados ${files.length} arquivos no bucket`);
    if (files.length > 0) {
      console.log('Arquivos:');
      files.forEach(file => {
        console.log(`  - ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`);
      });
    }
    console.log('');

    // Testar upload de um arquivo de teste
    console.log('📤 Testando upload...');
    const testContent = Buffer.from('Teste de upload - ' + new Date().toISOString());
    const testFileName = `test-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError.message);
      return;
    }

    console.log('✅ Upload realizado com sucesso!');
    console.log(`   Arquivo: ${uploadData.path}`);
    console.log('');

    // Testar URL pública
    console.log('🔗 Testando URL pública...');
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(testFileName);

    console.log('✅ URL pública gerada:');
    console.log(`   ${publicUrlData.publicUrl}`);
    console.log('');

    // Limpar arquivo de teste
    console.log('🧹 Limpando arquivo de teste...');
    const { error: deleteError } = await supabase.storage
      .from('product-images')
      .remove([testFileName]);

    if (deleteError) {
      console.error('⚠️  Erro ao deletar arquivo de teste:', deleteError.message);
    } else {
      console.log('✅ Arquivo de teste removido');
    }

    console.log('');
    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('   O bucket está funcionando corretamente.');

  } catch (error) {
    console.error('❌ ERRO GERAL:', error.message);
  }
}

testBucket();