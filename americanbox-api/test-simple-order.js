const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testSimpleOrderCreate() {
  console.log('🧪 Testing Simple Order Creation...\n');

  try {
    // 1. Login
    console.log('1. 🔐 Login como admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      username: 'admin',
      password: 'password'
    });
    
    const sessionCookie = loginResponse.headers['set-cookie']?.[0];
    const axiosInstance = axios.create({
      headers: { 'Cookie': sessionCookie }
    });

    console.log('   ✅ Login exitoso');

    // 2. Test existing endpoint first
    console.log('\n2. 📋 Probando endpoint existente de estadísticas...');
    try {
      const statsResponse = await axiosInstance.get(`${BASE_URL}/api/admin/stats`);
      console.log('   ✅ Stats endpoint funciona:', Object.keys(statsResponse.data));
    } catch (error) {
      console.log('   ❌ Stats endpoint falló:', error.response?.status, error.response?.data);
    }

    // 3. Test debug endpoint first
    console.log('\n3. 🔍 Probando endpoint de debug...');
    const debugData = {
      guide: `DEBUG${Date.now()}`,
      user_id: 1,
      total: 25.99
    };
    try {
      const debugResponse = await axiosInstance.post(`${BASE_URL}/api/admin/orders-debug`, debugData);
      console.log('   ✅ Debug endpoint funciona:', debugResponse.data);
    } catch (error) {
      console.log('   ❌ Error en debug endpoint:', error.response?.status, error.response?.data);
    }

    // 4. Test order creation with minimal data
    console.log('\n4. 📝 Probando creación de orden con datos mínimos...');
    const simpleOrderData = {
      guide: `SIMPLE${Date.now()}`,
      user_id: 1,
      total: 25.99  // Agregar valor explícito de total
      // No incluir address_id, status para que use valores por defecto
    };

    console.log('Datos a enviar:', simpleOrderData);

    try {
      const createResponse = await axiosInstance.post(`${BASE_URL}/api/admin/orders`, simpleOrderData);
      console.log('   ✅ Orden creada exitosamente:', createResponse.data);
    } catch (error) {
      console.log('   ❌ Error creando orden:', error.response?.status, error.response?.data);
    }

    // 5. Try to list orders to see if any exist
    console.log('\n5. 📋 Probando listado de órdenes...');
    try {
      const listResponse = await axiosInstance.get(`${BASE_URL}/api/admin/orders/list?limit=3`);
      console.log('   ✅ Listado exitoso. Total órdenes:', listResponse.data.total);
      if (listResponse.data.items && listResponse.data.items.length > 0) {
        console.log('   📦 Primera orden:', listResponse.data.items[0]);
      }
    } catch (error) {
      console.log('   ❌ Error en listado:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run test
testSimpleOrderCreate();