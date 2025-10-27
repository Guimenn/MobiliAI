const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testStoreHours() {
  try {
    console.log('🧪 Testando dados de horário de funcionamento...\n');

    // Primeiro, vamos fazer login para obter o token
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso\n');

    // Headers com autenticação
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Buscar lojas para obter um ID válido
    console.log('2. Buscando lojas...');
    const storesResponse = await axios.get(`${API_BASE_URL}/admin/stores`, { headers });
    const stores = storesResponse.data;
    
    if (stores.length === 0) {
      console.log('❌ Nenhuma loja encontrada.');
      return;
    }

    const storeId = stores[0].id;
    console.log(`✅ Usando loja: ${stores[0].name} (ID: ${storeId})\n`);

    // Buscar detalhes da loja
    console.log('3. Buscando detalhes da loja...');
    const storeDetailsResponse = await axios.get(`${API_BASE_URL}/admin/stores/${storeId}`, { headers });
    const storeDetails = storeDetailsResponse.data;
    
    console.log('📊 Dados da loja:');
    console.log(`- Nome: ${storeDetails.name}`);
    console.log(`- Endereço: ${storeDetails.address}`);
    console.log(`- Horário de abertura: ${storeDetails.openingTime || 'Não configurado'}`);
    console.log(`- Horário de fechamento: ${storeDetails.closingTime || 'Não configurado'}`);
    console.log(`- Dias de funcionamento: ${JSON.stringify(storeDetails.workingDays || [])}`);
    console.log(`- Início do almoço: ${storeDetails.lunchStart || 'Não configurado'}`);
    console.log(`- Fim do almoço: ${storeDetails.lunchEnd || 'Não configurado'}\n`);

    // Testar atualização de horário
    console.log('4. Testando atualização de horário...');
    const updateData = {
      openingTime: '08:00',
      closingTime: '18:00',
      workingDays: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
      lunchStart: '12:00',
      lunchEnd: '13:00'
    };

    const updateResponse = await axios.put(`${API_BASE_URL}/admin/stores/${storeId}`, updateData, { headers });
    console.log('✅ Horário atualizado com sucesso\n');

    // Verificar se os dados foram salvos
    console.log('5. Verificando dados atualizados...');
    const updatedStoreResponse = await axios.get(`${API_BASE_URL}/admin/stores/${storeId}`, { headers });
    const updatedStore = updatedStoreResponse.data;
    
    console.log('📊 Dados atualizados:');
    console.log(`- Horário de abertura: ${updatedStore.openingTime}`);
    console.log(`- Horário de fechamento: ${updatedStore.closingTime}`);
    console.log(`- Dias de funcionamento: ${JSON.stringify(updatedStore.workingDays)}`);
    console.log(`- Início do almoço: ${updatedStore.lunchStart}`);
    console.log(`- Fim do almoço: ${updatedStore.lunchEnd}\n`);

    console.log('🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao testar horário de funcionamento:', error.response?.data || error.message);
  }
}

// Executar os testes
testStoreHours();

