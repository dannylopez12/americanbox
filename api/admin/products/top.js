const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📈 Getting top products');

  try {
    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    // Obtener productos más vendidos
    const [topProducts] = await connection.execute(`
      SELECT
        p.id,
        p.name,
        p.price,
        p.image_url,
        c.name as category_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue,
        COUNT(DISTINCT o.id) as orders_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
        AND oi.deleted_at IS NULL
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY p.id, p.name, p.price, p.image_url, c.name
      HAVING total_sold > 0
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    await connection.end();

    // Formatear respuesta
    const formattedProducts = topProducts.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image_url: product.image_url,
      category_name: product.category_name,
      total_sold: product.total_sold,
      total_revenue: parseFloat(product.total_revenue),
      orders_count: product.orders_count
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`📈 Found ${formattedProducts.length} top products`);
    return res.status(200).json({
      ok: true,
      products: formattedProducts
    });

  } catch (error) {
    console.error('📈 Top products error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Internal server error', ok: false });
  }
}