const axios = require('axios');

async function testDeleteOrder() {
  try {
    console.log('🔧 Iniciando test de DELETE order...');
    
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
    
    // 2. Primero crear una orden para eliminar
    console.log('2. Creando orden de prueba para eliminar...');
    const createResponse = await axios.post('http://localhost:4000/api/admin/orders', {
      guide: 'DELETE-TEST',
      user_id: 1,
      address_id: 1,
      total: 50.00,
      status: 'pre_alert'
    }, {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      }
    });
    
    const newOrderId = createResponse.data.orderId;
    console.log('✅ Orden creada para test:', newOrderId);
    
    // 3. Eliminar la orden
    console.log('3. Eliminando orden...');
    const deleteResponse = await axios.delete(`http://localhost:4000/api/admin/orders/${newOrderId}`, {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log('✅ Orden eliminada exitosamente:', deleteResponse.data);
    
    // 4. Verificar que la orden ya no existe
    console.log('4. Verificando que la orden ya no existe...');
    try {
      await axios.delete(`http://localhost:4000/api/admin/orders/${newOrderId}`, {
        headers: {
          'Cookie': sessionCookie
        }
      });
      console.log('❌ Error: La orden aún existe');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Confirmado: La orden ya no existe');
      } else {
        console.log('❌ Error inesperado:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDeleteOrder();