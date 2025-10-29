const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testAddressQuery() {
  try {
    const conn = await pool.getConnection();
    
    // Probar la consulta exacta del endpoint
    console.log('🔍 Probando consulta COUNT...');
    const [countResult] = await conn.query(`
      SELECT COUNT(*) as total 
      FROM addresses a 
      LEFT JOIN users u ON u.id = a.user_id
    `);
    console.log('✅ Count resultado:', countResult);
    
    console.log('\n🔍 Probando consulta SELECT...');
    const [addresses] = await conn.query(`
      SELECT 
        a.id,
        a.address,
        a.city,
        a.user_id,
        u.username
      FROM addresses a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.id DESC
      LIMIT ? OFFSET ?
    `, [10, 0]);
    
    console.log('✅ Addresses resultado:', addresses);
    
    conn.release();
  } catch (e) {
    console.error('❌ Error en consulta:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    process.exit(0);
  }
}

testAddressQuery();