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
        c.names as customer_name,
        u.username as customer_username
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.customer_id = u.id
      ORDER BY o.created_at DESC
      LIMIT ?
    `, [limit]);

    console.log('📦 Orders found:', orders.length);

    await connection.end();

    // Formatear respuesta
    const formattedOrders = orders.map(order => ({
      id: order.id,
      tracking_number: order.tracking_number,
      status: order.status,
      total_amount: parseFloat(order.total_amount),
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer_name: order.customer_name || order.customer_username || 'N/A',
      customer_email: null, // No existe en la consulta
      items_count: 0 // Simplificado por ahora
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