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

async function testPrintLabel() {
  try {
    const conn = await pool.getConnection();
    
    const [orders] = await conn.query(`
      SELECT 
        o.id,
        o.guide,
        o.tracking_code,
        o.status,
        o.total,
        o.created_at,
        COALESCE(c.names, u.username) AS client_name,
        COALESCE(c.email, '') AS client_email,
        COALESCE(c.phone, '') AS client_phone,
        CONCAT(
          COALESCE(a.address, ''), 
          CASE WHEN a.city IS NOT NULL THEN CONCAT(' / ', a.city) ELSE '' END
        ) AS client_address,
        p.tracking_code AS provider_code,
        p.name AS provider_name
      FROM orders o
      JOIN users u ON u.id = o.user_id
      LEFT JOIN customers c ON c.id = u.customer_id
      LEFT JOIN addresses a ON a.id = o.address_id
      LEFT JOIN providers p ON p.id = o.provider_id
      WHERE o.id = ?
    `, [25]);
    
    console.log('✅ Orden encontrada:', JSON.stringify(orders[0], null, 2));
    
    conn.release();
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    process.exit(0);
  }
}

testPrintLabel();