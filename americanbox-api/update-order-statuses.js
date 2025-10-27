const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateOrderStatuses() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME,
      charset: 'utf8mb4_unicode_ci',
    });

    console.log('🔄 Actualizando estados de pedidos según reunión...\n');
    
    // Verificar estructura actual de orders
    console.log('📋 Estructura actual de la tabla orders:');
    const [columns] = await connection.execute('DESCRIBE orders');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
    // Verificar algunos pedidos existentes
    console.log('\n📦 Pedidos existentes (muestra):');
    const [orders] = await connection.execute('SELECT id, guide, user_id, status FROM orders LIMIT 5');
    orders.forEach(order => {
      console.log(`  - ID: ${order.id}, Guía: ${order.guide}, Usuario: ${order.user_id}, Estado: ${order.status}`);
    });
    
    // Limpiar nombres de estados según la reunión
    console.log('\n🧹 Limpiando nombres de estados (quitar texto después de comas/guiones)...');
    
    const stateUpdates = [
      { old: 'Pre alerta, llega a bodega', new: 'Pre alerta' },
      { old: 'Captado en Miami', new: 'Captado en agencia' },
      { old: 'Despachado - viajando', new: 'Despachado' },
      { old: 'En aduana - proceso de aduana', new: 'En aduana' },
      { old: 'Pago aprobado - coordinando entrega', new: 'Pago aprobado' }
    ];
    
    for (const update of stateUpdates) {
      const [result] = await connection.execute(
        'UPDATE orders SET status = ? WHERE status = ?', 
        [update.new, update.old]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✅ "${update.old}" → "${update.new}" (${result.affectedRows} pedidos)`);
      }
    }
    
    // Agregar algunos pedidos de prueba si no hay suficientes
    console.log('\n📦 Verificando pedidos de prueba...');
    const [count] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    
    if (count[0].count < 5) {
      console.log('  📝 Agregando pedidos de prueba...');
      
      const testOrders = [
        {
          guide: 'AMB-001-2025',
          user_id: 2, // ID del cliente
          address_id: 1,
          status: 'Pre alerta',
          total: 45.99
        },
        {
          guide: 'AMB-002-2025',
          user_id: 2,
          address_id: 1,
          status: 'Captado en agencia',
          total: 89.50
        },
        {
          guide: 'AMB-003-2025',
          user_id: 2,
          address_id: 1,
          status: 'Despachado',
          total: 125.75
        }
      ];
      
      for (const order of testOrders) {
        await connection.execute(`
          INSERT INTO orders (guide, user_id, address_id, status, total, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE id=id
        `, [order.guide, order.user_id, order.address_id, order.status, order.total]);
      }
      
      console.log(`  ✅ ${testOrders.length} pedidos de prueba agregados`);
    } else {
      console.log('  ℹ️  Ya hay suficientes pedidos');
    }
    
    // Estado final
    console.log('\n📊 Estado final:');
    const [finalOrders] = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    finalOrders.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} pedidos`);
    });
    
    console.log('\n🎉 Actualización completada según requerimientos de la reunión!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateOrderStatuses();