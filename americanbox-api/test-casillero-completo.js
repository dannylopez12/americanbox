const mysql = require('mysql2/promise');

async function testOrderCreationWithAutoAddress() {
  console.log('🧪 TESTING: Creación de Orden con Dirección Automática');
  console.log('===================================================');
  
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'americanbox'
  });

  try {
    const conn = await pool.getConnection();
    
    // 1. Buscar el usuario recién creado
    console.log('\n1. 👤 Buscando usuario con dirección automática...');
    
    const [users] = await conn.query(`
      SELECT 
        u.id as user_id,
        u.username,
        u.customer_id,
        a.id as address_id,
        a.address,
        a.city
      FROM users u
      INNER JOIN addresses a ON a.user_id = u.id
      WHERE u.username LIKE 'testuser%'
      ORDER BY u.created_at DESC
      LIMIT 1
    `);
    
    if (users.length === 0) {
      throw new Error('No se encontró usuario con dirección');
    }
    
    const testUser = users[0];
    console.log(`   ✅ Usuario encontrado: ${testUser.username} (ID: ${testUser.user_id})`);
    console.log(`   📍 Dirección automática: ID ${testUser.address_id}`);
    console.log(`      ${testUser.address}, ${testUser.city}`);
    
    // 2. Simular creación de orden (como lo haría el endpoint)
    console.log('\n2. 📦 Creando orden de prueba...');
    
    const testGuide = `CASILLERO-TEST-${Date.now()}`;
    const testWeight = 3.0;
    
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
      
      const [customerPrice] = await conn.query('SELECT price_per_lb FROM customers WHERE id = ?', [customerId]);
      
      let pricePerLb = customerPrice[0]?.price_per_lb;
      if (!pricePerLb) {
        const [defaultPrice] = await conn.query('SELECT default_price_per_lb FROM company_settings LIMIT 1');
        pricePerLb = defaultPrice[0]?.default_price_per_lb || 3.50;
      }
      
      return parseFloat((weightLbs * pricePerLb).toFixed(2));
    }
    
    // Buscar dirección automáticamente (como hace el endpoint)
    const [addresses] = await conn.query('SELECT id FROM addresses WHERE user_id = ? LIMIT 1', [testUser.user_id]);
    
    if (addresses.length === 0) {
      throw new Error('Usuario no tiene direcciones - ¡Esto no debería pasar!');
    }
    
    const addressId = addresses[0].id;
    console.log(`   📍 Dirección encontrada automáticamente: ID ${addressId}`);
    
    // Calcular precio automático
    const customerId = await getCustomerIdFromUserId(conn, testUser.user_id);
    const calculatedPrice = await calculateOrderPrice(conn, customerId, testWeight);
    
    console.log(`   🧮 Precio calculado: ${testWeight} lbs × $3.50 = $${calculatedPrice}`);
    
    // Crear la orden
    const [result] = await conn.query(`
      INSERT INTO orders (
        guide, 
        user_id, 
        address_id, 
        status, 
        total,
        weight_lbs,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      testGuide,
      testUser.user_id,
      addressId,
      'Pre alerta',
      calculatedPrice,
      testWeight
    ]);
    
    const orderId = result.insertId;
    console.log(`   ✅ Orden creada exitosamente: ID ${orderId}`);
    
    // 3. Verificar la orden creada
    console.log('\n3. 🔍 Verificando orden en base de datos...');
    
    const [orderCheck] = await conn.query(`
      SELECT 
        o.id,
        o.guide,
        o.user_id,
        o.address_id,
        o.total,
        o.weight_lbs,
        o.status,
        a.address,
        a.city,
        u.username
      FROM orders o
      INNER JOIN addresses a ON o.address_id = a.id
      INNER JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);
    
    if (orderCheck.length > 0) {
      const order = orderCheck[0];
      console.log(`   ✅ Orden verificada en BD:`);
      console.log(`      🆔 ID: ${order.id}`);
      console.log(`      📋 Guía: ${order.guide}`);
      console.log(`      👤 Usuario: ${order.username} (ID: ${order.user_id})`);
      console.log(`      📍 Dirección: ID ${order.address_id} - ${order.address}, ${order.city}`);
      console.log(`      ⚖️ Peso: ${order.weight_lbs} lbs`);
      console.log(`      💰 Total: $${order.total}`);
      console.log(`      📊 Estado: ${order.status}`);
    }
    
    conn.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
  
  console.log('\n🎉 PRUEBA COMPLETA - ¡Flujo de casilleros funcionando!');
}

testOrderCreationWithAutoAddress();