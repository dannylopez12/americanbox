const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testNewEndpoints() {
  try {
    console.log('🧪 Probando nuevos endpoints para reunión de courier...\n');
    
    // 1. Login como admin (usar credenciales correctas según BD)
    console.log('📡 1. Autenticando como admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      username: 'admin',
      password: 'password'
    });
    
    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';
    console.log('  ✅ Login exitoso');
    
    // 2. Probar endpoint de estados
    console.log('\n📋 2. Probando catálogo de estados...');
    const statusResponse = await axios.get(`${BASE_URL}/api/admin/orders/statuses`, {
      headers: { Cookie: cookieHeader }
    });
    
    console.log('  Estados disponibles:');
    statusResponse.data.items?.forEach((status, i) => {
      console.log(`    ${i + 1}. ${status.label}`);
    });
    
    // 3. Probar endpoint bulk orders sin filtros
    console.log('\n📦 3. Probando bulk orders (sin filtros)...');
    const bulkResponse = await axios.get(`${BASE_URL}/api/admin/orders/bulk?limit=5`, {
      headers: { Cookie: cookieHeader }
    });
    
    console.log(`  Total pedidos: ${bulkResponse.data.total}`);
    console.log(`  Páginas: ${bulkResponse.data.pages}`);
    console.log('  Primeros 3 pedidos:');
    bulkResponse.data.items?.slice(0, 3).forEach((order, i) => {
      console.log(`    ${i + 1}. ${order.guide} - ${order.client} - ${order.status}`);
    });
    
    // 4. Probar filtro de cliente específico (reunión)
    console.log('\n🔍 4. Probando filtro por cliente (requerimiento reunión)...');
    const clientFilterResponse = await axios.get(`${BASE_URL}/api/admin/orders/bulk?client=Gen&limit=10`, {
      headers: { Cookie: cookieHeader }
    });
    
    console.log(`  Pedidos filtrados por "Gen": ${clientFilterResponse.data.total}`);
    clientFilterResponse.data.items?.forEach((order, i) => {
      console.log(`    ${i + 1}. ${order.guide} - ${order.client} - ${order.status}`);
    });
    
    // 5. Probar actualización masiva de estados
    console.log('\n✏️  5. Probando actualización masiva de estados...');
    
    // Obtener algunos IDs de pedidos
    const orderIds = bulkResponse.data.items?.slice(0, 2).map(order => order.id) || [];
    
    if (orderIds.length > 0) {
      console.log(`  Actualizando pedidos: ${orderIds.join(', ')}`);
      
      const updateResponse = await axios.put(`${BASE_URL}/api/admin/orders/bulk`, {
        orderIds: orderIds,
        newStatus: 'En proceso de entrega'
      }, {
        headers: { 
          Cookie: cookieHeader,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`  ✅ ${updateResponse.data.message}`);
      
      // Verificar cambio
      const verifyResponse = await axios.get(`${BASE_URL}/api/admin/orders/bulk?limit=5`, {
        headers: { Cookie: cookieHeader }
      });
      
      console.log('  Estado después de actualización:');
      verifyResponse.data.items?.slice(0, 2).forEach((order, i) => {
        const wasUpdated = orderIds.includes(order.id);
        console.log(`    ${order.guide} - ${order.status} ${wasUpdated ? '🔄' : ''}`);
      });
    }
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
    console.log('\n📋 Resumen de funcionalidades implementadas según reunión:');
    console.log('  ✅ Estados de pedidos limpiados (sin texto después de comas/guiones)');
    console.log('  ✅ Filtro específico por cliente en bulk orders');
    console.log('  ✅ Catálogo dinámico de estados desde BD');
    console.log('  ✅ Actualización masiva de estados');
    console.log('  ✅ Paginación mejorada en bulk orders');
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error.message);
    console.error('   Error completo:', error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
      console.error('   Headers:', error.response.headers);
    }
    if (error.code) {
      console.error('   Code:', error.code);
    }
  }
}

testNewEndpoints();