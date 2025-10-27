const mysql = require('mysql2/promise');

async function checkRecentUsers() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'americanbox'
  });

  try {
    const conn = await pool.getConnection();
    
    console.log('🔍 Verificando usuarios recientes y sus direcciones...');
    
    const [users] = await conn.query(`
      SELECT 
        u.id,
        u.username,
        u.customer_id,
        u.created_at,
        c.names,
        c.address as customer_address,
        COUNT(a.id) as addresses_count
      FROM users u
      LEFT JOIN customers c ON u.customer_id = c.id
      LEFT JOIN addresses a ON a.user_id = u.id
      WHERE u.customer_id IS NOT NULL
      GROUP BY u.id, u.username, u.customer_id, u.created_at, c.names, c.address
      ORDER BY u.created_at DESC
      LIMIT 5
    `);
    
    users.forEach(user => {
      console.log(`\n👤 Usuario ${user.id} (${user.username})`);
      console.log(`   🏷️  Customer: ${user.customer_id} - ${user.names}`);
      console.log(`   📅 Creado: ${user.created_at}`);
      console.log(`   🏠 Dirección del customer: ${user.customer_address || 'Sin dirección'}`);
      console.log(`   📍 Direcciones en tabla addresses: ${user.addresses_count}`);
    });
    
    // Verificar específicamente el último usuario
    if (users.length > 0) {
      const lastUser = users[0];
      console.log(`\n🔍 Detalles del último usuario (${lastUser.username}):`);
      
      const [addresses] = await conn.query(
        'SELECT id, address, city FROM addresses WHERE user_id = ?',
        [lastUser.id]
      );
      
      if (addresses.length > 0) {
        addresses.forEach(addr => {
          console.log(`   ✅ Dirección ${addr.id}: ${addr.address}, ${addr.city}`);
        });
      } else {
        console.log('   ❌ No tiene direcciones en tabla addresses');
      }
    }
    
    conn.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkRecentUsers();