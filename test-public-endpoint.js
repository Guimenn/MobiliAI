// Script para testar o endpoint público de produtos
const API_URL = 'http://localhost:3001/api';

async function testPublicEndpoint() {
  try {
    console.log('🧪 Testando endpoint público de produtos...');
    
    const response = await fetch(`${API_URL}/public/products?limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sucesso! Dados recebidos:');
      console.log('📦 Total de produtos:', data.products?.length || 0);
      console.log('📄 Paginação:', data.pagination);
      
      if (data.products && data.products.length > 0) {
        console.log('🛋️ Primeiro produto:');
        console.log('  - Nome:', data.products[0].name);
        console.log('  - Categoria:', data.products[0].category);
        console.log('  - Preço:', data.products[0].price);
        console.log('  - Estoque:', data.products[0].stock);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro:', response.status, response.statusText);
      console.log('📄 Resposta:', errorText);
    }
  } catch (error) {
    console.error('💥 Erro na requisição:', error.message);
  }
}

// Executar teste
testPublicEndpoint();
