const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📈 Getting top products');

  try {
    console.log('📈 DB Config:', {
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

    console.log('📈 DB connection established');

    // Obtener productos más vendidos
    const [topProducts] = await connection.execute(`
      SELECT
        p.id,
        p.name,
        p.price,
        COUNT(oi.id) as total_sold,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      GROUP BY p.id, p.name, p.price
      HAVING total_sold > 0
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    console.log('📈 Top products found:', topProducts.length);

    await connection.end();

    // Formatear respuesta
    const formattedProducts = topProducts.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image_url: null, // No existe en la consulta
      category_name: null, // No existe en la consulta
      total_sold: product.total_sold,
      total_revenue: parseFloat(product.total_revenue || 0),
      orders_count: product.total_sold // Simplificado
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`📈 Returning ${formattedProducts.length} top products`);
    return res.status(200).json({
      ok: true,
      labels: formattedProducts.map(product => product.name),
      values: formattedProducts.map(product => product.total_sold)
    });

  } catch (error) {
    console.error('📈 Top products error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      ok: false
    });
  }
}