// Test simple para verificar que el servidor esté corriendo
const axios = require('axios');

async function testServer() {
  try {
    console.log('🔍 Verificando si el servidor está corriendo...\n');
    
    // Test 1: Endpoint base
    try {
      const baseResponse = await axios.get('http://localhost:4000/');
      console.log('✅ Server base response:', baseResponse.status);
    } catch (e) {
      console.log('❌ Server base error:', e.message);
    }

    // Test 2: Test de endpoints disponibles
    try {
      const testResponse = await axios.get('http://localhost:4000/api/test');
      console.log('✅ Test endpoint response:', testResponse.status, testResponse.data);
    } catch (e) {
      console.log('❌ Test endpoint error:', e.message);
    }

    // Test 3: Verificar auth endpoint
    try {
      const authResponse = await axios.post('http://localhost:4000/api/auth/login', {
        username: 'admin',
        password: 'password'
      });
      console.log('✅ Auth response:', authResponse.status);
    } catch (e) {
      console.log('❌ Auth error:', e.response?.status, e.message);
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

testServer();