const mysql = require('mysql2/promise');

async function testOrderCreationWithPricing() {
  console.log('🧪 TESTING CREACIÓN DE ORDEN CON PRECIOS');
  console.log('==========================================');
  
  const BASE_URL = 'http://localhost:4000';
  
  try {
    // 1. Primero necesitamos hacer login de admin
    console.log('\n1. 🔐 Login de admin...');
    
    const loginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@americanbox.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Login falló');
    }
    
    const loginData = await loginResponse.json();
    console.log('   ✅ Login exitoso');
    
    // 2. Obtener lista de usuarios para usar uno en la prueba
    console.log('\n2. 👥 Obteniendo usuarios...');
    
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { 
        'Cookie': `session=${loginData.sessionId}` 
      }
    });
    
    if (!usersResponse.ok) {
      throw new Error('No se pudieron obtener usuarios');
    }
    
    const usersData = await usersResponse.json();
    if (!usersData.data || usersData.data.length === 0) {
      throw new Error('No hay usuarios disponibles');
    }
    
    const testUser = usersData.data[0];
    console.log(`   ✅ Usuario de prueba: ${testUser.id} (${testUser.email})`);
    
    // 3. Crear orden SIN peso (debe usar total manual)
    console.log('\n3. 📦 Creando orden sin peso...');
    
    const orderWithoutWeight = {
      guide: `TEST-NO-PESO-${Date.now()}`,
      user_id: testUser.id,
      status: 'Pre alerta',
      total: 25.00 // Total manual
    };
    
    const orderResponse1 = await fetch(`${BASE_URL}/api/admin/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `session=${loginData.sessionId}` 
      },
      body: JSON.stringify(orderWithoutWeight)
    });
    
    const orderData1 = await orderResponse1.json();
    console.log('   ✅ Orden sin peso creada:', orderData1.ok ? 'ÉXITO' : 'FALLÓ');
    console.log(`   💰 Total: $${orderWithoutWeight.total} (manual)`);
    
    // 4. Crear orden CON peso (debe calcular automáticamente)
    console.log('\n4. 📦 Creando orden con peso...');
    
    const orderWithWeight = {
      guide: `TEST-CON-PESO-${Date.now()}`,
      user_id: testUser.id,
      status: 'Pre alerta',
      weight_lbs: 4.5 // 4.5 libras
      // No incluimos total para que se calcule automáticamente
    };
    
    const orderResponse2 = await fetch(`${BASE_URL}/api/admin/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': `session=${loginData.sessionId}` 
      },
      body: JSON.stringify(orderWithWeight)
    });
    
    const orderData2 = await orderResponse2.json();
    console.log('   ✅ Orden con peso creada:', orderData2.ok ? 'ÉXITO' : 'FALLÓ');
    if (orderData2.calculatedPrice) {
      console.log(`   💰 Precio calculado automáticamente: $${orderData2.calculatedPrice}`);
      console.log(`   🧮 Cálculo: ${orderWithWeight.weight_lbs} lbs × $3.50 = $${orderWithWeight.weight_lbs * 3.50}`);
    }
    
    // 5. Verificar órdenes creadas en base de datos
    console.log('\n5. 🔍 Verificando en base de datos...');
    
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'americanbox'
    });
    
    const conn = await pool.getConnection();
    const [orders] = await conn.query(`
      SELECT guide, weight_lbs, total 
      FROM orders 
      WHERE guide LIKE 'TEST-%' 
      ORDER BY id DESC 
      LIMIT 2
    `);
    
    orders.forEach(order => {
      console.log(`   📋 ${order.guide}: ${order.weight_lbs || 'sin peso'} lbs = $${order.total}`);
    });
    
    conn.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n🎉 PRUEBA DE INTEGRACIÓN COMPLETADA');
}

// Verificar si fetch está disponible, si no, usar una alternativa
if (typeof fetch === 'undefined') {
  console.log('⚠️  fetch no disponible, instalando node-fetch...');
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    console.log('❌ node-fetch no instalado. Instalar con: npm install node-fetch@2');
    process.exit(1);
  }
}

testOrderCreationWithPricing();