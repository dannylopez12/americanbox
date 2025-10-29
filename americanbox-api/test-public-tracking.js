const axios = require('axios');

const API_URL = 'http://localhost:4000';

async function testPublicTracking() {
  console.log('🔍 Probando endpoint público de tracking...');
  
  try {
    // 1. Probar con guía existente
    console.log('\n1. Probando con guía existente (ECABC20250002)...');
    const response1 = await axios.get(`${API_URL}/api/tracking/ECABC20250002`);
    
    if (response1.data?.ok && response1.data?.tracking) {
      const tracking = response1.data.tracking;
      console.log('✅ Tracking encontrado:');
      console.log(`  - Guía: ${tracking.guide}`);
      console.log(`  - Estado: ${tracking.status}`);
      console.log(`  - Cliente: ${tracking.customer_name}`);
      console.log(`  - Dirección: ${tracking.address}`);
      console.log(`  - Total: $${tracking.total}`);
      console.log(`  - Historial: ${tracking.history.length} eventos`);
      
      console.log('\n📋 Historial de tracking:');
      tracking.history.forEach((h, i) => {
        const status = h.completed ? '✅' : '⏳';
        console.log(`  ${i + 1}. ${status} ${h.fecha} - ${h.estado}: ${h.detalle}`);
      });
    } else {
      console.log('❌ Error:', response1.data);
    }
    
    // 2. Probar con guía inexistente
    console.log('\n2. Probando con guía inexistente...');
    try {
      await axios.get(`${API_URL}/api/tracking/NOEXISTE123`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctamente devuelve 404 para guía inexistente');
        console.log(`   Error: ${error.response.data.error}`);
      } else {
        console.log('❌ Error inesperado:', error.response?.data || error.message);
      }
    }
    
    // 3. Probar con guía vacía
    console.log('\n3. Probando con guía vacía...');
    try {
      await axios.get(`${API_URL}/api/tracking/`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Ruta no encontrada correctamente (endpoint requiere guía)');
      } else {
        console.log('❌ Error inesperado:', error.response?.data || error.message);
      }
    }
    
    console.log('\n🎉 Pruebas de tracking público completadas!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

testPublicTracking();