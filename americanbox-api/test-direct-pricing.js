const mysql = require('mysql2/promise');

async function testOrderPricing() {
  console.log('🧪 TESTING DIRECTO DE PRECIOS EN ÓRDENES');
  console.log('=========================================');
  
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'americanbox'
  });

  try {
    const conn = await pool.getConnection();
    
    // 1. Obtener un usuario de prueba (que no sea admin)
    const [users] = await conn.query('SELECT id, customer_id FROM users WHERE customer_id IS NOT NULL LIMIT 1');
    if (users.length === 0) {
      throw new Error('No hay usuarios clientes en la base de datos');
    }
    
    const testUser = users[0];
    console.log(`✅ Usuario de prueba: ID ${testUser.id}, Customer ${testUser.customer_id}`);
    
    // 2. Obtener la primera dirección de este usuario
    const [addresses] = await conn.query('SELECT id FROM addresses WHERE user_id = ? LIMIT 1', [testUser.id]);
    if (addresses.length === 0) {
      throw new Error('El usuario no tiene direcciones');
    }
    
    const testAddress = addresses[0];
    console.log(`✅ Dirección de prueba: ID ${testAddress.id}`);
    
    // 3. Probar las funciones del servidor
    
    // Función helper para obtener customer_id desde user_id
    async function getCustomerIdFromUserId(conn, userId) {
      const [result] = await conn.query(`
        SELECT c.id as customer_id 
        FROM customers c 
        INNER JOIN users u ON c.id = u.customer_id 
        WHERE u.id = ?
      `, [userId]);
      return result[0]?.customer_id || null;
    }

    // Función de cálculo de precio
    async function calculateOrderPrice(conn, customerId, weightLbs) {
      if (!customerId || !weightLbs) return 0;
      
      // Obtener precio del cliente o usar el precio por defecto
      const [customerPrice] = await conn.query('SELECT price_per_lb FROM customers WHERE id = ?', [customerId]);
      
      let pricePerLb = customerPrice[0]?.price_per_lb;
      if (!pricePerLb) {
        const [defaultPrice] = await conn.query('SELECT default_price_per_lb FROM company_settings LIMIT 1');
        pricePerLb = defaultPrice[0]?.default_price_per_lb || 3.50;
      }
      
      return parseFloat((weightLbs * pricePerLb).toFixed(2));
    }
    
    console.log('\n🧮 Probando cálculos de precio...');
    
    const customerId = await getCustomerIdFromUserId(conn, testUser.id);
    console.log(`   Customer ID: ${customerId}`);
    
    const testWeights = [1.0, 2.5, 5.0, 10.0];
    
    for (const weight of testWeights) {
      const price = await calculateOrderPrice(conn, customerId, weight);
      console.log(`   ${weight} lbs = $${price}`);
    }
    
    // 4. Crear orden de prueba directamente en BD con peso
    console.log('\n📦 Creando orden de prueba...');
    
    const testGuide = `TEST-PRICING-${Date.now()}`;
    const testWeight = 3.75;
    const calculatedPrice = await calculateOrderPrice(conn, customerId, testWeight);
    
    await conn.query(`
      INSERT INTO orders (guide, user_id, address_id, total, status, weight_lbs, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      testGuide,
      testUser.id, 
      testAddress.id,
      calculatedPrice,
      'Pre alerta',
      testWeight
    ]);
    
    console.log(`   ✅ Orden creada: ${testGuide}`);
    console.log(`   📊 Peso: ${testWeight} lbs`);
    console.log(`   💰 Precio calculado: $${calculatedPrice}`);
    
    // 5. Verificar orden creada
    console.log('\n🔍 Verificando orden creada...');
    
    const [newOrder] = await conn.query(`
      SELECT guide, weight_lbs, total, status 
      FROM orders 
      WHERE guide = ?
    `, [testGuide]);
    
    if (newOrder.length > 0) {
      const order = newOrder[0];
      console.log(`   ✅ Orden encontrada en BD:`);
      console.log(`      Guía: ${order.guide}`);
      console.log(`      Peso: ${order.weight_lbs} lbs`);
      console.log(`      Total: $${order.total}`);
      console.log(`      Estado: ${order.status}`);
    }
    
    // 6. Verificar que las órdenes con peso se muestran correctamente
    console.log('\n📋 Órdenes recientes con peso...');
    
    const [ordersWithWeight] = await conn.query(`
      SELECT guide, weight_lbs, total 
      FROM orders 
      WHERE weight_lbs IS NOT NULL 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    ordersWithWeight.forEach(order => {
      console.log(`   📦 ${order.guide}: ${order.weight_lbs} lbs = $${order.total}`);
    });
    
    conn.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
  
  console.log('\n🎉 PRUEBA DIRECTA COMPLETADA');
}

testOrderPricing();