const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('👥 Getting admin users');

  try {
    console.log('👥 DB Config:', {
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

    console.log('👥 DB connection established');

    // Obtener usuarios con paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        u.id,
        u.username,
        u.name,
        u.is_admin,
        u.created_at,
        u.last_login,
        u.active
      FROM users u
    `;

    const params = [];

    // Filtro de búsqueda - solo buscar en campos que sabemos que existen
    if (req.query.q) {
      query += ` WHERE (u.username LIKE ? OR u.name LIKE ?)`;
      const searchTerm = `%${req.query.q}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    console.log('👥 Query:', query);
    console.log('👥 Params:', params);

    const [users] = await connection.execute(query, params);
    console.log('👥 Users found:', users.length);

    // Contar total para paginación
    let countQuery = `SELECT COUNT(*) as total FROM users`;
    const countParams = [];

    if (req.query.q) {
      countQuery += ` WHERE (username LIKE ? OR name LIKE ?)`;
      const searchTerm = `%${req.query.q}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0].total;
    const pages = Math.ceil(total / limit);

    await connection.end();

    // Formatear respuesta
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      names: user.names,
      is_admin: user.is_admin === 1,
      role: user.is_admin === 1 ? 'admin' : 'customer',
      created_at: user.created_at,
      last_login: user.last_login,
      active: user.active === 1,
      total_orders: 0 // Simplificado por ahora
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`👥 Returning ${formattedUsers.length} users (page ${page}/${pages})`);
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
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      ok: false
    });
  }
}