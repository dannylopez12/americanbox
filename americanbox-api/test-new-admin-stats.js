// Test del nuevo endpoint de estadísticas con orderStats
const fetch = require('node-fetch');

async function testNewAdminStats() {
  try {
    console.log('🔍 Probando el nuevo endpoint /api/admin/stats...\n');

    // Probar el endpoint (sin autenticación por ahora para ver la estructura)
    const response = await fetch('http://localhost:4000/api/admin/stats');
    const data = await response.json();
    
    if (response.ok && data.ok) {
      console.log('✅ Endpoint funcionando correctamente\n');
      console.log('📊 Respuesta del servidor:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.orderStats) {
        console.log('\n📈 Estadísticas de paquetes por estado:');
        console.log(`  📍 Pre alerta: ${data.orderStats.prealerta}`);
        console.log(`  🏢 Captado en agencia: ${data.orderStats.captado}`);
        console.log(`  🚚 Despachado: ${data.orderStats.viajando}`);
        console.log(`  🛂 En aduana: ${data.orderStats.aduana}`);
        console.log(`  💸 En espera de pago: ${data.orderStats.esperaPago}`);
        console.log(`  ✅ Pago aprobado: ${data.orderStats.pagoOk}`);
        console.log(`  📦 Entregado: ${data.orderStats.entregado}`);
        console.log(`  📊 Total paquetes: ${data.orderStats.totalOrders}`);
        console.log(`  💰 Monto total: $${data.orderStats.totalAmount}`);
      } else {
        console.log('❌ No se encontraron orderStats en la respuesta');
      }
    } else {
      console.log('❌ Error en el endpoint:', data.error || 'Error desconocido');
    }
  } catch (error) {
    console.error('❌ Error haciendo la petición:', error.message);
  }
}

testNewAdminStats();