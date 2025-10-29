const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('👥 Getting admin users');

  try {
    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    // Obtener usuarios con paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.names,
        u.is_admin,
        u.created_at,
        u.last_login,
        u.active,
        COUNT(o.id) as total_orders
      FROM users u
      LEFT JOIN orders o ON u.id = o.customer_id AND o.deleted_at IS NULL
      WHERE u.deleted_at IS NULL
    `;

    const params = [];

    // Filtro de búsqueda
    if (req.query.q) {
      query += ` AND (u.username LIKE ? OR u.email LIKE ? OR u.names LIKE ?)`;
      const searchTerm = `%${req.query.q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [users] = await connection.execute(query, params);

    // Contar total para paginación
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL`;
    const countParams = [];

    if (req.query.q) {
      countQuery += ` AND (username LIKE ? OR email LIKE ? OR names LIKE ?)`;
      const searchTerm = `%${req.query.q}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0].total;
    const pages = Math.ceil(total / limit);

    await connection.end();

    // Formatear respuesta
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      names: user.names,
      is_admin: user.is_admin === 1,
      role: user.is_admin === 1 ? 'admin' : 'customer',
      created_at: user.created_at,
      last_login: user.last_login,
      active: user.active === 1,
      total_orders: user.total_orders
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`👥 Found ${formattedUsers.length} users (page ${page}/${pages})`);
    return res.status(200).json({
      ok: true,
      items: formattedUsers,
      page,
      limit,
      total,
      pages
    });

  } catch (error) {
    console.error('👥 Admin users error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Internal server error', ok: false });
  }
}