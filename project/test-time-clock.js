const axios = require('axios');

async function testTimeClock() {
  try {
    console.log('🧪 Testando endpoint de time-clock...');
    
    // Dados de teste
    const timeClockData = {
      employeeId: 'test-employee-id', // Vamos usar um ID de teste
      photo: 'data:image/jpeg;base64,test-photo-data',
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'São Paulo, SP, Brasil',
      notes: 'Teste de registro de ponto'
    };
    
    console.log('📤 Enviando dados:', JSON.stringify(timeClockData, null, 2));
    
    const response = await axios.post('http://localhost:3001/api/admin/time-clock', timeClockData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Token de teste
      }
    });
    
    console.log('✅ Resposta do servidor:', response.data);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testTimeClock();
