#!/usr/bin/env node

/**
 * Script de teste para verificar a integração com Replicate API
 * Execute: node test-replicate.js
 */

const Replicate = require('replicate');

// Configuração
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || 'r8_WwmiM2PiqGiJsyW0oVQ5LJDDHZqLQid1AzXRU';

async function testReplicateConnection() {
  console.log('🧪 Testando conexão com Replicate API...');
  console.log('🔑 Token:', REPLICATE_API_TOKEN.substring(0, 10) + '...');
  
  try {
    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    });

    console.log('✅ Cliente Replicate inicializado com sucesso');
    
    // Teste simples com uma imagem de exemplo
    const testImageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
    const testPrompt = 'troque a cor para vermelho';
    
    console.log('🖼️ Testando com imagem:', testImageUrl);
    console.log('📝 Prompt:', testPrompt);
    
    const input = {
      prompt: testPrompt,
      image_input: [testImageUrl],
      output_format: 'jpg'
    };

    console.log('⏳ Enviando requisição para o Replicate...');
    const output = await replicate.run("google/nano-banana", { input });

    console.log('✅ Processamento concluído!');
    console.log('🔗 URL da imagem processada:', output);
    
    return {
      success: true,
      imageUrl: output,
      message: 'Teste realizado com sucesso!'
    };

  } catch (error) {
    console.error('❌ Erro ao testar Replicate API:', error.message);
    
    if (error.message.includes('401')) {
      console.error('🔑 Erro de autenticação. Verifique se o token da API está correto.');
    } else if (error.message.includes('429')) {
      console.error('⏰ Rate limit excedido. Tente novamente em alguns minutos.');
    } else if (error.message.includes('500')) {
      console.error('🔧 Erro interno do servidor. Tente novamente mais tarde.');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🍌 Teste de Integração - Replicate API');
  console.log('=====================================');
  
  if (!REPLICATE_API_TOKEN || REPLICATE_API_TOKEN === 'your-replicate-api-token-here') {
    console.error('❌ Token da API do Replicate não configurado!');
    console.log('📝 Configure a variável de ambiente REPLICATE_API_TOKEN');
    console.log('💡 Exemplo: export REPLICATE_API_TOKEN="r8_your-token-here"');
    process.exit(1);
  }
  
  const result = await testReplicateConnection();
  
  if (result.success) {
    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('✅ A integração com Replicate está funcionando');
    console.log('🚀 Você pode agora usar as funcionalidades de IA no projeto');
  } else {
    console.log('\n💥 Teste falhou');
    console.log('❌ Verifique a configuração e tente novamente');
    process.exit(1);
  }
}

// Executar teste
main().catch(console.error);
