const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Função para testar os endpoints do dashboard
async function testDashboardEndpoints() {
  try {
    console.log('🧪 Testando endpoints do dashboard...\n');

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
      console.log('❌ Nenhuma loja encontrada. Criando uma loja de teste...');
      
      const newStore = await axios.post(`${API_BASE_URL}/admin/stores`, {
        name: 'Loja Teste Dashboard',
        address: 'Rua Teste, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        phone: '(11) 99999-9999',
        email: 'teste@loja.com',
        isActive: true
      }, { headers });
      
      const storeId = newStore.data.id;
      console.log(`✅ Loja criada com ID: ${storeId}\n`);
    } else {
      const storeId = stores[0].id;
      console.log(`✅ Usando loja existente: ${storeId}\n`);
    }

    const storeId = stores.length > 0 ? stores[0].id : newStore.data.id;

    // Testar endpoint de overview
    console.log('3. Testando /dashboard/store/:storeId/overview...');
    const overviewResponse = await axios.get(`${API_BASE_URL}/dashboard/store/${storeId}/overview`, { headers });
    console.log('✅ Overview:', JSON.stringify(overviewResponse.data, null, 2));

    // Testar endpoint de vendas
    console.log('\n4. Testando /dashboard/store/:storeId/sales...');
    const salesResponse = await axios.get(`${API_BASE_URL}/dashboard/store/${storeId}/sales`, { headers });
    console.log('✅ Sales:', JSON.stringify(salesResponse.data, null, 2));

    // Testar endpoint de frequência
    console.log('\n5. Testando /dashboard/store/:storeId/attendance...');
    const attendanceResponse = await axios.get(`${API_BASE_URL}/dashboard/store/${storeId}/attendance`, { headers });
    console.log('✅ Attendance:', JSON.stringify(attendanceResponse.data, null, 2));

    // Testar endpoint de performance dos funcionários
    console.log('\n6. Testando /dashboard/store/:storeId/employee-performance...');
    const performanceResponse = await axios.get(`${API_BASE_URL}/dashboard/store/${storeId}/employee-performance`, { headers });
    console.log('✅ Employee Performance:', JSON.stringify(performanceResponse.data, null, 2));

    // Testar endpoint de atividade recente
    console.log('\n7. Testando /dashboard/store/:storeId/recent-activity...');
    const activityResponse = await axios.get(`${API_BASE_URL}/dashboard/store/${storeId}/recent-activity`, { headers });
    console.log('✅ Recent Activity:', JSON.stringify(activityResponse.data, null, 2));

    console.log('\n🎉 Todos os endpoints do dashboard estão funcionando!');

  } catch (error) {
    console.error('❌ Erro ao testar endpoints:', error.response?.data || error.message);
  }
}

// Executar os testes
testDashboardEndpoints();
