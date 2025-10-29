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
        v.discount_type,
        v.discount_value,
        v.min_order_amount,
        v.max_discount,
        v.usage_limit,
        v.used_count,
        v.starts_at,
        v.expires_at,
        v.created_at,
        v.active,
        v.description
      FROM vouchers v
    `;

    const params = [];

    // Filtro de búsqueda
    if (req.query.q) {
      query += ` WHERE (v.code LIKE ? OR v.description LIKE ?)`;
      const searchTerm = `%${req.query.q}%`;
      params.push(searchTerm, searchTerm);
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
      countQuery += ` WHERE (code LIKE ? OR description LIKE ?)`;
      const searchTerm = `%${req.query.q}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0].total;
    const pages = Math.ceil(total / limit);

    await connection.end();

    // Formatear respuesta
    const formattedVouchers = vouchers.map(voucher => ({
      id: voucher.id,
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: parseFloat(voucher.discount_value),
      min_order_amount: voucher.min_order_amount ? parseFloat(voucher.min_order_amount) : null,
      max_discount: voucher.max_discount ? parseFloat(voucher.max_discount) : null,
      usage_limit: voucher.usage_limit,
      used_count: voucher.used_count || 0,
      starts_at: voucher.starts_at,
      expires_at: voucher.expires_at,
      created_at: voucher.created_at,
      active: voucher.active === 1,
      description: voucher.description,
      is_expired: voucher.expires_at ? new Date(voucher.expires_at) < new Date() : false,
      is_used_up: voucher.usage_limit ? voucher.used_count >= voucher.usage_limit : false
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