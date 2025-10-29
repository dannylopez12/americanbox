const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📊 Getting admin stats');

  try {
    console.log('📊 DB Config:', {
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

    console.log('📊 DB connection established');

    // Verificar que las tablas existen
    const [tables] = await connection.execute("SHOW TABLES");
    console.log('📊 Available tables:', tables.map(t => Object.values(t)[0]));

    // Obtener estadísticas básicas con consultas más seguras
    let customersCount = 0;
    let productsCount = 0;
    let addressesCount = 0;
    let categoriesCount = 0;

    try {
      const [customersResult] = await connection.execute('SELECT COUNT(*) as count FROM customers');
      customersCount = customersResult[0].count || 0;
      console.log('📊 Customers count:', customersCount);
    } catch (e) {
      console.log('📊 Customers table error:', e.message);
    }

    try {
      const [productsResult] = await connection.execute('SELECT COUNT(*) as count FROM products');
      productsCount = productsResult[0].count || 0;
      console.log('📊 Products count:', productsCount);
    } catch (e) {
      console.log('📊 Products table error:', e.message);
    }

    try {
      const [addressesResult] = await connection.execute('SELECT COUNT(*) as count FROM addresses');
      addressesCount = addressesResult[0].count || 0;
      console.log('📊 Addresses count:', addressesCount);
    } catch (e) {
      console.log('📊 Addresses table error:', e.message);
    }

    try {
      const [categoriesResult] = await connection.execute('SELECT COUNT(*) as count FROM categories');
      categoriesCount = categoriesResult[0].count || 0;
      console.log('📊 Categories count:', categoriesCount);
    } catch (e) {
      console.log('📊 Categories table error:', e.message);
    }

    // Estadísticas de órdenes por estado
    let orderStats = {};
    try {
      const [orderStatsResult] = await connection.execute(`
        SELECT
          status,
          COUNT(*) as count
        FROM orders
        GROUP BY status
      `);
      orderStats = orderStatsResult.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {});
      console.log('📊 Order stats:', orderStats);
    } catch (e) {
      console.log('📊 Orders table error:', e.message);
    }

    await connection.end();

    const stats = {
      customers: customersCount,
      products: productsCount,
      addresses: addressesCount,
      categories: categoriesCount,
      orderStats: orderStats
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log('📊 Final stats:', stats);
    return res.status(200).json({ ok: true, ...stats });

  } catch (error) {
    console.error('📊 Admin stats error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      ok: false
    });
  }
}