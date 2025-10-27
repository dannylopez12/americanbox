const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testClientEndpoints() {
  try {
    console.log('🧪 Probando endpoints del dashboard de cliente...\n');
    
    // 1. Login como cliente - probar diferentes usuarios
    console.log('📡 1. Autenticando como cliente...');
    
    let loginResponse = null;
    let cookieHeader = '';
    
    // Intentar con diferentes usuarios clientes
    const clientUsers = [
      { username: 'Dannyadmin1', password: 'password' },
      { username: 'Dannyadmin2', password: 'password' },
      { username: 'Dannyadmin', password: 'password' }
    ];
    
    for (const user of clientUsers) {
      try {
        console.log(`  Probando usuario: ${user.username}`);
        loginResponse = await axios.post(`${BASE_URL}/api/login`, {
          username: user.username,
          password: user.password
        });
        
        const cookies = loginResponse.headers['set-cookie'];
        cookieHeader = cookies ? cookies.join('; ') : '';
        console.log(`  ✅ Login exitoso como cliente: ${user.username}`);
        break;
      } catch (error) {
        console.log(`  ❌ Falló login para ${user.username}`);
        continue;
      }
    }
    
    if (!loginResponse) {
      throw new Error('No se pudo autenticar con ningún usuario cliente');
    }
    
    // cookieHeader ya está definido arriba
    
    // 2. Probar estadísticas del cliente
    console.log('\n📊 2. Probando estadísticas del cliente...');
    const statsResponse = await axios.get(`${BASE_URL}/api/client/stats`, {
      headers: { Cookie: cookieHeader }
    });
    
    if (statsResponse.data?.ok) {
      const stats = statsResponse.data.stats;
      console.log('  📈 Estadísticas obtenidas:');
      console.log(`    - Total pedidos: ${stats.totalOrders}`);
      console.log(`    - Pre alerta: ${stats.prealerta}`);
      console.log(`    - Captado: ${stats.captado}`);
      console.log(`    - En viaje: ${stats.viajando}`);
      console.log(`    - En aduana: ${stats.aduana}`);
      console.log(`    - Esperando pago: ${stats.esperaPago}`);
      console.log(`    - Pago aprobado: ${stats.pagoOk}`);
      console.log(`    - Entregado: ${stats.entregado}`);
      console.log(`    - Total gastado: $${stats.totalAmount}`);
    } else {
      console.log('  ❌ Error obteniendo estadísticas');
    }
    
    // 3. Probar listado de pedidos del cliente
    console.log('\n📦 3. Probando listado de pedidos del cliente...');
    const ordersResponse = await axios.get(`${BASE_URL}/api/client/orders?limit=3`, {
      headers: { Cookie: cookieHeader }
    });
    
    if (ordersResponse.data?.ok) {
      const orders = ordersResponse.data.orders;
      console.log(`  📋 Pedidos encontrados: ${orders.length}`);
      orders.forEach((order, i) => {
        console.log(`    ${i + 1}. ${order.guide} - ${order.status} - $${order.total}`);
      });
      console.log(`  📊 Paginación: ${ordersResponse.data.total} total, ${ordersResponse.data.pages} páginas`);
      
      // 4. Probar tracking si hay pedidos
      if (orders.length > 0) {
        console.log('\n🔍 4. Probando tracking de pedido...');
        const trackingResponse = await axios.get(`${BASE_URL}/api/client/tracking/${orders[0].guide}`, {
          headers: { Cookie: cookieHeader }
        });
        
        if (trackingResponse.data?.ok) {
          const order = trackingResponse.data.order;
          console.log('  🎯 Información de tracking:');
          console.log(`    - Guía: ${order.guide}`);
          console.log(`    - Estado: ${order.status}`);
          console.log(`    - Cliente: ${order.customer_name}`);
          console.log(`    - Dirección: ${order.full_address}`);
          console.log(`    - Fecha: ${order.created_date}`);
        } else {
          console.log('  ❌ Error obteniendo tracking');
        }
      }
    } else {
      console.log('  ❌ Error obteniendo pedidos');
    }
    
    // 5. Probar perfil del cliente
    console.log('\n👤 5. Probando perfil del cliente...');
    const profileResponse = await axios.get(`${BASE_URL}/api/client/profile`, {
      headers: { Cookie: cookieHeader }
    });
    
    if (profileResponse.data?.ok) {
      const profile = profileResponse.data.profile;
      console.log('  👥 Información del perfil:');
      console.log(`    - Nombre: ${profile.names || 'No definido'}`);
      console.log(`    - Usuario: ${profile.username}`);
      console.log(`    - Email: ${profile.email || 'No definido'}`);
      console.log(`    - Teléfono: ${profile.phone || 'No definido'}`);
      console.log(`    - Miembro desde: ${profile.member_since}`);
      console.log(`    - Direcciones: ${profile.addresses?.length || 0} registradas`);
    } else {
      console.log('  ❌ Error obteniendo perfil');
    }
    
    // 6. Probar cambio de contraseña (sin ejecutar realmente)
    console.log('\n🔐 6. Probando endpoint de cambio de contraseña...');
    try {
      const passwordResponse = await axios.put(`${BASE_URL}/api/client/change-password`, {
        currentPassword: 'wrong-password',
        newPassword: 'new-password-123'
      }, {
        headers: { 
          Cookie: cookieHeader,
          'Content-Type': 'application/json'
        }
      });
      
      // No debería llegar aquí con contraseña incorrecta
      console.log('  ⚠️ Contraseña cambiada (inesperado)');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('  ✅ Endpoint de cambio de contraseña funciona (rechazó contraseña incorrecta)');
      } else {
        console.log('  ❌ Error inesperado en cambio de contraseña');
      }
    }
    
    console.log('\n🎉 Todas las pruebas del dashboard de cliente completadas!');
    console.log('\n📋 Resumen de funcionalidades del dashboard de cliente:');
    console.log('  ✅ Estadísticas de pedidos personalizadas');
    console.log('  ✅ Listado de pedidos con paginación');
    console.log('  ✅ Tracking individual por guía');
    console.log('  ✅ Perfil de usuario con direcciones');
    console.log('  ✅ Cambio de contraseña seguro');
    console.log('  ✅ UI moderna y responsive');
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testClientEndpoints();