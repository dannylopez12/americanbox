const { db } = require('../firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('👥 Getting admin users from Firestore');

  try {
    // Obtener usuarios con paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let query = db.collection('users').orderBy('created_at', 'desc');

    // Filtro de búsqueda
    if (req.query.q) {
      // Firestore no soporta LIKE directamente, usar where con >= y <= para prefix search
      const searchTerm = req.query.q.toLowerCase();
      query = query.where('searchableName', '>=', searchTerm).where('searchableName', '<=', searchTerm + '\uf8ff');
    }

    // Paginación con cursor (simplificada)
    const snapshot = await query.limit(limit * page).get();
    const users = [];
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    // Tomar solo la página actual
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);

    const total = users.length; // Aproximado, Firestore no da count fácil
    const pages = Math.ceil(total / limit);

    // Formatear respuesta
    const formattedUsers = paginatedUsers.map(user => ({
      id: user.id,
      username: user.username || user.email,
      names: user.full_name || user.username || user.email,
      email: user.email,
      phone: user.phone || null,
      address: user.address || null,
      dni: user.dni || null,
      identification_type: user.identification_type || null,
      price_per_lb: user.price_per_lb || null,
      role: user.role || (user.is_admin ? 'admin' : 'customer'),
      is_admin: user.is_admin || false,
      groups: user.groups || [],
      active: user.active !== false,
      image_url: user.image_url || null,
      last_login: user.last_login || null,
      created_at: user.created_at || null,
      updated_at: user.updated_at || null
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