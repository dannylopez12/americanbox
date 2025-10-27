const axios = require('axios');

async function testPutOrder() {
  try {
    console.log('🔧 Iniciando test de PUT order...');
    
    // 1. Login
    console.log('1. Haciendo login...');
    const loginResponse = await axios.post('http://localhost:4000/api/login', {
      username: 'admin',
      password: 'password'
    });
    
    const cookies = loginResponse.headers['set-cookie'];
    const sessionCookie = cookies.find(cookie => cookie.startsWith('connect.sid'));
    
    if (!sessionCookie) {
      throw new Error('No se pudo obtener la cookie de sesión');
    }
    
    console.log('✅ Login exitoso');
    
    // 2. Consultar órdenes existentes
    console.log('2. Consultando órdenes existentes...');
    const ordersResponse = await axios.get('http://localhost:4000/api/admin/orders', {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log('✅ Órdenes obtenidas:', ordersResponse.data.orders.length);
    
    // 3. Buscar orden 21
    const order21 = ordersResponse.data.orders.find(order => order.id === 21);
    if (!order21) {
      console.log('❌ No se encontró la orden 21');
      return;
    }
    
    console.log('✅ Orden 21 encontrada:', order21);
    
    // 4. Intentar actualizar la orden
    console.log('3. Intentando actualizar orden 21...');
    const updateResponse = await axios.put('http://localhost:4000/api/admin/orders/21', {
      guide: 'TEST123-UPDATED',
      user_id: 1,
      address_id: 1,
      total: 150.00,
      status: 'pre_alert'
    }, {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Orden actualizada exitosamente:', updateResponse.data);
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPutOrder();