const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📦 Getting admin orders');

  try {
    console.log('📦 DB Config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    console.log('📦 DB connection established');

    const limit = parseInt(req.query.limit) || 10;

    // Obtener órdenes recientes con información básica
    const [orders] = await connection.execute(`
      SELECT
        o.id,
        o.tracking_number,
        o.status,
        o.total_amount,
        o.created_at,
        o.updated_at,
        c.name as customer_name,
        c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT ?
    `, [limit]);

    console.log('📦 Orders found:', orders.length);

    await connection.end();

    // Formatear respuesta
    const formattedOrders = orders.map(order => ({
      id: order.id,
      guide: order.tracking_number || `ORD-${order.id}`,
      client: order.customer_name || 'N/A',
      address: 'N/A', // Simplificado
      date: order.created_at,
      total: order.total_amount,
      status: order.status
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`📦 Returning ${formattedOrders.length} recent orders`);
    return res.status(200).json({
      ok: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('📦 Admin orders error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      ok: false
    });
  }
}