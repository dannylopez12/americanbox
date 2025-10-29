const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📊 Getting admin stats');

  try {
    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    // Obtener estadísticas básicas
    const [customersResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM customers WHERE deleted_at IS NULL'
    );

    const [productsResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL'
    );

    const [addressesResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM addresses WHERE deleted_at IS NULL'
    );

    const [categoriesResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM categories WHERE deleted_at IS NULL'
    );

    // Estadísticas de órdenes por estado
    const [orderStatsResult] = await connection.execute(`
      SELECT
        SUM(CASE WHEN status = 'prealerta' THEN 1 ELSE 0 END) as prealerta,
        SUM(CASE WHEN status = 'captado' THEN 1 ELSE 0 END) as captado,
        SUM(CASE WHEN status = 'viajando' THEN 1 ELSE 0 END) as viajando,
        SUM(CASE WHEN status = 'aduana' THEN 1 ELSE 0 END) as aduana,
        SUM(CASE WHEN status = 'entregado' THEN 1 ELSE 0 END) as entregado
      FROM orders
      WHERE deleted_at IS NULL
    `);

    await connection.end();

    const stats = {
      customers: customersResult[0].count || 0,
      products: productsResult[0].count || 0,
      addresses: addressesResult[0].count || 0,
      categories: categoriesResult[0].count || 0,
      orderStats: orderStatsResult[0] || {}
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log('📊 Admin stats:', stats);
    return res.status(200).json({ ok: true, ...stats });

  } catch (error) {
    console.error('📊 Admin stats error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Internal server error', ok: false });
  }
}