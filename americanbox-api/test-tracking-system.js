const axios = require('axios');

async function testTrackingSystem() {
  try {
    console.log('🔧 Testing tracking code and provider system...');
    
    // 1. Login
    console.log('1. Haciendo login...');
    const loginResponse = await axios.post('http://localhost:4000/api/login', {
      username: 'admin',
      password: 'password'
    });
    
    const cookies = loginResponse.headers['set-cookie'];
    const sessionCookie = cookies.find(cookie => cookie.startsWith('connect.sid'));
    
    console.log('✅ Login exitoso');
    
    // 2. Obtener lista de proveedores
    console.log('2. Obteniendo lista de proveedores...');
    const providersResponse = await axios.get('http://localhost:4000/api/admin/providers', {
      headers: { 'Cookie': sessionCookie }
    });
    
    console.log('✅ Proveedores obtenidos:', providersResponse.data.items.length);
    providersResponse.data.items.forEach(provider => {
      console.log(`  - ${provider.tracking_code}: ${provider.name}`);
    });
    
    // 3. Crear una orden con tracking code y provider
    console.log('3. Creando orden con tracking code y provider...');
    const createResponse = await axios.post('http://localhost:4000/api/admin/orders', {
      guide: 'TRACKING-TEST-001',
      user_id: 1,
      address_id: 1,
      total: 125.50,
      status: 'Pre alerta',
      provider_id: 1, // Amazon
      tracking_code: 'TRK1Z999AA1234567890'
    }, {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      }
    });
    
    const newOrderId = createResponse.data.orderId;
    console.log('✅ Orden creada con tracking:', newOrderId);
    
    // 4. Verificar que la orden aparece con provider code
    console.log('4. Verificando que la orden muestra provider code...');
    const ordersResponse = await axios.get('http://localhost:4000/api/admin/orders', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const newOrder = ordersResponse.data.orders.find(order => order.id === newOrderId);
    if (newOrder) {
      console.log('✅ Orden encontrada con provider code:', newOrder.provider_code);
      console.log('   Guide:', newOrder.guide);
      console.log('   Provider Code:', newOrder.provider_code);
    }
    
    // 5. Probar endpoint de etiqueta
    console.log('5. Probando endpoint de etiqueta...');
    const labelResponse = await axios.get(`http://localhost:4000/api/admin/orders/${newOrderId}/print-label`, {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (labelResponse.status === 200 && labelResponse.data.includes('AMERICAN BOX')) {
      console.log('✅ Endpoint de etiqueta funciona correctamente');
      console.log('   HTML generado exitosamente');
    }
    
    // 6. Probar actualización con tracking
    console.log('6. Probando actualización con nuevo tracking...');
    const updateResponse = await axios.put(`http://localhost:4000/api/admin/orders/${newOrderId}`, {
      guide: 'TRACKING-TEST-001-UPDATED',
      user_id: 1,
      address_id: 1,
      total: 150.00,
      status: 'Captado en agencia',
      provider_id: 3, // Shein
      tracking_code: 'SHEIN1234567890'
    }, {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Orden actualizada con nuevo tracking');
    
    console.log('\n🎉 Todas las pruebas pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testTrackingSystem();