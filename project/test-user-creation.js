const fetch = require('node-fetch');

async function testUserCreation() {
  try {
    // Primeiro, fazer login para obter token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@loja.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.error('Erro no login:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login realizado com sucesso');
    console.log('Token:', loginData.token);

    // Agora testar criação de usuário
    const userData = {
      name: 'Teste Usuário',
      email: 'teste@teste.com',
      password: '123456',
      role: 'CASHIER',
      storeId: '1', // Assumindo que existe uma loja com ID 1
      phone: '(11) 99999-9999',
      address: 'Rua Teste, 123'
    };

    console.log('Dados do usuário:', userData);

    const createResponse = await fetch('http://localhost:3001/api/admin/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    console.log('Status da resposta:', createResponse.status);
    
    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('Usuário criado com sucesso:', result);
    } else {
      const errorData = await createResponse.json();
      console.error('Erro ao criar usuário:', errorData);
    }

  } catch (error) {
    console.error('Erro:', error);
  }
}

testUserCreation();
