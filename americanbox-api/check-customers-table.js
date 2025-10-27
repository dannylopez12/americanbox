const mysql = require('mysql2/promise');

async function checkCustomersTable() {
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
    
    console.log('🔍 Estructura de la tabla customers:');
    const [columns] = await conn.query('DESCRIBE customers');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default || ''}`);
    });
    
    console.log('\n📋 Primeros customers:');
    const [customers] = await conn.query('SELECT * FROM customers LIMIT 3');
    customers.forEach((c, index) => {
      console.log(`  ${index + 1}. ID: ${c.id}, Columns:`, Object.keys(c));
    });
    
    conn.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCustomersTable();