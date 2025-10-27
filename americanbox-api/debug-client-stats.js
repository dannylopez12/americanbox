const axios = require('axios');

const API_URL = 'http://localhost:4000';

// Cookie de prueba obtenida del navegador
const testCookie = 'connect.sid=s%3A_kvuTXAhJhwx1EKR2txo9QrvnhfJJozM.oB4aZTi6zUiWEaq5mDLP0b4ZqAMI4LlK%2BPQSohs4VZo';

async function debugClientStats() {
  console.log('🔍 Depurando formato de datos del endpoint client/stats...');
  
  try {
    // 1. Login primero
    console.log('\n1. Autenticando como cliente...');
    const loginResponse = await axios.post(`${API_URL}/api/login`, {
      username: 'Dannyadmin1',
      password: 'newpassword123'
    }, {
      withCredentials: true
    });
    
    console.log('✅ Login exitoso');
    
    // 2. Obtener estadísticas 
    console.log('\n2. Obteniendo estadísticas del cliente...');
    const statsResponse = await axios.get(`${API_URL}/api/client/stats`, {
      withCredentials: true,
      headers: {
        'Cookie': loginResponse.headers['set-cookie']?.[0] || ''
      }
    });
    
    console.log('📊 Datos recibidos:');
    console.log('Raw response:', JSON.stringify(statsResponse.data, null, 2));
    
    if (statsResponse.data?.ok && statsResponse.data?.stats) {
      const stats = statsResponse.data.stats;
      console.log('\n📈 Estadísticas parseadas:');
      console.log(`- totalOrders: ${stats.totalOrders} (tipo: ${typeof stats.totalOrders})`);
      console.log(`- totalAmount: ${stats.totalAmount} (tipo: ${typeof stats.totalAmount})`);
      console.log(`- prealerta: ${stats.prealerta} (tipo: ${typeof stats.prealerta})`);
      console.log(`- captado: ${stats.captado} (tipo: ${typeof stats.captado})`);
      console.log(`- viajando: ${stats.viajando} (tipo: ${typeof stats.viajando})`);
      console.log(`- aduana: ${stats.aduana} (tipo: ${typeof stats.aduana})`);
      console.log(`- esperaPago: ${stats.esperaPago} (tipo: ${typeof stats.esperaPago})`);
      console.log(`- pagoOk: ${stats.pagoOk} (tipo: ${typeof stats.pagoOk})`);
      console.log(`- entregado: ${stats.entregado} (tipo: ${typeof stats.entregado})`);
      
      // Test de toFixed
      console.log('\n🧪 Probando toFixed:');
      try {
        const formatted = stats.totalAmount.toFixed(2);
        console.log(`✅ totalAmount.toFixed(2) = ${formatted}`);
      } catch (error) {
        console.log(`❌ Error en toFixed: ${error.message}`);
        console.log(`💡 Valor actual: ${stats.totalAmount} (${typeof stats.totalAmount})`);
        
        // Intentar convertir a número
        const numValue = Number(stats.totalAmount);
        console.log(`💡 Number(totalAmount) = ${numValue} (${typeof numValue})`);
        if (!isNaN(numValue)) {
          console.log(`✅ Convertido: ${numValue.toFixed(2)}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugClientStats();