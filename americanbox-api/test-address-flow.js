const mysql = require('mysql2/promise');

async function testRegistrationFlow() {
  console.log('🧪 TESTING: Flujo de Registro con Direcciones Automáticas');
  console.log('=======================================================');
  
  const BASE_URL = 'http://localhost:4000';
  
  try {
    // 1. Crear usuario de prueba
    console.log('\n1. 👤 Creando usuario de prueba...');
    
    const testUser = {
      names: 'Usuario Prueba Casillero',
      email: `test-casillero-${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: 'test123',
      address: 'Av. Prueba 123, Sector Norte',
      city: 'Quito'
    };
    
    console.log('   📋 Datos del usuario:', {
      names: testUser.names,
      email: testUser.email,
      username: testUser.username,
      address: testUser.address,
      city: testUser.city
    });
    
    const registerResponse = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (!registerResponse.ok) {
      const errorData = await registerResponse.json();
      throw new Error(`Error en registro: ${errorData.error || 'Unknown'}`);
    }
    
    const registerData = await registerResponse.json();
    console.log('   ✅ Usuario registrado exitosamente');
    console.log('   📊 Customer ID:', registerData.customer_id);
    
    // 2. Verificar que se creó la dirección automáticamente
    console.log('\n2. 📍 Verificando dirección automática...');
    
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'americanbox'
    });
    
    const conn = await pool.getConnection();
    
    // Buscar el usuario creado
    const [users] = await conn.query(
      'SELECT id, username, customer_id FROM users WHERE username = ?',
      [testUser.username]
    );
    
    if (users.length === 0) {
      throw new Error('Usuario no encontrado después del registro');
    }
    
    const createdUser = users[0];
    console.log(`   👤 Usuario encontrado: ID ${createdUser.id}, Customer ${createdUser.customer_id}`);
    
    // Verificar que se creó la dirección
    const [addresses] = await conn.query(
      'SELECT id, address, city FROM addresses WHERE user_id = ?',
      [createdUser.id]
    );
    
    if (addresses.length === 0) {
      console.log('   ❌ NO se creó dirección automática');
    } else {
      console.log(`   ✅ Dirección automática creada: ID ${addresses[0].id}`);
      console.log(`      📍 Dirección: ${addresses[0].address}`);
      console.log(`      🏙️  Ciudad: ${addresses[0].city}`);
    }
    
    // 3. Probar creación de orden con el nuevo usuario
    console.log('\n3. 📦 Probando creación de orden...');
    
    // Simular login de admin para crear orden
    const loginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      
      // Crear orden para el usuario de prueba
      const testOrder = {
        guide: `TEST-CASILLERO-${Date.now()}`,
        user_id: createdUser.id,
        status: 'Pre alerta',
        weight_lbs: 2.5
        // No incluimos address_id para que use la automática
      };
      
      const orderResponse = await fetch(`${BASE_URL}/api/admin/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': `session=${loginData.sessionId}`
        },
        body: JSON.stringify(testOrder)
      });
      
      const orderData = await orderResponse.json();
      
      if (orderData.ok) {
        console.log('   ✅ Orden creada exitosamente');
        console.log(`   📋 ID de orden: ${orderData.orderId}`);
        if (orderData.calculatedPrice) {
          console.log(`   💰 Precio calculado: $${orderData.calculatedPrice}`);
        }
        
        // Verificar la orden en BD
        const [orderCheck] = await conn.query(
          'SELECT guide, address_id, total FROM orders WHERE id = ?',
          [orderData.orderId]
        );
        
        if (orderCheck.length > 0) {
          console.log(`   📍 Orden usa dirección ID: ${orderCheck[0].address_id}`);
          console.log(`   💵 Total: $${orderCheck[0].total}`);
        }
        
      } else {
        console.log('   ❌ Error creando orden:', orderData.error);
      }
      
    } else {
      console.log('   ⚠️  No se pudo hacer login de admin para probar orden');
    }
    
    conn.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n🎉 PRUEBA DE FLUJO COMPLETADA');
}

// Verificar si fetch está disponible
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    console.log('❌ node-fetch no instalado. Instalar con: npm install node-fetch@2');
    process.exit(1);
  }
}

testRegistrationFlow();