const mysql = require('mysql2/promise');

async function checkUsersTable() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'americanbox'
  });

  try {
    const conn = await pool.getConnection();
    
    console.log('🔍 Estructura de la tabla users:');
    const [columns] = await conn.query('DESCRIBE users');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default || ''}`);
    });
    
    console.log('\n📋 Primeros usuarios:');
    const [users] = await conn.query('SELECT * FROM users LIMIT 3');
    users.forEach((u, index) => {
      console.log(`  ${index + 1}. ID: ${u.id}, Columns:`, Object.keys(u));
    });
    
    conn.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersTable();