const { db } = require('../lib/firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📦 Getting admin orders from Firestore');

  try {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Obtener órdenes de Firestore
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef
      .orderBy('created_at', 'desc')
      .limit(parseInt(req.query.limit) || 10)
      .get();

    const orders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        guide: data.guide || `ORD-${doc.id}`,
        client: data.client_name || 'N/A',
        address: 'N/A', // Simplificado
        date: data.created_at?.toDate?.()?.toISOString() || data.created_at,
        total: data.total || 0,
        status: data.status || 'Pre alerta'
      });
    });

    console.log(`📦 Found ${orders.length} orders in Firestore`);

    return res.status(200).json({
      ok: true,
      orders: orders
    });

  } catch (error) {
    console.error('📦 Admin orders error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      ok: false
    });
  }
}