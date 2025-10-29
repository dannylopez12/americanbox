const mysql = require('mysql2/promise');

// Database config from server.js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testReportsQueries() {
  console.log('🧪 Testing Reports Queries...\n');
  
  try {
    // Test packages query (orders)
    console.log('📦 Testing packages report query...');
    const packagesQuery = `
      SELECT 
        o.id,
        o.guide as hawb,
        c.names as sender,
        c.names as recipient,
        a.address,
        o.status,
        o.created_at as register_date,
        o.total,
        o.weight_lbs as weight,
        o.location,
        o.tracking_code,
        p.name as provider_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN customers c ON u.customer_id = c.id
      LEFT JOIN addresses a ON o.address_id = a.id
      LEFT JOIN providers p ON o.provider_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `;
    
    const [packages] = await pool.query(packagesQuery);
    console.log('✅ Packages query successful - Records:', packages.length);
    if (packages.length > 0) {
      console.log('Sample record:', JSON.stringify(packages[0], null, 2));
    }
    
    console.log('\n👥 Testing clients report query...');
    const clientsQuery = `
      SELECT 
        c.id,
        c.names as name,
        c.email,
        c.dni,
        c.mobile,
        c.address,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_amount,
        MAX(o.created_at) as last_order_date,
        u.username,
        u.role
      FROM customers c
      LEFT JOIN users u ON c.id = u.customer_id
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer'
      GROUP BY c.id, c.names, c.email, c.dni, c.mobile, c.address, u.username, u.role 
      ORDER BY total_orders DESC, c.names ASC
      LIMIT 5
    `;
    
    const [clients] = await pool.query(clientsQuery);
    console.log('✅ Clients query successful - Records:', clients.length);
    if (clients.length > 0) {
      console.log('Sample record:', JSON.stringify(clients[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing queries:', error.message);
  } finally {
    await pool.end();
  }
}

testReportsQueries();