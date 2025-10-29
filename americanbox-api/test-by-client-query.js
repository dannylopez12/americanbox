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

async function testByClientQuery() {
  console.log('🧪 Testing by-client query...\n');
  
  try {
    // Test the exact query structure
    const client_id = 1;
    
    let baseQuery = `
      FROM orders o 
      INNER JOIN users u ON o.user_id = u.id 
      INNER JOIN customers c ON u.customer_id = c.id
      LEFT JOIN addresses a ON o.address_id = a.id
      LEFT JOIN providers p ON o.provider_id = p.id
      WHERE 1=1 AND c.id = ?
    `;
    
    console.log('📊 Testing count query...');
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [countResult] = await pool.query(countQuery, [client_id]);
    console.log('✅ Count result:', countResult[0]?.total || 0);
    
    console.log('\n📋 Testing data query...');
    const dataQuery = `
      SELECT 
        o.id,
        o.guide,
        o.status,
        o.total,
        o.weight_lbs,
        o.location,
        o.tracking_code,
        o.created_at as register_date,
        c.id as client_id,
        c.names as client_name,
        c.email as client_email,
        c.dni as client_dni,
        c.mobile as client_mobile,
        a.address as delivery_address,
        p.name as provider_name,
        p.tracking_code as provider_code
      ${baseQuery}
      ORDER BY o.created_at DESC
      LIMIT 5
    `;
    
    const [orders] = await pool.query(dataQuery, [client_id]);
    console.log('✅ Data query result - Records:', orders.length);
    
    if (orders.length > 0) {
      console.log('Sample record:', JSON.stringify(orders[0], null, 2));
    }
    
    console.log('\n📈 Testing stats query...');
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN o.status = 'Pre alerta' THEN 1 END) as pre_alerta,
        COUNT(CASE WHEN o.status = 'Captado en agencia' THEN 1 END) as captado,
        COUNT(CASE WHEN o.status = 'Despacho' THEN 1 END) as despacho,
        COUNT(CASE WHEN o.status = 'En proceso de entrega' THEN 1 END) as en_proceso,
        COUNT(CASE WHEN o.status = 'Entregado' THEN 1 END) as entregado,
        COALESCE(SUM(o.total), 0) as total_amount,
        COALESCE(SUM(o.weight_lbs), 0) as total_weight
      ${baseQuery}
    `;
    
    const [statsResult] = await pool.query(statsQuery, [client_id]);
    console.log('✅ Stats query result:', JSON.stringify(statsResult[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error testing queries:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testByClientQuery();