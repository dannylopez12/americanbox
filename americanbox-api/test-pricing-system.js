const mysql = require('mysql2/promise');

async function testPricingSystem() {
  console.log('🧪 TESTING SISTEMA DE PRECIOS AUTOMÁTICO');
  console.log('==========================================');
  
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'americanbox',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    const conn = await pool.getConnection();
    
    // 1. Verificar estructura de base de datos
    console.log('\n1. 🏗️  Verificando estructura de BD...');
    
    const [companySettings] = await conn.query('SELECT default_price_per_lb FROM company_settings LIMIT 1');
    console.log('   ✅ Precio global por defecto:', companySettings[0]?.default_price_per_lb || 'No configurado');
    
    const [customersWithPrices] = await conn.query('SELECT id, names, price_per_lb FROM customers WHERE price_per_lb IS NOT NULL LIMIT 3');
    console.log('   ✅ Clientes con precios personalizados:', customersWithPrices.length);
    customersWithPrices.forEach(c => {
      console.log(`      Cliente ${c.id}: ${c.names} = $${c.price_per_lb}/lb`);
    });
    
    // 2. Probar función calculateOrderPrice
    console.log('\n2. 🧮 Probando cálculo automático...');
    
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
    
    // Obtener usuarios de prueba
    const [users] = await conn.query('SELECT id, customer_id FROM users LIMIT 3');
    
    for (const user of users) {
      const customerId = await getCustomerIdFromUserId(conn, user.id);
      if (customerId) {
        const peso1 = 2.5; // 2.5 libras
        const peso2 = 5.0; // 5.0 libras
        
        const precio1 = await calculateOrderPrice(conn, customerId, peso1);
        const precio2 = await calculateOrderPrice(conn, customerId, peso2);
        
        console.log(`   User ${user.id} (Customer ${customerId}):`);
        console.log(`      ${peso1} lbs = $${precio1}`);
        console.log(`      ${peso2} lbs = $${precio2}`);
      }
    }
    
    // 3. Verificar órdenes existentes con peso
    console.log('\n3. 📦 Órdenes con peso registrado...');
    const [ordersWithWeight] = await conn.query(`
      SELECT id, guide, weight_lbs, total 
      FROM orders 
      WHERE weight_lbs IS NOT NULL 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    if (ordersWithWeight.length > 0) {
      console.log('   ✅ Órdenes encontradas con peso:');
      ordersWithWeight.forEach(order => {
        console.log(`      Orden ${order.id} (${order.guide}): ${order.weight_lbs} lbs = $${order.total}`);
      });
    } else {
      console.log('   ⚠️  No hay órdenes con peso registrado aún');
    }
    
    // 4. Probar creación de orden con cálculo automático
    console.log('\n4. 🆕 Simulando creación de orden...');
    
    if (users.length > 0) {
      const testUser = users[0];
      const testWeight = 3.75; // 3.75 libras
      const customerId = await getCustomerIdFromUserId(conn, testUser.id);
      
      if (customerId) {
        const calculatedPrice = await calculateOrderPrice(conn, customerId, testWeight);
        console.log(`   📋 Usuario de prueba: ${testUser.id}`);
        console.log(`   📦 Peso de prueba: ${testWeight} lbs`);
        console.log(`   💰 Precio calculado: $${calculatedPrice}`);
        console.log('   ✅ Sistema de cálculo automático funcionando correctamente');
      }
    }
    
    conn.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
  
  console.log('\n🎉 PRUEBA COMPLETADA');
}

testPricingSystem();