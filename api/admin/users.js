const { db } = require('../lib/firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('👥 Getting admin users from Firestore');

  try {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Obtener usuarios de Firestore
    const usersRef = db.collection('users');
    let query = usersRef.orderBy('created_at', 'desc');

    // Agregar filtros si existen
    if (req.query.q) {
      // Firestore no soporta LIKE directamente, así que filtramos en memoria
      const snapshot = await query.get();
      const users = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const searchTerm = req.query.q.toLowerCase();
        if (
          (data.username && data.username.toLowerCase().includes(searchTerm)) ||
          (data.email && data.email.toLowerCase().includes(searchTerm)) ||
          (data.full_name && data.full_name.toLowerCase().includes(searchTerm)) ||
          (data.names && data.names.toLowerCase().includes(searchTerm))
        ) {
          users.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Aplicar paginación
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const paginatedUsers = users.slice(offset, offset + limit);

      const formattedUsers = paginatedUsers.map(user => ({
        id: user.id,
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || user.names || '',
        phone: user.phone || user.mobile || '',
        is_admin: user.is_admin || false,
        role: user.role || (user.is_admin ? 'admin' : 'customer'),
        created_at: user.created_at?.toDate?.()?.toISOString() || user.created_at,
        last_login: user.last_login?.toDate?.()?.toISOString() || user.last_login,
        active: user.active !== false
      }));

      return res.status(200).json({
        ok: true,
        items: formattedUsers,
        page,
        limit,
        total: users.length,
        pages: Math.ceil(users.length / limit)
      });
    } else {
      // Sin filtros, obtener todos
      const snapshot = await query.get();
      const users = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        users.push({
          id: doc.id,
          ...data
        });
      });

      // Aplicar paginación
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const paginatedUsers = users.slice(offset, offset + limit);

      const formattedUsers = paginatedUsers.map(user => ({
        id: user.id,
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || user.names || '',
        phone: user.phone || user.mobile || '',
        is_admin: user.is_admin || false,
        role: user.role || (user.is_admin ? 'admin' : 'customer'),
        created_at: user.created_at?.toDate?.()?.toISOString() || user.created_at,
        last_login: user.last_login?.toDate?.()?.toISOString() || user.last_login,
        active: user.active !== false
      }));

      console.log(`👥 Found ${users.length} users in Firestore`);
      return res.status(200).json({
        ok: true,
        items: formattedUsers,
        page,
        limit,
        total: users.length,
        pages: Math.ceil(users.length / limit)
      });
    }

  } catch (error) {
    console.error('👥 Admin users error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      ok: false
    });
  }
}