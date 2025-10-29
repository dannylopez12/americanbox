const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📦 Getting admin orders');

  try {
    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    const limit = parseInt(req.query.limit) || 10;

    // Obtener órdenes recientes con información del cliente
    const [orders] = await connection.execute(`
      SELECT
        o.id,
        o.tracking_number,
        o.status,
        o.total_amount,
        o.created_at,
        o.updated_at,
        c.names as customer_name,
        c.email as customer_email,
        u.username as customer_username,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.customer_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.deleted_at IS NULL
      WHERE o.deleted_at IS NULL
      GROUP BY o.id, o.tracking_number, o.status, o.total_amount, o.created_at, o.updated_at, c.names, c.email, u.username
      ORDER BY o.created_at DESC
      LIMIT ?
    `, [limit]);

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
      customer_email: order.customer_email,
      items_count: order.items_count
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`📦 Found ${formattedOrders.length} recent orders`);
    return res.status(200).json({
      ok: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('📦 Admin orders error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Internal server error', ok: false });
  }
}