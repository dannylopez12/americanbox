const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('💰 Getting monthly revenue');

  try {
    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    // Obtener ingresos mensuales de los últimos 12 meses
    const [revenueData] = await connection.execute(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        YEAR(created_at) as year,
        MONTH(created_at) as month_num,
        SUM(total_amount) as revenue,
        COUNT(*) as orders_count
      FROM orders
      WHERE deleted_at IS NULL
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        AND status NOT IN ('cancelled', 'refunded')
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), YEAR(created_at), MONTH(created_at)
      ORDER BY year DESC, month_num DESC
      LIMIT 12
    `);

    await connection.end();

    // Formatear respuesta
    const monthlyRevenue = revenueData.map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue),
      orders_count: row.orders_count,
      year: row.year,
      month_num: row.month_num
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`💰 Found revenue data for ${monthlyRevenue.length} months`);
    return res.status(200).json({
      ok: true,
      data: monthlyRevenue
    });

  } catch (error) {
    console.error('💰 Monthly revenue error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Internal server error', ok: false });
  }
}