const { db } = require('../firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🎫 Getting admin vouchers from Firestore');

  try {
    // Obtener vouchers con paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let query = db.collection('vouchers').orderBy('created_at', 'desc');

    // Filtro de búsqueda
    if (req.query.q) {
      const searchTerm = req.query.q.toLowerCase();
      query = query.where('searchableCode', '>=', searchTerm).where('searchableCode', '<=', searchTerm + '\uf8ff');
    }

    // Paginación simplificada
    const snapshot = await query.limit(limit * page).get();
    const vouchers = [];
    snapshot.forEach(doc => {
      vouchers.push({ id: doc.id, ...doc.data() });
    });

    const startIndex = (page - 1) * limit;
    const paginatedVouchers = vouchers.slice(startIndex, startIndex + limit);

    const total = vouchers.length;
    const pages = Math.ceil(total / limit);

    // Formatear respuesta
    const formattedVouchers = paginatedVouchers.map(voucher => ({
      id: voucher.id,
      code: voucher.code,
      name: voucher.name || voucher.code,
      estab_code: voucher.estab_code,
      point_code: voucher.point_code,
      seq: voucher.seq,
      created_at: voucher.created_at,
      active: voucher.active !== false,
      description: voucher.description || voucher.name || voucher.code
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