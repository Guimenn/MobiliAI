const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Test data
const testEmployeeId = 'test-employee-id';
const testTimeClockData = {
  employeeId: testEmployeeId,
  photo: 'data:image/jpeg;base64,test-photo-data',
  latitude: -23.5505,
  longitude: -46.6333,
  address: 'São Paulo, SP, Brasil',
  notes: 'Test time clock entry'
};

async function testTimeClockEndpoints() {
  console.log('🧪 Testing Time Clock Endpoints...\n');

  try {
    // Test 1: Test the register endpoint (unified endpoint)
    console.log('1️⃣ Testing POST /time-clock/register endpoint...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/api/time-clock/register`, testTimeClockData, {
        headers: {
          'Content-Type': 'application/json',
          // Note: In real scenario, you'd need a valid JWT token
          // 'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Register endpoint response:', registerResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('⚠️ Register endpoint error (expected without auth):', error.response.status, error.response.data);
      } else {
        console.log('❌ Register endpoint error:', error.message);
      }
    }

    // Test 2: Test the history endpoint
    console.log('\n2️⃣ Testing GET /time-clock/history/:employeeId endpoint...');
    try {
      const historyResponse = await axios.get(`${API_BASE_URL}/api/time-clock/history/${testEmployeeId}?startDate=2024-01-01&endDate=2024-12-31`, {
        headers: {
          'Content-Type': 'application/json',
          // Note: In real scenario, you'd need a valid JWT token
          // 'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ History endpoint response:', historyResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('⚠️ History endpoint error (expected without auth):', error.response.status, error.response.data);
      } else {
        console.log('❌ History endpoint error:', error.message);
      }
    }

    // Test 3: Test the clock-in endpoint
    console.log('\n3️⃣ Testing POST /time-clock/clock-in endpoint...');
    try {
      const clockInResponse = await axios.post(`${API_BASE_URL}/api/time-clock/clock-in`, testTimeClockData, {
        headers: {
          'Content-Type': 'application/json',
          // Note: In real scenario, you'd need a valid JWT token
          // 'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Clock-in endpoint response:', clockInResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('⚠️ Clock-in endpoint error (expected without auth):', error.response.status, error.response.data);
      } else {
        console.log('❌ Clock-in endpoint error:', error.message);
      }
    }

    // Test 4: Test the clock-out endpoint
    console.log('\n4️⃣ Testing POST /time-clock/clock-out endpoint...');
    try {
      const clockOutResponse = await axios.post(`${API_BASE_URL}/api/time-clock/clock-out`, testTimeClockData, {
        headers: {
          'Content-Type': 'application/json',
          // Note: In real scenario, you'd need a valid JWT token
          // 'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Clock-out endpoint response:', clockOutResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('⚠️ Clock-out endpoint error (expected without auth):', error.response.status, error.response.data);
      } else {
        console.log('❌ Clock-out endpoint error:', error.message);
      }
    }

    console.log('\n🎉 Time Clock endpoints test completed!');
    console.log('Note: Authentication errors are expected since we\'re not providing valid JWT tokens.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testTimeClockEndpoints();
