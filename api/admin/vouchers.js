const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🎫 Getting admin vouchers');

  try {
    console.log('🎫 DB Config:', {
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

    console.log('🎫 DB connection established');

    // Obtener vouchers con paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        v.id,
        v.code,
        v.name,
        v.estab_code,
        v.point_code,
        v.seq,
        v.created_at
      FROM vouchers v
    `;

    const params = [];

    // Filtro de búsqueda
    if (req.query.q) {
      query += ` WHERE (v.code LIKE ?)`;
      const searchTerm = `%${req.query.q}%`;
      params.push(searchTerm);
    }

    query += ` ORDER BY v.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    console.log('🎫 Query:', query);
    console.log('🎫 Params:', params);

    const [vouchers] = await connection.execute(query, params);
    console.log('🎫 Vouchers found:', vouchers.length);

    // Contar total para paginación
    let countQuery = `SELECT COUNT(*) as total FROM vouchers`;
    const countParams = [];

    if (req.query.q) {
      countQuery += ` WHERE (code LIKE ?)`;
      const searchTerm = `%${req.query.q}%`;
      countParams.push(searchTerm);
    }

    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0].total;
    const pages = Math.ceil(total / limit);

    await connection.end();

    // Formatear respuesta
    const formattedVouchers = vouchers.map(voucher => ({
      id: voucher.id,
      code: voucher.code,
      name: voucher.name || voucher.code,
      estab_code: voucher.estab_code,
      point_code: voucher.point_code,
      seq: voucher.seq,
      created_at: voucher.created_at,
      active: true, // Asumiendo que todos están activos por defecto
      description: voucher.name || voucher.code
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`🎫 Returning ${formattedVouchers.length} vouchers (page ${page}/${pages})`);
    return res.status(200).json({
      ok: true,
      items: formattedVouchers,
      page,
      limit,
      total,
      pages
    });

  } catch (error) {
    console.error('🎫 Admin vouchers error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      ok: false
    });
  }
}