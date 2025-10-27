const http = require('http');

function testNewAdminStatsHttp() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/admin/stats',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('🔍 Probando el nuevo endpoint /api/admin/stats...\n');

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.ok) {
            console.log('✅ Endpoint funcionando correctamente\n');
            console.log('📊 Respuesta del servidor:');
            console.log(JSON.stringify(response, null, 2));
            
            if (response.orderStats) {
              console.log('\n📈 Estadísticas de paquetes por estado:');
              console.log(`  📍 Pre alerta: ${response.orderStats.prealerta}`);
              console.log(`  🏢 Captado en agencia: ${response.orderStats.captado}`);
              console.log(`  🚚 Despachado: ${response.orderStats.viajando}`);
              console.log(`  🛂 En aduana: ${response.orderStats.aduana}`);
              console.log(`  💸 En espera de pago: ${response.orderStats.esperaPago}`);
              console.log(`  ✅ Pago aprobado: ${response.orderStats.pagoOk}`);
              console.log(`  📦 Entregado: ${response.orderStats.entregado}`);
              console.log(`  📊 Total paquetes: ${response.orderStats.totalOrders}`);
              console.log(`  💰 Monto total: $${response.orderStats.totalAmount}`);
            } else {
              console.log('❌ No se encontraron orderStats en la respuesta');
            }
          } else {
            console.log(`❌ Error ${res.statusCode}:`, response.error || data);
          }
          resolve();
        } catch (error) {
          console.error('❌ Error parseando respuesta:', error.message);
          console.log('Respuesta raw:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error haciendo la petición:', error.message);
      reject(error);
    });

    req.end();
  });
}

testNewAdminStatsHttp();